"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Shuffle,
  ArrowLeft,
  Loader2,
  Check,
  CheckCheck,
  Users,
  Swords,
  Crown,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  player_id: string;
  role: string;
  player: { id: string; alias: string; avatar_url: string | null; stars: number };
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  stars: number;
  wins: number;
  losses: number;
  team_members: TeamMember[];
}

interface TeamPair {
  team1: Team;
  team2: Team;
}

interface CreatedMatch {
  id: string;
  stars_bet: number;
  team1: { id: string; name: string; logo_url: string | null; stars: number } | null;
  team2: { id: string; name: string; logo_url: string | null; stars: number } | null;
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TeamRandomMatchPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [withStars, setWithStars] = useState(false);
  const [starsBet, setStarsBet] = useState(0);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Preview state
  const [previewPairs, setPreviewPairs] = useState<TeamPair[]>([]);
  const [byeTeam, setByeTeam] = useState<Team | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Announcement state
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);

  // Result state
  const [createdMatches, setCreatedMatches] = useState<CreatedMatch[]>([]);
  const [resultBye, setResultBye] = useState<{ id: string; name: string; logo_url?: string | null } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("players")
        .select("is_admin, is_judge")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin && !profile?.is_judge) {
        router.push("/dashboard");
        return;
      }

      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          // Only teams with 3 members
          setTeams(data.filter((t: Team) => (t.team_members?.length ?? 0) >= 3));
        }
      } catch {
        toast.error("Error al cargar equipos");
      }

      setLoadingTeams(false);
    }
    fetchData();
  }, [router]);

  function toggleTeam(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setShowPreview(false);
  }

  function selectAll() {
    setSelectedIds(new Set(teams.map((t) => t.id)));
    setShowPreview(false);
  }

  function deselectAll() {
    setSelectedIds(new Set());
    setShowPreview(false);
  }

  const handleShuffle = useCallback(() => {
    const selected = teams.filter((t) => selectedIds.has(t.id));
    if (selected.length < 2) {
      toast.error("Selecciona al menos 2 equipos");
      return;
    }

    setGenerating(true);
    setTimeout(() => {
      const shuffled = shuffleArray(selected);
      const pairs: TeamPair[] = [];
      let bye: Team | null = null;
      const toPair = [...shuffled];

      if (toPair.length % 2 !== 0) bye = toPair.pop()!;
      for (let i = 0; i < toPair.length; i += 2) {
        pairs.push({ team1: toPair[i], team2: toPair[i + 1] });
      }

      setPreviewPairs(pairs);
      setByeTeam(bye);
      setShowPreview(true);
      setGenerating(false);
    }, 400);
  }, [teams, selectedIds]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await fetch("/api/team-matches/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_ids: Array.from(selectedIds),
          stars_bet: starsBet,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear partidas");
        setConfirming(false);
        return;
      }

      setCreatedMatches(data.matches);
      setResultBye(data.bye_team);
      setShowAnnouncement(true);
      setVisibleCards(0);
      const totalCards = data.matches.length + (data.bye_team ? 1 : 0);
      for (let i = 1; i <= totalCards; i++) {
        setTimeout(() => setVisibleCards(i), i * 500);
      }
      toast.success(`${data.matches.length} partidas creadas`);
    } catch {
      toast.error("Error de conexion");
    } finally {
      setConfirming(false);
    }
  }

  const normalizedSearch = searchQuery.toLowerCase().trim();
  const filteredTeams = normalizedSearch
    ? teams.filter((t) => t.name.toLowerCase().includes(normalizedSearch))
    : teams;

  const selectedCount = selectedIds.size;
  const matchCount = Math.floor(selectedCount / 2);
  const hasBye = selectedCount % 2 !== 0;

  if (loadingTeams) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-blue animate-spin" />
      </div>
    );
  }

  // Result view
  if (createdMatches.length > 0) {
    return (
      <div className="max-w-lg mx-auto pb-8">
        <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-green/20 via-omega-blue/10 to-omega-dark shadow-lg shadow-omega-green/10 mb-8">
          <div className="px-5 pt-5 pb-6">
            <Link href="/dashboard" className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-omega-green/20 flex items-center justify-center">
                <CheckCheck className="size-5 text-omega-green" />
              </div>
              <h1 className="text-2xl font-black neon-green">PARTIDAS CREADAS</h1>
            </div>
          </div>
        </div>

        {showAnnouncement && (
          <div className="px-4 space-y-3 mb-6">
            {createdMatches.map((match, idx) => {
              if (idx >= visibleCards) return null;
              return (
                <div
                  key={match.id}
                  className="animate-announce rounded-2xl overflow-hidden border border-omega-purple/30 bg-gradient-to-r from-omega-card via-omega-surface to-omega-card shadow-lg shadow-omega-purple/10"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-omega-dark/60 border-b border-omega-border/20">
                    <span className="text-[10px] font-black text-omega-purple uppercase tracking-widest">Partida {idx + 1}</span>
                    {match.stars_bet > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-omega-gold fill-omega-gold" />
                        <span className="text-xs font-black text-omega-gold">{match.stars_bet}</span>
                      </div>
                    ) : (
                      <span className="omega-badge omega-badge-green text-[9px]">Amistoso</span>
                    )}
                  </div>
                  <div className="flex items-center px-4 py-4">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="size-14 rounded-xl bg-omega-purple/15 flex items-center justify-center overflow-hidden border border-omega-purple/30">
                        {match.team1?.logo_url ? (
                          <img src={match.team1.logo_url} alt={match.team1.name} className="size-full object-cover" />
                        ) : (
                          <Users className="size-6 text-omega-purple" />
                        )}
                      </div>
                      <p className="text-sm font-black text-omega-text text-center truncate max-w-[100px]">
                        {match.team1?.name ?? "???"}
                      </p>
                    </div>
                    <span className="text-2xl font-black neon-red animate-vs-pulse inline-block px-3">VS</span>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="size-14 rounded-xl bg-omega-blue/15 flex items-center justify-center overflow-hidden border border-omega-blue/30">
                        {match.team2?.logo_url ? (
                          <img src={match.team2.logo_url} alt={match.team2.name} className="size-full object-cover" />
                        ) : (
                          <Users className="size-6 text-omega-blue" />
                        )}
                      </div>
                      <p className="text-sm font-black text-omega-text text-center truncate max-w-[100px]">
                        {match.team2?.name ?? "???"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {resultBye && visibleCards > createdMatches.length && (
              <div className="animate-announce rounded-2xl overflow-hidden border border-omega-blue/30 bg-gradient-to-r from-omega-card via-omega-surface to-omega-card shadow-lg shadow-omega-blue/10">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="size-12 rounded-xl bg-omega-blue/15 flex items-center justify-center overflow-hidden border border-omega-blue/30">
                    <Users className="size-5 text-omega-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-omega-blue">{resultBye.name}</p>
                    <p className="text-xs text-omega-muted">Descansa esta ronda</p>
                  </div>
                  <Crown className="size-5 text-omega-blue" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-4 pt-4 flex gap-3">
          <Link href="/dashboard" className="omega-btn omega-btn-secondary flex-1 py-3 text-sm justify-center">
            Dashboard
          </Link>
          <button
            onClick={() => {
              setCreatedMatches([]);
              setResultBye(null);
              setShowPreview(false);
              setPreviewPairs([]);
              setByeTeam(null);
              setSelectedIds(new Set());
              setShowAnnouncement(false);
              setVisibleCards(0);
            }}
            className="omega-btn omega-btn-primary flex-1 py-3 text-sm"
          >
            <Shuffle className="size-4" />
            Generar mas
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/20 via-omega-blue/10 to-omega-dark shadow-lg shadow-omega-purple/10 mb-8">
        <div className="px-5 pt-5 pb-6">
          <Link href="/dashboard" className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center">
              <Shuffle className="size-5 text-omega-purple" />
            </div>
            <h1 className="text-2xl font-black neon-purple">SORTEO EQUIPOS</h1>
          </div>
          <p className="text-xs text-omega-muted mt-2">
            Selecciona los equipos presentes y genera partidas al azar
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Match mode */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">Modo de partida</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setWithStars(false); setStarsBet(0); setShowPreview(false); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                !withStars
                  ? "bg-omega-green/20 text-omega-green border border-omega-green/40"
                  : "bg-omega-surface border border-omega-border/30 text-omega-muted"
              }`}
            >
              <Swords className="size-3.5" />
              Amistoso
            </button>
            <button
              onClick={() => { setWithStars(true); setStarsBet(1); setShowPreview(false); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                withStars
                  ? "bg-omega-gold/20 text-omega-gold border border-omega-gold/40"
                  : "bg-omega-surface border border-omega-border/30 text-omega-muted"
              }`}
            >
              <Star className="size-3.5" />
              Con estrellas
            </button>
          </div>
          {withStars && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => { setStarsBet(n); setShowPreview(false); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                    starsBet === n
                      ? "bg-omega-gold/20 text-omega-gold border border-omega-gold/40"
                      : "bg-omega-surface border border-omega-border/30 text-omega-muted"
                  }`}
                >
                  <Star className={`size-3.5 ${starsBet === n ? "text-omega-gold fill-omega-gold" : "text-omega-muted"}`} />
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Team selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Equipos ({selectedCount}/{teams.length})
            </label>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-[10px] font-bold text-omega-purple uppercase tracking-wider">Todos</button>
              <span className="text-omega-muted/30">|</span>
              <button onClick={deselectAll} className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">Ninguno</button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar equipo..."
              className="omega-input pl-9"
            />
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredTeams.map((team) => {
              const isSelected = selectedIds.has(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all border ${
                    isSelected
                      ? "bg-omega-purple/10 border-omega-purple/40"
                      : "bg-omega-surface border-omega-border/30 hover:border-omega-purple/30"
                  }`}
                >
                  <div className={`size-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? "bg-omega-purple border-omega-purple" : "border-omega-border/50"
                  }`}>
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>
                  <div className="size-9 rounded-xl bg-omega-purple/15 flex items-center justify-center overflow-hidden shrink-0">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="size-full object-cover" />
                    ) : (
                      <Users className="size-4 text-omega-purple" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-omega-text truncate">{team.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-omega-muted">
                      <span>{team.team_members?.length ?? 0} miembros</span>
                      <span>-</span>
                      <span>{team.wins}W/{team.losses}L</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="size-2.5 text-omega-gold fill-omega-gold" />
                    <span className="text-[10px] text-omega-muted">{team.stars}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info bar */}
        {selectedCount >= 2 && (
          <div className="rounded-xl bg-omega-surface border border-omega-border/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-omega-blue" />
              <span className="text-xs text-omega-muted">{selectedCount} equipos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Swords className="size-3.5 text-omega-purple" />
                <span className="text-xs font-bold text-omega-text">{matchCount} partidas</span>
              </div>
              {hasBye && <span className="omega-badge omega-badge-blue text-[9px]">1 BYE</span>}
            </div>
          </div>
        )}

        {/* Shuffle / Preview / Confirm */}
        {!showPreview && (
          <button
            onClick={handleShuffle}
            disabled={selectedCount < 2 || generating}
            className="omega-btn omega-btn-purple w-full py-3 text-sm"
          >
            {generating ? <Loader2 className="size-5 animate-spin" /> : (
              <>
                <Shuffle className="size-5" />
                Sortear y emparejar
              </>
            )}
          </button>
        )}

        {showPreview && previewPairs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider">Vista previa</h2>
              <button onClick={handleShuffle} className="text-[10px] font-bold text-omega-purple flex items-center gap-1">
                <Shuffle className="size-3" />
                Re-sortear
              </button>
            </div>

            <div className="space-y-2">
              {previewPairs.map((pair, idx) => (
                <div key={`${pair.team1.id}-${pair.team2.id}`} className="rounded-xl border-l-4 border-l-omega-purple bg-omega-card px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-omega-muted uppercase">Partida {idx + 1}</span>
                    {starsBet > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-omega-gold fill-omega-gold" />
                        <span className="text-xs font-bold text-omega-gold">{starsBet}</span>
                      </div>
                    ) : (
                      <span className="omega-badge omega-badge-green text-[9px]">Amistoso</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="flex-1 text-center">
                      <p className="text-sm font-bold text-omega-text">{pair.team1.name}</p>
                    </div>
                    <span className="text-xs font-bold text-omega-muted">VS</span>
                    <div className="flex-1 text-center">
                      <p className="text-sm font-bold text-omega-text">{pair.team2.name}</p>
                    </div>
                  </div>
                </div>
              ))}

              {byeTeam && (
                <div className="rounded-xl border-l-4 border-l-omega-blue bg-omega-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Crown className="size-4 text-omega-blue" />
                    <span className="text-sm text-omega-muted">BYE:</span>
                    <span className="text-sm font-bold text-omega-blue">{byeTeam.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPreview(false); setPreviewPairs([]); setByeTeam(null); }}
                className="omega-btn omega-btn-secondary flex-1 py-3 text-sm justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="omega-btn omega-btn-green flex-1 py-3 text-sm"
              >
                {confirming ? <Loader2 className="size-5 animate-spin" /> : (
                  <>
                    <CheckCheck className="size-5" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
