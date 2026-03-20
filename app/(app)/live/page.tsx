"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Radio,
  Star,
  Swords,
  Crown,
  ArrowLeft,
  Trophy,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LivePlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
  stars: number;
  wins?: number;
  losses?: number;
}

interface LiveMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  stars_bet: number;
  status: string;
  is_live: boolean;
  winner_id: string | null;
  created_at: string;
  player1: LivePlayer;
  player2: LivePlayer;
}

export default function LiveBattlePage() {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  const fetchLive = useCallback(async () => {
    const supabase = createClient();

    // First try to find an active live match
    const { data: liveData } = await supabase
      .from("matches")
      .select(
        `id, player1_id, player2_id, stars_bet, status, is_live, winner_id, created_at,
         player1:players!player1_id(id, alias, avatar_url, stars, wins, losses),
         player2:players!player2_id(id, alias, avatar_url, stars, wins, losses)`
      )
      .eq("is_live", true)
      .limit(1)
      .maybeSingle();

    let matchData = liveData;

    // If no live match but we were tracking one, it may have just been resolved
    // Keep showing the last tracked match by ID so user sees the result
    if (!matchData && match?.id) {
      const { data: prevMatch } = await supabase
        .from("matches")
        .select(
          `id, player1_id, player2_id, stars_bet, status, is_live, winner_id, created_at,
           player1:players!player1_id(id, alias, avatar_url, stars, wins, losses),
           player2:players!player2_id(id, alias, avatar_url, stars, wins, losses)`
        )
        .eq("id", match.id)
        .single();

      if (prevMatch && (prevMatch as unknown as LiveMatch).status === "completed") {
        matchData = prevMatch;
      }
    }

    if (matchData) {
      const castData = matchData as unknown as LiveMatch;
      // Detect transition from live to completed
      if (
        prevStatus === "in_progress" &&
        castData.status === "completed" &&
        !castData.is_live
      ) {
        setResolved(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      setPrevStatus(castData.status);
      setMatch(castData);
    } else {
      setMatch(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevStatus, match?.id]);

  useEffect(() => {
    fetchLive();

    const supabase = createClient();
    const channel = supabase
      .channel("live-battle-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchLive();
        }
      )
      .subscribe();

    const interval = setInterval(fetchLive, 10_000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchLive]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-10 text-red-500 animate-spin mx-auto" />
          <p className="text-sm text-omega-muted">Buscando batalla en vivo...</p>
        </div>
      </div>
    );
  }

  if (!match || (!match.is_live && match.status !== "completed")) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="size-20 rounded-full bg-omega-surface border border-omega-border flex items-center justify-center mx-auto">
            <Radio className="size-8 text-omega-muted" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-omega-text">
              No hay batallas en vivo
            </h1>
            <p className="text-sm text-omega-muted">
              Cuando un juez active una batalla en vivo, vas a poder verla aca en
              tiempo real.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="omega-btn omega-btn-primary inline-flex px-6 py-3 text-sm"
          >
            <ArrowLeft className="size-4" />
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isLive = match.is_live;
  const isCompleted = match.status === "completed";
  const winnerId = match.winner_id;
  const winnerPlayer =
    winnerId === match.player1_id
      ? match.player1
      : winnerId === match.player2_id
        ? match.player2
        : null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-red-950/40 via-omega-dark to-omega-purple/10 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-omega-purple/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Confetti CSS effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <div
                className="size-2 rounded-sm"
                style={{
                  backgroundColor: [
                    "#f59e0b",
                    "#7c3aed",
                    "#ef4444",
                    "#3b82f6",
                    "#22c55e",
                    "#f97316",
                  ][i % 6],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-lg mx-auto pb-10">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>

          <div className="flex items-center justify-center gap-3">
            {isLive && (
              <>
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-red-500" />
                </span>
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-4 py-1.5 rounded-full">
                  <Radio className="size-4 text-red-400" />
                  <span className="text-sm font-black text-red-400 uppercase tracking-widest">
                    En Vivo
                  </span>
                </div>
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-red-500" />
                </span>
              </>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 bg-omega-gold/20 border border-omega-gold/40 px-4 py-1.5 rounded-full">
                <Trophy className="size-4 text-omega-gold" />
                <span className="text-sm font-black text-omega-gold uppercase tracking-widest">
                  Finalizada
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Battle arena */}
        <div className="px-4 mt-2">
          <div className="rounded-3xl bg-gradient-to-br from-omega-card via-omega-surface to-omega-card border border-white/10 shadow-2xl shadow-red-500/10 overflow-hidden">
            {/* Energy line at top */}
            {isLive && (
              <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
            )}
            {isCompleted && (
              <div className="h-1 bg-gradient-to-r from-omega-gold via-yellow-400 to-omega-gold" />
            )}

            <div className="p-6 pb-8">
              {/* Players face-off */}
              <div className="flex items-start gap-3">
                {/* Player 1 */}
                <PlayerCard
                  player={match.player1}
                  isWinner={isCompleted && winnerId === match.player1_id}
                  isLoser={isCompleted && winnerId !== null && winnerId !== match.player1_id}
                  showConfetti={showConfetti && winnerId === match.player1_id}
                />

                {/* VS center */}
                <div className="flex flex-col items-center justify-center pt-8 shrink-0">
                  <div
                    className={`size-14 rounded-2xl flex items-center justify-center ${
                      isLive
                        ? "bg-red-500/20 border border-red-500/40 animate-pulse"
                        : "bg-omega-gold/20 border border-omega-gold/40"
                    }`}
                  >
                    <Swords
                      className={`size-7 ${isLive ? "text-red-400" : "text-omega-gold"}`}
                    />
                  </div>
                  <span className="text-lg font-black text-omega-muted mt-1">VS</span>
                </div>

                {/* Player 2 */}
                <PlayerCard
                  player={match.player2}
                  isWinner={isCompleted && winnerId === match.player2_id}
                  isLoser={isCompleted && winnerId !== null && winnerId !== match.player2_id}
                  showConfetti={showConfetti && winnerId === match.player2_id}
                />
              </div>

              {/* Stars bet */}
              <div className="mt-8 flex items-center justify-center">
                <div className="bg-omega-dark/80 border border-omega-gold/30 rounded-2xl px-6 py-3 flex items-center gap-3">
                  <Star className="size-6 text-omega-gold fill-omega-gold star-glow" />
                  <div className="text-center">
                    <p className="text-2xl font-black neon-gold">{match.stars_bet}</p>
                    <p className="text-[10px] text-omega-muted uppercase tracking-widest font-bold">
                      Estrellas en juego
                    </p>
                  </div>
                  <Star className="size-6 text-omega-gold fill-omega-gold star-glow" />
                </div>
              </div>

              {/* Status message */}
              <div className="mt-6 text-center">
                {isLive && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-sm font-bold text-red-400 animate-pulse">
                        Esperando resultado...
                      </p>
                      <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-omega-muted">
                      El juez esta arbitrando esta batalla
                    </p>
                  </div>
                )}
                {isCompleted && winnerPlayer && (
                  <div className="space-y-3">
                    <div
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl ${
                        resolved
                          ? "bg-omega-gold/20 border border-omega-gold/40 animate-bounce"
                          : "bg-omega-gold/15 border border-omega-gold/30"
                      }`}
                    >
                      <Crown className="size-5 text-omega-gold" />
                      <span className="text-lg font-black text-omega-gold">
                        {winnerPlayer.alias} gano!
                      </span>
                      <Crown className="size-5 text-omega-gold" />
                    </div>
                    <p className="text-xs text-omega-muted">
                      Se llevo{" "}
                      <span className="text-omega-gold font-bold">
                        {match.stars_bet} estrella{match.stars_bet > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="px-4 mt-6">
          <Link
            href="/dashboard"
            className="omega-btn omega-btn-secondary w-full py-3 text-sm"
          >
            <ArrowLeft className="size-4" />
            Volver al dashboard
          </Link>
        </div>
      </div>

      {/* Confetti animation keyframes */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}

function PlayerCard({
  player,
  isWinner,
  isLoser,
  showConfetti,
}: {
  player: LivePlayer;
  isWinner: boolean;
  isLoser: boolean;
  showConfetti: boolean;
}) {
  return (
    <div className="flex-1 text-center space-y-3">
      {/* Crown for winner */}
      <div className="h-6 flex items-center justify-center">
        {isWinner && (
          <Crown
            className={`size-6 text-omega-gold fill-omega-gold ${showConfetti ? "animate-bounce" : ""}`}
          />
        )}
      </div>

      {/* Avatar */}
      <div className="relative mx-auto">
        <div
          className={`size-20 rounded-full overflow-hidden border-3 mx-auto ${
            isWinner
              ? "border-omega-gold shadow-lg shadow-omega-gold/30 ring-4 ring-omega-gold/20"
              : isLoser
                ? "border-omega-muted/30 opacity-60"
                : "border-omega-purple/50 ring-4 ring-omega-purple/10"
          }`}
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.alias}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-omega-dark flex items-center justify-center text-2xl font-black text-omega-purple">
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isWinner && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-omega-gold/20 border border-omega-gold/40 px-2 py-0.5 rounded-full">
            <Trophy className="size-3 text-omega-gold inline" />
          </div>
        )}
      </div>

      {/* Name */}
      <p
        className={`text-base font-black truncate ${
          isWinner
            ? "text-omega-gold"
            : isLoser
              ? "text-omega-muted"
              : "text-omega-text"
        }`}
      >
        {player.alias}
      </p>

      {/* Stats */}
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-1">
          <Star className="size-3 text-omega-gold fill-omega-gold" />
          <span className="text-sm font-bold text-omega-gold">{player.stars}</span>
        </div>
        {player.wins != null && player.losses != null && (
          <p className="text-[10px] text-omega-muted">
            <span className="text-omega-green font-bold">{player.wins}W</span>
            {" / "}
            <span className="text-omega-red font-bold">{player.losses}L</span>
          </p>
        )}
      </div>
    </div>
  );
}
