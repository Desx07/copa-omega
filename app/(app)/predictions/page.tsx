"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Trophy,
  Swords,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
} from "lucide-react";

interface Player {
  alias: string;
  avatar_url: string | null;
}

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  stars_bet: number;
  status: string;
  player1: Player;
  player2: Player;
}

interface TournamentMatch {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  round: number;
  bracket_position: string;
  status: string;
  player1: Player;
  player2: Player;
  tournament: { name: string };
}

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  stars_bet: number;
  status: string;
  challenger: Player;
  challenged: Player;
}

interface Prediction {
  id: string;
  match_id: string | null;
  tournament_match_id: string | null;
  challenge_id: string | null;
  predicted_winner_id: string;
  is_correct: boolean | null;
}

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  alias: string;
  avatar_url: string | null;
  correct: number;
  total: number;
  accuracy: number;
}

export default function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [tab, setTab] = useState<"predict" | "leaderboard">("predict");

  const fetchData = useCallback(async () => {
    try {
      const [predRes, lbRes] = await Promise.all([
        fetch("/api/predictions"),
        fetch("/api/predictions/leaderboard"),
      ]);

      if (predRes.ok) {
        const data = await predRes.json();
        setMatches(data.matches);
        setTournamentMatches(data.tournament_matches);
        setChallenges(data.challenges);
        setMyPredictions(data.my_predictions);
      }

      if (lbRes.ok) {
        setLeaderboard(await lbRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function predict(
    type: "match_id" | "tournament_match_id" | "challenge_id",
    refId: string,
    winnerId: string
  ) {
    setSubmitting(`${refId}-${winnerId}`);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type]: refId,
          predicted_winner_id: winnerId,
        }),
      });

      if (res.ok) {
        const pred = await res.json();
        setMyPredictions((prev) => [...prev, pred]);
      }
    } finally {
      setSubmitting(null);
    }
  }

  function getPrediction(
    type: "match_id" | "tournament_match_id" | "challenge_id",
    refId: string
  ): Prediction | undefined {
    return myPredictions.find((p) => p[type] === refId);
  }

  function renderPlayerButton(
    playerId: string,
    player: Player,
    refType: "match_id" | "tournament_match_id" | "challenge_id",
    refId: string,
    existingPrediction: Prediction | undefined
  ) {
    const isPredicted = existingPrediction?.predicted_winner_id === playerId;
    const isSubmitting = submitting === `${refId}-${playerId}`;
    const hasAnyPrediction = !!existingPrediction;

    return (
      <button
        onClick={() => !hasAnyPrediction && predict(refType, refId, playerId)}
        disabled={hasAnyPrediction || isSubmitting}
        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
          isPredicted
            ? existingPrediction?.is_correct === true
              ? "border-omega-green bg-omega-green/10"
              : existingPrediction?.is_correct === false
              ? "border-omega-red bg-omega-red/10"
              : "border-omega-purple bg-omega-purple/10"
            : hasAnyPrediction
            ? "border-white/5 bg-omega-dark/30 opacity-50"
            : "border-white/10 bg-omega-dark/50 hover:border-omega-purple/50 hover:bg-omega-purple/5 active:scale-95"
        }`}
      >
        <div className="size-10 rounded-full bg-omega-card overflow-hidden border border-white/10">
          {player.avatar_url ? (
            <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center text-sm font-black text-omega-purple">
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-omega-text truncate max-w-full">
          {player.alias}
        </span>
        {isPredicted && (
          <span className="text-[10px] font-bold text-omega-purple flex items-center gap-1">
            {existingPrediction?.is_correct === true && <CheckCircle className="size-3 text-omega-green" />}
            {existingPrediction?.is_correct === false && <XCircle className="size-3 text-omega-red" />}
            {existingPrediction?.is_correct == null && <Target className="size-3" />}
            Tu pick
          </span>
        )}
        {isSubmitting && <Loader2 className="size-4 animate-spin text-omega-purple" />}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

  const totalPredictable = matches.length + tournamentMatches.length + challenges.length;

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-omega-purple/20 flex items-center justify-center">
            <Target className="size-6 text-omega-purple" />
          </div>
          <div>
            <h1 className="text-xl font-black text-omega-text">Predicciones</h1>
            <p className="text-xs text-omega-muted">Predeci quien gana cada partida</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2">
        <button
          onClick={() => setTab("predict")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "predict"
              ? "bg-omega-purple text-white"
              : "bg-omega-card text-omega-muted hover:text-omega-text"
          }`}
        >
          <Swords className="size-4 inline mr-1.5" />
          Predecir
        </button>
        <button
          onClick={() => setTab("leaderboard")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "leaderboard"
              ? "bg-omega-gold text-white"
              : "bg-omega-card text-omega-muted hover:text-omega-text"
          }`}
        >
          <Trophy className="size-4 inline mr-1.5" />
          Ranking
        </button>
      </div>

      {tab === "predict" && (
        <div className="px-4 space-y-3">
          {totalPredictable === 0 ? (
            <div className="omega-card p-10 text-center space-y-3">
              <Target className="size-10 text-omega-muted/20 mx-auto" />
              <p className="text-sm text-omega-muted/70">
                No hay partidas para predecir ahora
              </p>
            </div>
          ) : (
            <>
              {/* Regular matches */}
              {matches.map((match) => {
                const pred = getPrediction("match_id", match.id);
                return (
                  <div key={match.id} className="omega-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="omega-badge omega-badge-blue text-[10px]">Partida</span>
                      <span className="text-xs text-omega-muted">{match.stars_bet} estrellas</span>
                    </div>
                    <p className="text-xs text-omega-muted text-center font-bold uppercase tracking-wider">
                      Quien gana?
                    </p>
                    <div className="flex gap-3">
                      {renderPlayerButton(match.player1_id, match.player1, "match_id", match.id, pred)}
                      <div className="flex items-center text-omega-muted font-black text-xs">VS</div>
                      {renderPlayerButton(match.player2_id, match.player2, "match_id", match.id, pred)}
                    </div>
                  </div>
                );
              })}

              {/* Tournament matches */}
              {tournamentMatches.map((tm) => {
                const pred = getPrediction("tournament_match_id", tm.id);
                return (
                  <div key={tm.id} className="omega-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="omega-badge omega-badge-gold text-[10px]">
                        {(tm.tournament as unknown as { name: string }).name}
                      </span>
                      <span className="text-xs text-omega-muted">
                        Ronda {tm.round}
                      </span>
                    </div>
                    <p className="text-xs text-omega-muted text-center font-bold uppercase tracking-wider">
                      Quien gana?
                    </p>
                    <div className="flex gap-3">
                      {renderPlayerButton(tm.player1_id, tm.player1, "tournament_match_id", tm.id, pred)}
                      <div className="flex items-center text-omega-muted font-black text-xs">VS</div>
                      {renderPlayerButton(tm.player2_id, tm.player2, "tournament_match_id", tm.id, pred)}
                    </div>
                  </div>
                );
              })}

              {/* Challenges */}
              {challenges.map((ch) => {
                const pred = getPrediction("challenge_id", ch.id);
                return (
                  <div key={ch.id} className="omega-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="omega-badge omega-badge-red text-[10px]">Reto</span>
                      <span className="text-xs text-omega-muted">{ch.stars_bet} estrellas</span>
                    </div>
                    <p className="text-xs text-omega-muted text-center font-bold uppercase tracking-wider">
                      Quien gana?
                    </p>
                    <div className="flex gap-3">
                      {renderPlayerButton(ch.challenger_id, ch.challenger, "challenge_id", ch.id, pred)}
                      <div className="flex items-center text-omega-muted font-black text-xs">VS</div>
                      {renderPlayerButton(ch.challenged_id, ch.challenged, "challenge_id", ch.id, pred)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="px-4 space-y-2">
          {leaderboard.length === 0 ? (
            <div className="omega-card p-10 text-center space-y-3">
              <Trophy className="size-10 text-omega-muted/20 mx-auto" />
              <p className="text-sm text-omega-muted/70">Todavia no hay predicciones resueltas</p>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.player_id}
                className="omega-card px-4 py-3 flex items-center gap-3"
              >
                <div className="shrink-0 w-8 text-center">
                  {entry.rank <= 3 ? (
                    <Crown
                      className={`size-5 mx-auto ${
                        entry.rank === 1
                          ? "text-omega-gold"
                          : entry.rank === 2
                          ? "text-gray-400"
                          : "text-amber-600"
                      }`}
                    />
                  ) : (
                    <span className="text-sm font-bold text-omega-muted">
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <div className="size-9 rounded-full bg-omega-dark overflow-hidden border border-white/10 shrink-0">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.alias} className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-sm font-black text-omega-purple">
                      {entry.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate">{entry.alias}</p>
                  <p className="text-xs text-omega-muted">
                    {entry.correct}/{entry.total} correctas
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-omega-green">{entry.accuracy}%</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
