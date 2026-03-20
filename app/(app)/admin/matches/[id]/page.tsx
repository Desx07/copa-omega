"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Star, Swords, Trophy, ArrowLeft, Crown, Loader2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MatchPlayer {
  id: string;
  alias: string;
  stars: number;
}

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  stars_bet: number;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  status: string;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  player1: { alias: string };
  player2: { alias: string };
  winner: { alias: string } | null;
}

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [player1, setPlayer1] = useState<MatchPlayer | null>(null);
  const [player2, setPlayer2] = useState<MatchPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [p1Score, setP1Score] = useState("");
  const [p2Score, setP2Score] = useState("");

  const fetchMatch = useCallback(async () => {
    const supabase = createClient();

    // Verificar autenticacion
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Verificar que es admin o juez
    const { data: profile } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_judge) {
      router.push("/dashboard");
      return;
    }

    // Obtener la partida
    const { data: matchData, error } = await supabase
      .from("matches")
      .select(
        "*, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
      )
      .eq("id", matchId)
      .single();

    if (error || !matchData) {
      toast.error("Partida no encontrada");
      router.push("/admin/matches");
      return;
    }

    setMatch(matchData as unknown as Match);

    // Obtener datos completos de ambos jugadores (para mostrar estrellas actuales)
    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      supabase
        .from("players")
        .select("id, alias, stars")
        .eq("id", matchData.player1_id)
        .single(),
      supabase
        .from("players")
        .select("id, alias, stars")
        .eq("id", matchData.player2_id)
        .single(),
    ]);

    setPlayer1(p1 as MatchPlayer | null);
    setPlayer2(p2 as MatchPlayer | null);
    setLoading(false);
  }, [matchId, router]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  async function handleSubmitScore() {
    if (!match) return;
    const p1Num = parseInt(p1Score) || 0;
    const p2Num = parseInt(p2Score) || 0;
    if (p1Num === p2Num) {
      toast.error("No puede haber empate");
      return;
    }
    const winnerId = p1Num > p2Num ? match.player1_id : match.player2_id;

    setResolving(true);

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner_id: winnerId,
          player1_score: p1Num,
          player2_score: p2Num,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al resolver la partida");
        return;
      }

      toast.success(isCompleted ? "Resultado actualizado!" : "Partida resuelta!");
      setShowScoreForm(false);
      await fetchMatch();
    } catch {
      toast.error("Error al guardar el resultado");
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-blue animate-spin" />
      </div>
    );
  }

  if (!match || !player1 || !player2) {
    return null;
  }

  const isPending = match.status === "pending";
  const isCompleted = match.status === "completed";

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Hero banner */}
      <div
        className={`-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br ${
          isPending
            ? "from-omega-gold/20 via-omega-gold/5 to-omega-dark shadow-lg shadow-omega-gold/10"
            : "from-omega-green/20 via-omega-green/5 to-omega-dark shadow-lg shadow-omega-green/10"
        } mb-8`}
      >
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/admin/matches"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Partidas
          </Link>
          <div className="flex items-center gap-2.5">
            <div
              className={`size-10 rounded-xl flex items-center justify-center ${
                isPending ? "bg-omega-gold/20" : "bg-omega-green/20"
              }`}
            >
              {isPending ? (
                <Swords className="size-5 text-omega-gold" />
              ) : (
                <Trophy className="size-5 text-omega-green" />
              )}
            </div>
            <h1 className="text-2xl font-black">
              {isPending ? (
                <span className="neon-gold">RESOLVER</span>
              ) : (
                <span className="neon-blue">RESULTADO</span>
              )}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Match detail card */}
        <div className="rounded-2xl bg-gradient-to-br from-omega-card to-omega-surface border border-white/10 shadow-lg p-6 space-y-6">
          {/* Status */}
          <div className="text-center">
            {isPending && (
              <span className="omega-badge omega-badge-gold px-3 py-1">PENDIENTE</span>
            )}
            {isCompleted && (
              <span className="omega-badge omega-badge-green px-3 py-1">COMPLETADA</span>
            )}
            {match.status === "cancelled" && (
              <span className="omega-badge omega-badge-red px-3 py-1">CANCELADA</span>
            )}
          </div>

          {/* Players matchup */}
          <div className="flex items-center gap-4">
            {/* Player 1 */}
            <div className="flex-1 text-center space-y-2">
              <div
                className={`inline-flex items-center justify-center size-16 rounded-2xl text-2xl font-black ${
                  isCompleted && match.winner_id === player1.id
                    ? "bg-omega-gold/20 border-2 border-omega-gold text-omega-gold shadow-sm shadow-omega-gold/20"
                    : "bg-omega-elevated border-2 border-omega-border text-omega-text"
                }`}
              >
                {player1.alias.charAt(0).toUpperCase()}
              </div>
              <p
                className={`text-sm font-bold ${
                  isCompleted && match.winner_id === player1.id
                    ? "text-omega-gold"
                    : "text-omega-text"
                }`}
              >
                {isCompleted && match.winner_id === player1.id && (
                  <Crown className="size-3.5 text-omega-gold inline mr-1 -mt-0.5" />
                )}
                {player1.alias}
              </p>
              <div className="flex items-center justify-center gap-1">
                <Star className="size-3 text-omega-gold fill-omega-gold" />
                <span className="text-xs font-bold text-omega-gold">{player1.stars}</span>
              </div>
            </div>

            {/* VS */}
            <div className="shrink-0 text-center space-y-1">
              <Swords className="size-6 text-omega-muted mx-auto" />
              <span className="omega-badge omega-badge-gold">
                <Star className="size-3 text-omega-gold fill-omega-gold mr-0.5" />
                {match.stars_bet}
              </span>
            </div>

            {/* Player 2 */}
            <div className="flex-1 text-center space-y-2">
              <div
                className={`inline-flex items-center justify-center size-16 rounded-2xl text-2xl font-black ${
                  isCompleted && match.winner_id === player2.id
                    ? "bg-omega-gold/20 border-2 border-omega-gold text-omega-gold shadow-sm shadow-omega-gold/20"
                    : "bg-omega-elevated border-2 border-omega-border text-omega-text"
                }`}
              >
                {player2.alias.charAt(0).toUpperCase()}
              </div>
              <p
                className={`text-sm font-bold ${
                  isCompleted && match.winner_id === player2.id
                    ? "text-omega-gold"
                    : "text-omega-text"
                }`}
              >
                {player2.alias}
                {isCompleted && match.winner_id === player2.id && (
                  <Crown className="size-3.5 text-omega-gold inline ml-1 -mt-0.5" />
                )}
              </p>
              <div className="flex items-center justify-center gap-1">
                <Star className="size-3 text-omega-gold fill-omega-gold" />
                <span className="text-xs font-bold text-omega-gold">{player2.stars}</span>
              </div>
            </div>
          </div>

          {/* Result info for completed matches */}
          {isCompleted && match.winner && (
            <div className="rounded-xl bg-gradient-to-br from-omega-green/10 to-omega-green/5 border border-omega-green/20 p-4 text-center space-y-2 shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="size-5 text-omega-green" />
                <p className="text-sm font-bold text-omega-green">
                  {match.winner.alias} gano!
                </p>
              </div>
              {(match.player1_score > 0 || match.player2_score > 0) && (
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-lg font-black tabular-nums ${match.winner_id === player1.id ? "text-omega-green" : "text-omega-muted"}`}>
                    {match.player1_score}
                  </span>
                  <span className="text-omega-muted/40 text-sm">-</span>
                  <span className={`text-lg font-black tabular-nums ${match.winner_id === player2.id ? "text-omega-green" : "text-omega-muted"}`}>
                    {match.player2_score}
                  </span>
                </div>
              )}
              <p className="text-xs text-omega-muted">
                Se transfirieron{" "}
                <span className="text-omega-gold font-bold">
                  {match.stars_bet} estrella{match.stars_bet > 1 ? "s" : ""}
                </span>{" "}
                al ganador
              </p>
              {match.completed_at && (
                <p className="text-[11px] text-omega-muted">
                  Resuelta el{" "}
                  {new Date(match.completed_at).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Resolve section for pending matches */}
          {isPending && !showScoreForm && (
            <div className="space-y-3 text-center">
              <p className="text-xs text-omega-muted">
                Carga el resultado de esta batalla
              </p>
              <button
                onClick={() => setShowScoreForm(true)}
                className="omega-btn omega-btn-primary px-6 py-3 text-sm w-full"
              >
                <Swords className="size-5" />
                Cargar resultado
              </button>
            </div>
          )}

          {/* Edit result button for completed matches */}
          {isCompleted && !showScoreForm && (
            <div className="text-center">
              <button
                onClick={() => {
                  setP1Score(String(match.player1_score ?? 0));
                  setP2Score(String(match.player2_score ?? 0));
                  setShowScoreForm(true);
                }}
                className="omega-btn omega-btn-secondary px-5 py-2.5 text-sm"
              >
                <Pencil className="size-4" />
                Editar resultado
              </button>
            </div>
          )}

          {(isPending || isCompleted) && showScoreForm && (
            <div className="space-y-4">
              <p className="text-xs text-omega-muted text-center">
                Ingresá el puntaje de cada jugador
              </p>
              <div className="flex items-center gap-3 justify-center">
                <div className="text-center space-y-1 flex-1">
                  <p className="text-xs font-bold text-omega-text truncate">
                    {player1.alias}
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={p1Score}
                    onChange={(e) => setP1Score(e.target.value)}
                    placeholder="0"
                    className="w-full max-w-[80px] mx-auto block rounded-lg border border-omega-border bg-omega-dark px-3 py-2 text-center text-lg font-black text-omega-text focus:border-omega-purple focus:outline-none"
                  />
                </div>
                <span className="text-omega-muted/60 text-lg font-bold pt-5">-</span>
                <div className="text-center space-y-1 flex-1">
                  <p className="text-xs font-bold text-omega-text truncate">
                    {player2.alias}
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={p2Score}
                    onChange={(e) => setP2Score(e.target.value)}
                    placeholder="0"
                    className="w-full max-w-[80px] mx-auto block rounded-lg border border-omega-border bg-omega-dark px-3 py-2 text-center text-lg font-black text-omega-text focus:border-omega-purple focus:outline-none"
                  />
                </div>
              </div>
              {p1Score !== "" && p2Score !== "" && (parseInt(p1Score) || 0) === (parseInt(p2Score) || 0) && (parseInt(p1Score) || 0) > 0 && (
                <p className="text-[11px] text-omega-red text-center">
                  No puede haber empate
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowScoreForm(false)}
                  disabled={resolving}
                  className="omega-btn px-4 py-3 text-sm border border-omega-border text-omega-muted hover:text-omega-text"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitScore}
                  disabled={resolving || (parseInt(p1Score) || 0) === (parseInt(p2Score) || 0)}
                  className="omega-btn omega-btn-primary px-4 py-3 text-sm disabled:opacity-50"
                >
                  {resolving ? (
                    <Loader2 className="size-5 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Crown className="size-5" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Match metadata */}
          <div className="pt-4 border-t border-omega-border/30 text-center">
            <p className="text-[11px] text-omega-muted">
              Creada el{" "}
              {new Date(match.created_at).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
