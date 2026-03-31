"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Swords,
  Star,
  Clock,
  Check,
  X,
  Search,
  ChevronDown,
  Layers,
  Trophy,
  Crown,
  Zap,
  Shield,
  Play,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerInfo {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
}

interface DeckSlotSnapshot {
  blade: string;
  ratchet: string;
  bit: string;
}

interface DeckSnapshot {
  slot1: DeckSlotSnapshot;
  slot2: DeckSlotSnapshot;
  slot3: DeckSlotSnapshot;
}

interface DeckBattle {
  id: string;
  challenger_id: string;
  opponent_id: string;
  omega_coins_bet: number;
  status: string;
  winner_id: string | null;
  round1_winner: string | null;
  round2_winner: string | null;
  round3_winner: string | null;
  challenger_deck: DeckSnapshot | null;
  opponent_deck: DeckSnapshot | null;
  created_at: string;
  challenger: PlayerInfo;
  opponent: PlayerInfo;
}

interface SearchPlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
}

type SectionKey = "active" | "pending" | "completed";

const SECTION_CONFIG: Record<SectionKey, { label: string; color: string; border: string }> = {
  active: { label: "EN JUEGO", color: "text-omega-green", border: "border-omega-green/30" },
  pending: { label: "PENDIENTES", color: "text-omega-gold", border: "border-omega-gold/30" },
  completed: { label: "FINALIZADOS", color: "text-omega-muted", border: "border-white/10" },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DeckBattlesPage() {
  const [battles, setBattles] = useState<DeckBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    active: true,
    pending: true,
    completed: false,
  });
  const [expandedBattle, setExpandedBattle] = useState<string | null>(null);

  // Challenge form state
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchPlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<SearchPlayer | null>(null);
  const [coinsBet, setCoinsBet] = useState(0);
  const [creating, setCreating] = useState(false);

  // Auth
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: player } = await supabase
          .from("players")
          .select("is_admin, is_judge")
          .eq("id", user.id)
          .single();
        setIsAdmin(player?.is_admin || player?.is_judge || false);
      }
    }
    getUser();
  }, []);

  const fetchBattles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deck-battles?filter=all");
      if (res.ok) {
        const data = await res.json();
        setBattles(data);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  // Search players
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("players")
          .select("id, alias, avatar_url, stars")
          .ilike("alias", `%${searchQuery}%`)
          .neq("id", userId ?? "")
          .eq("is_eliminated", false)
          .eq("is_admin", false)
          .limit(8);
        setSearchResults(data ?? []);
      } catch {
        // silent
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, userId]);

  // Actions
  async function handleAction(battleId: string, action: string) {
    setActioning(battleId);
    try {
      const res = await fetch(`/api/deck-battles/${battleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchBattles();
        const msgs: Record<string, string> = {
          accept: "Reto aceptado! Deck Battle en curso",
          decline: "Reto rechazado",
          cancel: "Reto cancelado",
        };
        toast.success(msgs[action] ?? "Accion completada");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Error");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setActioning(null);
  }

  async function handleResolveRound(battleId: string, round: number, winnerId: string) {
    setActioning(battleId);
    try {
      const res = await fetch(`/api/deck-battles/${battleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_round", round, winner_id: winnerId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.battle_winner) {
          toast.success("Deck Battle finalizado!");
        } else {
          toast.success(`Round ${round} resuelto`);
        }
        await fetchBattles();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Error");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setActioning(null);
  }

  async function handleCreateChallenge() {
    if (!selectedOpponent) return;
    setCreating(true);
    try {
      const res = await fetch("/api/deck-battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent_id: selectedOpponent.id,
          omega_coins_bet: coinsBet,
        }),
      });
      if (res.ok) {
        toast.success(`Reto 3v3 enviado a ${selectedOpponent.alias}!`);
        setShowChallengeForm(false);
        setSelectedOpponent(null);
        setSearchQuery("");
        setCoinsBet(0);
        await fetchBattles();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Error al crear reto");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setCreating(false);
  }

  // Grouping
  const activeBattles = battles.filter((b) => b.status === "in_progress" || b.status === "accepted");
  const pendingBattles = battles.filter((b) => b.status === "pending");
  const completedBattles = battles.filter((b) => b.status === "completed" || b.status === "cancelled");

  const sections: { key: SectionKey; items: DeckBattle[] }[] = [
    { key: "active", items: activeBattles },
    { key: "pending", items: pendingBattles },
    { key: "completed", items: completedBattles },
  ];

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-omega-purple/30 to-omega-gold/20 border border-omega-gold/30 flex items-center justify-center">
            <Swords className="size-5 text-omega-gold" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">
              Deck Battles <span className="text-omega-gold">3v3</span>
            </h1>
            <p className="text-xs text-omega-muted">
              Batallas de deck completo, round por round
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-4 flex gap-2">
        <Link
          href="/deck"
          className="omega-btn omega-btn-secondary py-2 px-3 text-xs flex-1 justify-center"
        >
          <Layers className="size-3.5" />
          Mi Deck
        </Link>
        <button
          onClick={() => setShowChallengeForm(!showChallengeForm)}
          className="omega-btn omega-btn-gold py-2 px-3 text-xs flex-1 justify-center"
        >
          <Zap className="size-3.5" />
          Retar a 3v3
        </button>
      </div>

      {/* Challenge form */}
      {showChallengeForm && (
        <div className="px-4">
          <div className="omega-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-omega-text flex items-center gap-2">
              <Zap className="size-4 text-omega-gold" />
              Nuevo Deck Battle
            </h3>

            {/* Search opponent */}
            {!selectedOpponent ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-omega-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar blader..."
                    className="omega-input pl-9"
                  />
                </div>
                {searching && (
                  <div className="flex items-center gap-2 text-xs text-omega-muted px-1">
                    <Loader2 className="size-3 animate-spin" />
                    Buscando...
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="rounded-xl bg-omega-surface border border-omega-border/30 overflow-hidden max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedOpponent(p);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-omega-card transition-colors border-b border-white/[0.04] last:border-b-0"
                      >
                        <div className="size-7 rounded-full bg-omega-dark border border-omega-border/30 overflow-hidden shrink-0">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.alias} className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-xs font-bold text-omega-purple">
                              {p.alias.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-omega-text flex-1 text-left truncate">
                          {p.alias}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="size-3 text-omega-gold fill-omega-gold" />
                          <span className="text-xs font-bold text-omega-gold">{p.stars}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-omega-surface rounded-xl px-3 py-2.5 border border-omega-border/30">
                <div className="size-8 rounded-full bg-omega-dark border border-omega-border/30 overflow-hidden shrink-0">
                  {selectedOpponent.avatar_url ? (
                    <img src={selectedOpponent.avatar_url} alt={selectedOpponent.alias} className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs font-bold text-omega-purple">
                      {selectedOpponent.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-omega-text flex-1 truncate">
                  {selectedOpponent.alias}
                </span>
                <button
                  onClick={() => setSelectedOpponent(null)}
                  className="size-6 rounded-lg bg-omega-dark flex items-center justify-center hover:bg-omega-card-hover"
                >
                  <X className="size-3.5 text-omega-muted" />
                </button>
              </div>
            )}

            {/* OC bet */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-omega-muted mb-1 tracking-wider">
                Omega Coins apostadas (0-10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={coinsBet}
                onChange={(e) => setCoinsBet(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                className="omega-input"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleCreateChallenge}
              disabled={!selectedOpponent || creating}
              className="omega-btn omega-btn-gold w-full py-2.5 text-sm"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Swords className="size-4" />
              )}
              {creating ? "Enviando..." : "Enviar Reto 3v3"}
            </button>
          </div>
        </div>
      )}

      {/* Battles list */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="omega-card p-10 text-center">
            <Loader2 className="size-6 text-omega-muted animate-spin mx-auto" />
          </div>
        ) : battles.length === 0 ? (
          <div className="omega-card p-8 text-center space-y-2">
            <Swords className="size-8 text-omega-muted/30 mx-auto" />
            <p className="text-sm text-omega-muted">No hay deck battles todavia</p>
            <p className="text-xs text-omega-muted/60">
              Arma tu deck y reta a alguien
            </p>
          </div>
        ) : (
          sections.map(({ key, items }) => {
            if (items.length === 0) return null;
            const config = SECTION_CONFIG[key];
            return (
              <div key={key} className="space-y-2">
                <button
                  onClick={() => setOpenSections((p) => ({ ...p, [key]: !p[key] }))}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${config.border} bg-omega-surface/60`}
                >
                  <span className={`text-[11px] font-black uppercase tracking-wider ${config.color}`}>
                    {config.label} ({items.length})
                  </span>
                  <ChevronDown
                    className={`size-4 text-omega-muted transition-transform ${openSections[key] ? "rotate-180" : ""}`}
                  />
                </button>

                {openSections[key] && (
                  <div className="space-y-3">
                    {items.map((battle) => (
                      <BattleCard
                        key={battle.id}
                        battle={battle}
                        userId={userId}
                        isAdmin={isAdmin}
                        actioning={actioning}
                        expanded={expandedBattle === battle.id}
                        onToggleExpand={() =>
                          setExpandedBattle(expandedBattle === battle.id ? null : battle.id)
                        }
                        onAction={handleAction}
                        onResolveRound={handleResolveRound}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Battle Card
// ---------------------------------------------------------------------------

function BattleCard({
  battle,
  userId,
  isAdmin,
  actioning,
  expanded,
  onToggleExpand,
  onAction,
  onResolveRound,
}: {
  battle: DeckBattle;
  userId: string | null;
  isAdmin: boolean;
  actioning: string | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onAction: (id: string, action: string) => void;
  onResolveRound: (id: string, round: number, winnerId: string) => void;
}) {
  const isChallenger = userId === battle.challenger_id;
  const isOpponent = userId === battle.opponent_id;
  const isParticipant = isChallenger || isOpponent;
  const isActioning = actioning === battle.id;

  // Round results
  const rounds = [battle.round1_winner, battle.round2_winner, battle.round3_winner];
  const challengerRoundWins = rounds.filter((w) => w === battle.challenger_id).length;
  const opponentRoundWins = rounds.filter((w) => w === battle.opponent_id).length;

  // Status styling
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pendiente", color: "text-omega-gold", bg: "bg-omega-gold/10" },
    accepted: { label: "Aceptado", color: "text-omega-green", bg: "bg-omega-green/10" },
    in_progress: { label: "En Juego", color: "text-omega-green", bg: "bg-omega-green/10" },
    completed: { label: "Finalizado", color: "text-omega-blue", bg: "bg-omega-blue/10" },
    cancelled: { label: "Cancelado", color: "text-omega-muted", bg: "bg-omega-muted/10" },
  };
  const statusInfo = statusConfig[battle.status] ?? statusConfig.pending;

  return (
    <div className="omega-card overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center gap-3"
      >
        {/* Challenger */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-sm font-bold text-omega-text truncate">
            {battle.challenger.alias}
          </p>
          {battle.status === "in_progress" || battle.status === "completed" ? (
            <p className="text-lg font-black text-omega-gold">{challengerRoundWins}</p>
          ) : null}
        </div>

        {/* VS badge */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="size-10 rounded-full bg-gradient-to-br from-omega-purple/30 to-omega-gold/20 border border-omega-gold/30 flex items-center justify-center">
            <span className="text-xs font-black text-omega-gold">VS</span>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${statusInfo.bg} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {battle.omega_coins_bet > 0 && (
            <span className="text-[9px] text-omega-gold font-bold">
              {battle.omega_coins_bet} OC
            </span>
          )}
        </div>

        {/* Opponent */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-omega-text truncate">
            {battle.opponent.alias}
          </p>
          {battle.status === "in_progress" || battle.status === "completed" ? (
            <p className="text-lg font-black text-omega-gold">{opponentRoundWins}</p>
          ) : null}
        </div>

        <ChevronDown
          className={`size-4 text-omega-muted shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {/* Round-by-round */}
          {(battle.status === "in_progress" || battle.status === "completed") && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-omega-muted">
                Rounds
              </h4>
              {[1, 2, 3].map((roundNum) => {
                const roundWinner = rounds[roundNum - 1];
                const challengerSlot = battle.challenger_deck
                  ? battle.challenger_deck[`slot${roundNum}` as keyof DeckSnapshot]
                  : null;
                const opponentSlot = battle.opponent_deck
                  ? battle.opponent_deck[`slot${roundNum}` as keyof DeckSnapshot]
                  : null;

                const challengerWonRound = roundWinner === battle.challenger_id;
                const opponentWonRound = roundWinner === battle.opponent_id;
                const isPlayed = roundWinner !== null;

                // Determine if this round is the next to play
                const playedRounds = rounds.filter(Boolean).length;
                const isNextRound = !isPlayed && playedRounds === roundNum - 1 && battle.status === "in_progress";

                return (
                  <div
                    key={roundNum}
                    className={`rounded-xl border p-3 ${
                      isNextRound
                        ? "border-omega-gold/40 bg-omega-gold/5"
                        : isPlayed
                          ? "border-white/[0.06] bg-omega-surface/40"
                          : "border-white/[0.04] bg-omega-dark/40"
                    }`}
                  >
                    {/* Round label */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isNextRound ? "text-omega-gold" : isPlayed ? "text-omega-text" : "text-omega-muted/50"
                      }`}>
                        Round {roundNum}
                        {isNextRound && (
                          <span className="ml-1.5 inline-flex items-center gap-1 text-omega-gold">
                            <Play className="size-2.5 fill-omega-gold" /> NEXT
                          </span>
                        )}
                      </span>
                      {isPlayed && (
                        <span className="text-[10px] font-bold text-omega-green">
                          <Check className="size-3 inline" /> Resuelto
                        </span>
                      )}
                    </div>

                    {/* Matchup */}
                    <div className="flex items-center gap-2">
                      {/* Challenger side */}
                      <div className={`flex-1 rounded-lg p-2 text-center ${
                        challengerWonRound ? "bg-omega-green/10 border border-omega-green/30" : "bg-omega-dark/60"
                      }`}>
                        {challengerSlot ? (
                          <>
                            <p className="text-xs font-bold text-omega-text truncate">
                              {challengerSlot.blade}
                            </p>
                            <p className="text-[10px] text-omega-muted truncate">
                              {challengerSlot.ratchet} {challengerSlot.bit}
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] text-omega-muted">---</p>
                        )}
                        {challengerWonRound && (
                          <Crown className="size-3.5 text-omega-gold mx-auto mt-1" />
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-omega-muted shrink-0">vs</span>

                      {/* Opponent side */}
                      <div className={`flex-1 rounded-lg p-2 text-center ${
                        opponentWonRound ? "bg-omega-green/10 border border-omega-green/30" : "bg-omega-dark/60"
                      }`}>
                        {opponentSlot ? (
                          <>
                            <p className="text-xs font-bold text-omega-text truncate">
                              {opponentSlot.blade}
                            </p>
                            <p className="text-[10px] text-omega-muted truncate">
                              {opponentSlot.ratchet} {opponentSlot.bit}
                            </p>
                          </>
                        ) : (
                          <p className="text-[10px] text-omega-muted">---</p>
                        )}
                        {opponentWonRound && (
                          <Crown className="size-3.5 text-omega-gold mx-auto mt-1" />
                        )}
                      </div>
                    </div>

                    {/* Judge resolve buttons */}
                    {isAdmin && isNextRound && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => onResolveRound(battle.id, roundNum, battle.challenger_id)}
                          disabled={isActioning}
                          className="omega-btn omega-btn-green flex-1 py-1.5 text-[10px]"
                        >
                          {isActioning ? <Loader2 className="size-3 animate-spin" /> : <Trophy className="size-3" />}
                          {battle.challenger.alias} gana
                        </button>
                        <button
                          onClick={() => onResolveRound(battle.id, roundNum, battle.opponent_id)}
                          disabled={isActioning}
                          className="omega-btn omega-btn-blue flex-1 py-1.5 text-[10px]"
                        >
                          {isActioning ? <Loader2 className="size-3 animate-spin" /> : <Trophy className="size-3" />}
                          {battle.opponent.alias} gana
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Winner banner */}
          {battle.status === "completed" && battle.winner_id && (
            <div className="rounded-xl bg-gradient-to-r from-omega-gold/20 via-omega-gold/10 to-transparent border border-omega-gold/30 p-3 flex items-center gap-3">
              <Trophy className="size-5 text-omega-gold shrink-0" />
              <div>
                <p className="text-xs font-black text-omega-gold uppercase tracking-wider">
                  Ganador
                </p>
                <p className="text-sm font-bold text-omega-text">
                  {battle.winner_id === battle.challenger_id
                    ? battle.challenger.alias
                    : battle.opponent.alias}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-black text-omega-gold">
                  {challengerRoundWins}-{opponentRoundWins}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons for pending */}
          {battle.status === "pending" && isOpponent && (
            <div className="flex gap-2">
              <button
                onClick={() => onAction(battle.id, "accept")}
                disabled={isActioning}
                className="omega-btn omega-btn-green flex-1 py-2.5 text-xs"
              >
                {isActioning ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Aceptar
              </button>
              <button
                onClick={() => onAction(battle.id, "decline")}
                disabled={isActioning}
                className="omega-btn omega-btn-red flex-1 py-2.5 text-xs"
              >
                {isActioning ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                Rechazar
              </button>
            </div>
          )}

          {/* Cancel for challenger */}
          {battle.status === "pending" && isChallenger && (
            <button
              onClick={() => onAction(battle.id, "cancel")}
              disabled={isActioning}
              className="omega-btn omega-btn-secondary w-full py-2 text-xs"
            >
              {isActioning ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              Cancelar reto
            </button>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-omega-muted/60 text-center">
            {new Date(battle.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
