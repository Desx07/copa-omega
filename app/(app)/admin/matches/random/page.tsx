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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id: string;
  alias: string;
  stars: number;
  is_eliminated: boolean;
}

interface MatchPair {
  player1: Player;
  player2: Player;
}

interface CreatedMatch {
  id: string;
  player1: { id: string; alias: string; stars: number } | null;
  player2: { id: string; alias: string; stars: number } | null;
  stars_bet: number;
}

// ---------------------------------------------------------------------------
// Fisher-Yates shuffle (client-side preview)
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function RandomMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [withStars, setWithStars] = useState(false);
  const [starsBet, setStarsBet] = useState(0);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Preview state
  const [previewPairs, setPreviewPairs] = useState<MatchPair[]>([]);
  const [byePlayer, setByePlayer] = useState<Player | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Result state
  const [createdMatches, setCreatedMatches] = useState<CreatedMatch[]>([]);
  const [resultBye, setResultBye] = useState<{ id: string; alias: string } | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("players")
        .select("is_admin, is_judge")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin && !profile?.is_judge) {
        router.push("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("players")
        .select("id, alias, stars, is_eliminated")
        .eq("is_eliminated", false)
        .order("alias", { ascending: true });

      if (error) {
        toast.error("Error al cargar jugadores");
        return;
      }

      setPlayers(data ?? []);
      setLoadingPlayers(false);
    }

    fetchPlayers();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Reset preview al cambiar seleccion
    setShowPreview(false);
    setPreviewPairs([]);
    setByePlayer(null);
  }

  function selectAll() {
    // Si es amistoso (sin estrellas), seleccionar todos; si no, solo los que tienen suficientes
    const eligible = withStars
      ? players.filter((p) => p.stars >= starsBet)
      : players;
    setSelectedIds(new Set(eligible.map((p) => p.id)));
    setShowPreview(false);
    setPreviewPairs([]);
    setByePlayer(null);
  }

  function deselectAll() {
    setSelectedIds(new Set());
    setShowPreview(false);
    setPreviewPairs([]);
    setByePlayer(null);
  }

  // ---------------------------------------------------------------------------
  // Shuffle & Preview (client-side)
  // ---------------------------------------------------------------------------

  const handleShuffle = useCallback(() => {
    const selectedPlayers = players.filter((p) => selectedIds.has(p.id));

    if (selectedPlayers.length < 2) {
      toast.error("Selecciona al menos 2 jugadores");
      return;
    }

    // Verificar estrellas suficientes (solo si se apuestan estrellas)
    if (withStars && starsBet > 0) {
      const poor = selectedPlayers.find((p) => p.stars < starsBet);
      if (poor) {
        toast.error(`${poor.alias} no tiene suficientes estrellas (tiene ${poor.stars})`);
        return;
      }
    }

    setGenerating(true);

    // Pequeno delay para feedback visual
    setTimeout(() => {
      const shuffled = shuffleArray(selectedPlayers);
      const pairs: MatchPair[] = [];
      let bye: Player | null = null;

      const toPair = [...shuffled];
      if (toPair.length % 2 !== 0) {
        bye = toPair.pop()!;
      }

      for (let i = 0; i < toPair.length; i += 2) {
        pairs.push({
          player1: toPair[i],
          player2: toPair[i + 1],
        });
      }

      setPreviewPairs(pairs);
      setByePlayer(bye);
      setShowPreview(true);
      setGenerating(false);
    }, 400);
  }, [players, selectedIds, starsBet]);

  // ---------------------------------------------------------------------------
  // Confirm & Create (server-side)
  // ---------------------------------------------------------------------------

  async function handleConfirm() {
    setConfirming(true);

    try {
      const res = await fetch("/api/matches/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_ids: Array.from(selectedIds),
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
      setResultBye(data.bye_player);
      toast.success(`${data.matches.length} partidas creadas`);
    } catch {
      toast.error("Error de conexion");
    } finally {
      setConfirming(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const selectedCount = selectedIds.size;
  const matchCount = Math.floor(selectedCount / 2);
  const hasBye = selectedCount % 2 !== 0;

  // Jugadores con estrellas insuficientes (solo relevante cuando se apuestan estrellas)
  const insufficientStars = withStars
    ? players.filter((p) => selectedIds.has(p.id) && p.stars < starsBet)
    : [];

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loadingPlayers) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-blue animate-spin" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Result view (despues de confirmar)
  // ---------------------------------------------------------------------------

  if (createdMatches.length > 0) {
    return (
      <div className="max-w-lg mx-auto pb-8">
        {/* Hero */}
        <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-green/20 via-omega-blue/10 to-omega-dark shadow-lg shadow-omega-green/10 mb-8">
          <div className="px-5 pt-5 pb-6">
            <Link
              href="/admin/matches"
              className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
            >
              <ArrowLeft className="size-3.5" />
              Partidas
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-omega-green/20 flex items-center justify-center">
                <CheckCheck className="size-5 text-omega-green" />
              </div>
              <h1 className="text-2xl font-black neon-green">
                PARTIDAS CREADAS
              </h1>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-3">
          {createdMatches.map((match, idx) => (
            <Link
              key={match.id}
              href={`/admin/matches/${match.id}`}
              className="block rounded-xl border-l-4 border-l-omega-gold bg-omega-card px-4 py-3 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="omega-badge omega-badge-gold">
                  PARTIDA {idx + 1}
                </span>
                {match.stars_bet > 0 ? (
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                    <span className="text-sm font-black text-omega-gold">
                      {match.stars_bet}
                    </span>
                  </div>
                ) : (
                  <span className="omega-badge omega-badge-green text-[9px]">
                    Amistoso
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 justify-center">
                <span className="text-sm font-bold text-omega-text">
                  {match.player1?.alias ?? "???"}
                </span>
                <span className="text-xs font-bold text-omega-muted">VS</span>
                <span className="text-sm font-bold text-omega-text">
                  {match.player2?.alias ?? "???"}
                </span>
              </div>
            </Link>
          ))}

          {resultBye && (
            <div className="rounded-xl border-l-4 border-l-omega-blue bg-omega-card px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-omega-blue" />
                <span className="text-sm text-omega-muted">BYE:</span>
                <span className="text-sm font-bold text-omega-blue">
                  {resultBye.alias}
                </span>
                <span className="text-xs text-omega-muted">
                  (descansa esta ronda)
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Link
              href="/admin/matches"
              className="omega-btn omega-btn-secondary flex-1 py-3 text-sm justify-center"
            >
              Ver partidas
            </Link>
            <button
              onClick={() => {
                setCreatedMatches([]);
                setResultBye(null);
                setShowPreview(false);
                setPreviewPairs([]);
                setByePlayer(null);
                setSelectedIds(new Set());
              }}
              className="omega-btn omega-btn-primary flex-1 py-3 text-sm"
            >
              <Shuffle className="size-4" />
              Generar mas
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main form view
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/20 via-omega-blue/10 to-omega-dark shadow-lg shadow-omega-purple/10 mb-8">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/admin/matches"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Partidas
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center">
              <Shuffle className="size-5 text-omega-purple" />
            </div>
            <h1 className="text-2xl font-black neon-purple">SORTEO ALEATORIO</h1>
          </div>
          <p className="text-xs text-omega-muted mt-2">
            Selecciona los bladers presentes y genera partidas al azar
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Modo de partida: Sin estrellas / Con estrellas */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Modo de partida
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setWithStars(false);
                setStarsBet(0);
                setShowPreview(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                !withStars
                  ? "bg-omega-green/20 text-omega-green border border-omega-green/40 shadow-sm"
                  : "bg-omega-surface border border-omega-border/30 text-omega-muted hover:border-omega-green/30"
              }`}
              data-testid="mode-friendly"
            >
              <Swords className={`size-3.5 ${!withStars ? "text-omega-green" : "text-omega-muted"}`} />
              Amistoso
            </button>
            <button
              onClick={() => {
                setWithStars(true);
                setStarsBet(1);
                setShowPreview(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                withStars
                  ? "bg-omega-gold/20 text-omega-gold border border-omega-gold/40 shadow-sm"
                  : "bg-omega-surface border border-omega-border/30 text-omega-muted hover:border-omega-gold/30"
              }`}
              data-testid="mode-stars"
            >
              <Star className={`size-3.5 ${withStars ? "text-omega-gold fill-omega-gold" : "text-omega-muted"}`} />
              Con estrellas
            </button>
          </div>

          {/* Selector de estrellas (solo visible con estrellas) */}
          {withStars && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setStarsBet(n);
                    setShowPreview(false);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                    starsBet === n
                      ? "bg-omega-gold/20 text-omega-gold border border-omega-gold/40 shadow-sm"
                      : "bg-omega-surface border border-omega-border/30 text-omega-muted hover:border-omega-gold/30"
                  }`}
                  data-testid={`stars-bet-${n}`}
                >
                  <Star
                    className={`size-3.5 ${
                      starsBet === n
                        ? "text-omega-gold fill-omega-gold"
                        : "text-omega-muted"
                    }`}
                  />
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Player selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-omega-muted uppercase tracking-wider">
              Bladers presentes ({selectedCount}/{players.length})
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-[10px] font-bold text-omega-purple hover:text-omega-purple/80 transition-colors uppercase tracking-wider"
                data-testid="select-all-btn"
              >
                Todos
              </button>
              <span className="text-omega-muted/30">|</span>
              <button
                onClick={deselectAll}
                className="text-[10px] font-bold text-omega-muted hover:text-omega-red transition-colors uppercase tracking-wider"
                data-testid="deselect-all-btn"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
            {players.map((player) => {
              const isSelected = selectedIds.has(player.id);
              const notEnoughStars = withStars && player.stars < starsBet;

              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  disabled={notEnoughStars && !isSelected}
                  className={`relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all border ${
                    isSelected
                      ? notEnoughStars
                        ? "bg-omega-red/10 border-omega-red/40 text-omega-red"
                        : "bg-omega-purple/10 border-omega-purple/40"
                      : notEnoughStars
                        ? "bg-omega-surface/50 border-omega-border/20 opacity-40 cursor-not-allowed"
                        : "bg-omega-surface border-omega-border/30 hover:border-omega-purple/30"
                  }`}
                  data-testid={`player-checkbox-${player.id}`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`size-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? "bg-omega-purple border-omega-purple"
                        : "border-omega-border/50"
                    }`}
                  >
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-omega-text truncate">
                      {player.alias}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="size-2.5 text-omega-gold fill-omega-gold" />
                      <span
                        className={`text-[10px] ${
                          notEnoughStars ? "text-omega-red" : "text-omega-muted"
                        }`}
                      >
                        {player.stars}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Warning: jugadores sin estrellas suficientes */}
          {insufficientStars.length > 0 && (
            <p className="text-[11px] text-omega-red">
              {insufficientStars.map((p) => p.alias).join(", ")} no{" "}
              {insufficientStars.length === 1 ? "tiene" : "tienen"} suficientes
              estrellas para apostar {starsBet}
            </p>
          )}
        </div>

        {/* Info bar */}
        {selectedCount >= 2 && (
          <div className="rounded-xl bg-omega-surface border border-omega-border/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-omega-blue" />
              <span className="text-xs text-omega-muted">
                {selectedCount} bladers
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Swords className="size-3.5 text-omega-purple" />
                <span className="text-xs font-bold text-omega-text">
                  {matchCount} partidas
                </span>
              </div>
              {hasBye && (
                <span className="omega-badge omega-badge-blue text-[9px]">
                  1 BYE
                </span>
              )}
            </div>
          </div>
        )}

        {/* Shuffle button */}
        {!showPreview && (
          <button
            onClick={handleShuffle}
            disabled={selectedCount < 2 || generating || insufficientStars.length > 0}
            className="omega-btn omega-btn-purple w-full py-3 text-sm"
            data-testid="shuffle-btn"
          >
            {generating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Shuffle className="size-5" />
                Sortear y emparejar
              </>
            )}
          </button>
        )}

        {/* Preview */}
        {showPreview && previewPairs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider">
                Vista previa del sorteo
              </h2>
              <button
                onClick={handleShuffle}
                className="text-[10px] font-bold text-omega-purple hover:text-omega-purple/80 transition-colors uppercase tracking-wider flex items-center gap-1"
                data-testid="reshuffle-btn"
              >
                <Shuffle className="size-3" />
                Re-sortear
              </button>
            </div>

            <div className="space-y-2">
              {previewPairs.map((pair, idx) => (
                <div
                  key={`${pair.player1.id}-${pair.player2.id}`}
                  className="rounded-xl border-l-4 border-l-omega-purple bg-omega-card px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-omega-muted uppercase">
                      Partida {idx + 1}
                    </span>
                    {starsBet > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-omega-gold fill-omega-gold" />
                        <span className="text-xs font-bold text-omega-gold">
                          {starsBet}
                        </span>
                      </div>
                    ) : (
                      <span className="omega-badge omega-badge-green text-[9px]">
                        Amistoso
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="flex-1 text-center">
                      <p className="text-sm font-bold text-omega-text">
                        {pair.player1.alias}
                      </p>
                      <p className="text-[10px] text-omega-muted">
                        {pair.player1.stars} estrellas
                      </p>
                    </div>
                    <span className="text-xs font-bold text-omega-muted">
                      VS
                    </span>
                    <div className="flex-1 text-center">
                      <p className="text-sm font-bold text-omega-text">
                        {pair.player2.alias}
                      </p>
                      <p className="text-[10px] text-omega-muted">
                        {pair.player2.stars} estrellas
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {byePlayer && (
                <div className="rounded-xl border-l-4 border-l-omega-blue bg-omega-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="size-4 text-omega-blue" />
                    <span className="text-sm text-omega-muted">BYE:</span>
                    <span className="text-sm font-bold text-omega-blue">
                      {byePlayer.alias}
                    </span>
                    <span className="text-xs text-omega-muted">
                      (descansa esta ronda)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewPairs([]);
                  setByePlayer(null);
                }}
                className="omega-btn omega-btn-secondary flex-1 py-3 text-sm justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="omega-btn omega-btn-green flex-1 py-3 text-sm"
                data-testid="confirm-btn"
              >
                {confirming ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="size-5" />
                    Confirmar y crear
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
