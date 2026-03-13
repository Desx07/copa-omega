"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Star, Swords, Trophy, ArrowLeft, Crown, Loader2 } from "lucide-react";
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

    // Verificar que es admin
    const { data: profile } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
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

  async function handleResolve(winnerId: string) {
    if (!match) return;

    setResolving(true);

    try {
      const supabase = createClient();

      // Llamar a la funcion resolve_match de la DB
      const { error } = await supabase.rpc("resolve_match", {
        p_match_id: match.id,
        p_winner_id: winnerId,
      });

      if (error) {
        toast.error(error.message);
        setResolving(false);
        return;
      }

      toast.success("Partida resuelta!");
      // Recargar datos
      await fetchMatch();
    } catch {
      toast.error("Error al resolver la partida");
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/matches"
          className="flex items-center justify-center size-10 rounded-xl bg-omega-card border border-omega-border text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
          aria-label="Volver a partidas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          {isPending ? (
            <Swords className="size-5 text-omega-gold" />
          ) : (
            <Trophy className="size-5 text-omega-green" />
          )}
          <h1 className="text-2xl font-black">
            {isPending ? (
              <span className="neon-gold">RESOLVER</span>
            ) : (
              <span className="neon-green">RESULTADO</span>
            )}
          </h1>
        </div>
      </div>

      {/* Match card */}
      <div className="rounded-2xl bg-omega-card border border-omega-border p-6 space-y-6">
        {/* Status */}
        <div className="text-center">
          {isPending && (
            <span className="inline-flex items-center rounded-full bg-omega-gold/10 border border-omega-gold/30 px-3 py-1 text-xs font-bold text-omega-gold">
              PENDIENTE
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center rounded-full bg-omega-green/10 border border-omega-green/30 px-3 py-1 text-xs font-bold text-omega-green">
              COMPLETADA
            </span>
          )}
          {match.status === "cancelled" && (
            <span className="inline-flex items-center rounded-full bg-omega-red/10 border border-omega-red/30 px-3 py-1 text-xs font-bold text-omega-red">
              CANCELADA
            </span>
          )}
        </div>

        {/* Players matchup */}
        <div className="flex items-center gap-4">
          {/* Player 1 */}
          <div className="flex-1 text-center space-y-2">
            <div
              className={`inline-flex items-center justify-center size-16 rounded-2xl text-2xl font-black ${
                isCompleted && match.winner_id === player1.id
                  ? "bg-omega-gold/20 border-2 border-omega-gold text-omega-gold"
                  : "bg-omega-card border-2 border-omega-border text-omega-text"
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
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-omega-gold/10 border border-omega-gold/30">
              <Star className="size-3 text-omega-gold fill-omega-gold" />
              <span className="text-xs font-black text-omega-gold">{match.stars_bet}</span>
            </div>
          </div>

          {/* Player 2 */}
          <div className="flex-1 text-center space-y-2">
            <div
              className={`inline-flex items-center justify-center size-16 rounded-2xl text-2xl font-black ${
                isCompleted && match.winner_id === player2.id
                  ? "bg-omega-gold/20 border-2 border-omega-gold text-omega-gold"
                  : "bg-omega-card border-2 border-omega-border text-omega-text"
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
          <div className="rounded-xl bg-omega-green/5 border border-omega-green/20 p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="size-5 text-omega-green" />
              <p className="text-sm font-bold text-omega-green">
                {match.winner.alias} gano!
              </p>
            </div>
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

        {/* Resolve buttons for pending matches */}
        {isPending && (
          <div className="space-y-3">
            <p className="text-xs text-omega-muted text-center">
              Selecciona al ganador de esta batalla
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleResolve(player1.id)}
                disabled={resolving}
                className="flex flex-col items-center gap-2 rounded-xl bg-omega-blue/10 border border-omega-blue/30 p-4 font-bold text-omega-blue transition-all hover:bg-omega-blue/20 hover:border-omega-blue/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {resolving ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Trophy className="size-5" />
                    <span className="text-sm">Gano {player1.alias}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleResolve(player2.id)}
                disabled={resolving}
                className="flex flex-col items-center gap-2 rounded-xl bg-omega-purple/10 border border-omega-purple/30 p-4 font-bold text-omega-purple transition-all hover:bg-omega-purple/20 hover:border-omega-purple/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {resolving ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Trophy className="size-5" />
                    <span className="text-sm">Gano {player2.alias}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Match metadata */}
        <div className="pt-4 border-t border-omega-border/50 text-center">
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
  );
}
