"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Coins,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ──────────────────────────────────────────────

interface PredictionPlayer {
  id: string;
  alias: string;
  avatar_url: string | null;
}

interface LiveMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  stars_bet: number;
  status: string;
  is_live: boolean;
  player1: PredictionPlayer;
  player2: PredictionPlayer;
}

interface Prediction {
  id: string;
  predictor_id: string;
  predicted_winner_id: string;
  omega_coins_bet: number;
  result: "pending" | "won" | "lost";
  payout_oc: number;
  predictor: { alias: string; avatar_url: string | null };
}

interface Odds {
  player1_total: number;
  player2_total: number;
}

// ─── Componente ─────────────────────────────────────────

export default function LivePredictions() {
  const [liveMatch, setLiveMatch] = useState<LiveMatch | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null);
  const [odds, setOdds] = useState<Odds>({ player1_total: 0, player2_total: 0 });
  const [myOC, setMyOC] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-predictions");
      if (res.ok) {
        const data = await res.json();
        setLiveMatch(data.live_match);
        setPredictions(data.predictions);
        setMyPrediction(data.my_prediction);
        setOdds(data.odds);
        setMyOC(data.my_omega_coins);

        // Detectar resultado
        if (
          data.my_prediction &&
          data.my_prediction.result !== "pending" &&
          !showResult
        ) {
          setShowResult(true);
        }
      }
    } catch {
      // silencioso
    }
    setLoading(false);
  }, [showResult]);

  useEffect(() => {
    fetchData();

    const supabase = createClient();
    const channel = supabase
      .channel("live-predictions-panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_predictions" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => fetchData()
      )
      .subscribe();

    const interval = setInterval(fetchData, 8_000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !liveMatch) return;
    setPlacing(true);
    setError(null);

    try {
      const res = await fetch("/api/live-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: liveMatch.id,
          predicted_winner_id: selectedPlayer,
          omega_coins_bet: betAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        await fetchData();
        setSelectedPlayer(null);
      }
    } catch {
      setError("Error de conexion");
    }
    setPlacing(false);
  };

  // No hay match en vivo -- no mostrar nada
  if (loading) {
    return (
      <div className="omega-card p-6 text-center">
        <Loader2 className="size-5 text-omega-purple animate-spin mx-auto" />
      </div>
    );
  }

  if (!liveMatch) return null;

  const totalPool = odds.player1_total + odds.player2_total;
  const p1Percent =
    totalPool > 0 ? Math.round((odds.player1_total / totalPool) * 100) : 50;
  const p2Percent = totalPool > 0 ? 100 - p1Percent : 50;

  // Multiplicadores (odds estilo apuesta)
  const p1Multiplier =
    odds.player1_total > 0
      ? (totalPool / odds.player1_total).toFixed(2)
      : "-.--";
  const p2Multiplier =
    odds.player2_total > 0
      ? (totalPool / odds.player2_total).toFixed(2)
      : "-.--";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-omega-gold/15 flex items-center justify-center">
          <Coins className="size-4 text-omega-gold" />
        </div>
        <div>
          <h3 className="text-sm font-black text-omega-text">
            Predicciones en Vivo
          </h3>
          <p className="text-[10px] text-omega-muted">
            Aposta Omega Coins en quien gana
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-omega-card border border-omega-gold/20 rounded-full px-3 py-1">
          <Coins className="size-3 text-omega-gold" />
          <span className="text-xs font-bold text-omega-gold">{myOC}</span>
        </div>
      </div>

      {/* Panel principal */}
      <div className="rounded-2xl bg-gradient-to-br from-omega-card via-omega-surface to-omega-card border border-white/10 shadow-lg shadow-omega-purple/5 overflow-hidden">
        {/* Barra de odds animada */}
        <div className="h-1.5 flex">
          <div
            className="h-full bg-gradient-to-r from-omega-blue to-omega-blue-glow transition-all duration-700"
            style={{ width: `${p1Percent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-omega-red to-red-600 transition-all duration-700"
            style={{ width: `${p2Percent}%` }}
          />
        </div>

        <div className="p-5 space-y-4">
          {/* Resultado de prediccion (si ya termino) */}
          {myPrediction && myPrediction.result !== "pending" && showResult && (
            <div
              className={`rounded-xl p-4 text-center space-y-2 ${
                myPrediction.result === "won"
                  ? "bg-omega-green/15 border border-omega-green/30"
                  : "bg-omega-red/15 border border-omega-red/30"
              }`}
            >
              {myPrediction.result === "won" ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="size-5 text-omega-green" />
                    <span className="text-lg font-black text-omega-green">
                      Acertaste!
                    </span>
                    <Sparkles className="size-5 text-omega-green" />
                  </div>
                  <p className="text-sm text-omega-green/80">
                    Ganaste{" "}
                    <span className="font-bold text-omega-gold">
                      {myPrediction.payout_oc} OC
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="size-5 text-omega-red" />
                    <span className="text-lg font-black text-omega-red">
                      No acertaste
                    </span>
                  </div>
                  <p className="text-sm text-omega-red/80">
                    Perdiste {myPrediction.omega_coins_bet} OC
                  </p>
                </>
              )}
            </div>
          )}

          {/* Cards de jugadores para apostar */}
          {!myPrediction && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Player 1 */}
                <PlayerBetCard
                  player={liveMatch.player1}
                  percent={p1Percent}
                  multiplier={p1Multiplier}
                  totalBet={odds.player1_total}
                  isSelected={selectedPlayer === liveMatch.player1_id}
                  accentClass="omega-blue"
                  onSelect={() =>
                    setSelectedPlayer(
                      selectedPlayer === liveMatch.player1_id
                        ? null
                        : liveMatch.player1_id
                    )
                  }
                />

                {/* Player 2 */}
                <PlayerBetCard
                  player={liveMatch.player2}
                  percent={p2Percent}
                  multiplier={p2Multiplier}
                  totalBet={odds.player2_total}
                  isSelected={selectedPlayer === liveMatch.player2_id}
                  accentClass="omega-red"
                  onSelect={() =>
                    setSelectedPlayer(
                      selectedPlayer === liveMatch.player2_id
                        ? null
                        : liveMatch.player2_id
                    )
                  }
                />
              </div>

              {/* Selector de monto */}
              {selectedPlayer && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-omega-muted font-bold">
                      Cantidad:
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      {[5, 10, 25, 50, 100].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount)}
                          disabled={myOC < amount}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            betAmount === amount
                              ? "bg-omega-gold/20 border border-omega-gold/40 text-omega-gold"
                              : "bg-omega-dark border border-omega-border text-omega-muted hover:text-omega-text"
                          } ${myOC < amount ? "opacity-30 cursor-not-allowed" : ""}`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payout potencial */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-omega-muted">Pago potencial:</span>
                    <span className="font-bold text-omega-gold">
                      ~
                      {Math.floor(
                        betAmount *
                          parseFloat(
                            selectedPlayer === liveMatch.player1_id
                              ? p1Multiplier
                              : p2Multiplier
                          ) || betAmount
                      )}{" "}
                      OC
                    </span>
                  </div>

                  {/* Boton apostar */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={placing || myOC < betAmount}
                    className="omega-btn omega-btn-gold w-full py-3 text-sm"
                  >
                    {placing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Zap className="size-4" />
                    )}
                    Apostar {betAmount} OC por{" "}
                    {selectedPlayer === liveMatch.player1_id
                      ? liveMatch.player1.alias
                      : liveMatch.player2.alias}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Ya aposto -- mostrar info */}
          {myPrediction && myPrediction.result === "pending" && (
            <div className="rounded-xl bg-omega-purple/10 border border-omega-purple/25 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="size-4 text-omega-purple" />
                <span className="text-sm font-bold text-omega-purple">
                  Apuesta registrada
                </span>
              </div>
              <p className="text-xs text-omega-muted">
                Apostaste{" "}
                <span className="text-omega-gold font-bold">
                  {myPrediction.omega_coins_bet} OC
                </span>{" "}
                por{" "}
                <span className="text-omega-text font-bold">
                  {myPrediction.predicted_winner_id === liveMatch.player1_id
                    ? liveMatch.player1.alias
                    : liveMatch.player2.alias}
                </span>
              </p>
              <div className="flex items-center justify-center gap-1">
                <Loader2 className="size-3 text-omega-muted animate-spin" />
                <span className="text-[10px] text-omega-muted">
                  Esperando resultado...
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-omega-red/15 border border-omega-red/30 text-omega-red text-xs text-center">
              {error}
            </div>
          )}

          {/* Odds vivas */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-omega-muted" />
              <span className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">
                Probabilidades en vivo
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Barra de odds */}
              <span className="text-[10px] font-bold text-omega-blue w-8 text-right">
                {p1Percent}%
              </span>
              <div className="flex-1 h-2 rounded-full bg-omega-dark overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-omega-blue to-omega-blue-glow transition-all duration-700"
                  style={{ width: `${p1Percent}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-omega-red to-red-600 transition-all duration-700"
                  style={{ width: `${p2Percent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-omega-red w-8">
                {p2Percent}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-omega-muted">
              <span>Pool total: {totalPool} OC</span>
              <span>{predictions.length} apuestas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card de jugador para apostar ──────────────────────

function PlayerBetCard({
  player,
  percent,
  multiplier,
  totalBet,
  isSelected,
  accentClass,
  onSelect,
}: {
  player: PredictionPlayer;
  percent: number;
  multiplier: string;
  totalBet: number;
  isSelected: boolean;
  accentClass: string;
  onSelect: () => void;
}) {
  const borderColor = isSelected
    ? accentClass === "omega-blue"
      ? "border-omega-blue shadow-lg shadow-omega-blue/20"
      : "border-omega-red shadow-lg shadow-omega-red/20"
    : "border-omega-border/40";

  const bgColor = isSelected
    ? accentClass === "omega-blue"
      ? "bg-omega-blue/10"
      : "bg-omega-red/10"
    : "bg-omega-dark/60";

  return (
    <button
      onClick={onSelect}
      className={`relative rounded-xl border-2 ${borderColor} ${bgColor} p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98]`}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-omega-gold flex items-center justify-center">
          <CheckCircle className="size-3 text-omega-dark" />
        </div>
      )}

      {/* Avatar */}
      <div className="size-14 rounded-full overflow-hidden border-2 border-omega-border mx-auto mb-2">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={player.alias}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-omega-dark flex items-center justify-center text-lg font-black text-omega-purple">
            {player.alias.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nombre */}
      <p className="text-sm font-black text-omega-text truncate">
        {player.alias}
      </p>

      {/* Odds */}
      <div className="mt-2 space-y-1">
        <span
          className={`text-lg font-black ${
            accentClass === "omega-blue" ? "text-omega-blue" : "text-omega-red"
          }`}
        >
          x{multiplier}
        </span>
        <p className="text-[10px] text-omega-muted">{percent}% del pool</p>
        {totalBet > 0 && (
          <p className="text-[10px] text-omega-gold">
            <Coins className="size-3 inline mr-0.5" />
            {totalBet} OC
          </p>
        )}
      </div>
    </button>
  );
}
