"use client";

import { useState, useCallback } from "react";
import { Dices, Sparkles, Clock, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { TIER_CONFIG, GACHA_COST } from "@/lib/gacha";

interface GachaPull {
  id: string;
  blade: string;
  ratchet: string;
  bit: string;
  tier_result: string;
  tournament_id: string | null;
  pulled_at: string;
}

interface PullResult {
  id: string;
  blade: string;
  bladeTier: "S" | "A" | "B" | "C";
  ratchet: string;
  ratchetTier: "S" | "A" | "B" | "C";
  bit: string;
  bitTier: "S" | "A" | "B" | "C";
  overallTier: "S" | "A" | "B" | "C";
  pulled_at: string;
}

type Phase =
  | "idle"
  | "spinning"
  | "reveal-blade"
  | "reveal-ratchet"
  | "reveal-bit"
  | "reveal-tier"
  | "complete";

interface GachaClientProps {
  initialCoins: number;
  initialPulls: GachaPull[];
}

export default function GachaClient({
  initialCoins,
  initialPulls,
}: GachaClientProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [pulls, setPulls] = useState<GachaPull[]>(initialPulls);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const doPull = useCallback(async () => {
    if (loading || phase !== "idle") return;
    if (coins < GACHA_COST) {
      setError(`Necesitas ${GACHA_COST} OC. Tenes ${coins} OC.`);
      return;
    }

    setError(null);
    setLoading(true);
    setPhase("spinning");

    try {
      const res = await fetch("/api/gacha/pull", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al tirar");
        setPhase("idle");
        setLoading(false);
        return;
      }

      setCoins(data.remainingCoins);
      setResult(data.pull);

      // Secuencia de revelacion con suspense
      // Spinning: 1.5s
      await delay(1500);
      setPhase("reveal-blade");
      await delay(900);
      setPhase("reveal-ratchet");
      await delay(900);
      setPhase("reveal-bit");
      await delay(1200);
      setPhase("reveal-tier");
      await delay(2000);
      setPhase("complete");

      // Agregar al historial
      setPulls((prev) => [
        {
          id: data.pull.id,
          blade: data.pull.blade,
          ratchet: data.pull.ratchet,
          bit: data.pull.bit,
          tier_result: data.pull.overallTier,
          tournament_id: null,
          pulled_at: data.pull.pulled_at,
        },
        ...prev,
      ]);
    } catch {
      setError("Error de conexion");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [loading, phase, coins]);

  const resetPull = () => {
    setPhase("idle");
    setResult(null);
  };

  const canPull = coins >= GACHA_COST && phase === "idle" && !loading;
  const isAnimating = phase !== "idle" && phase !== "complete";

  return (
    <div className="space-y-4">
      {/* Gacha Machine */}
      <div className="omega-card overflow-hidden">
        {/* Machine visual */}
        <div className="relative min-h-[420px] flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Background glow */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              phase === "spinning"
                ? "opacity-100"
                : phase === "reveal-tier" && result?.overallTier === "S"
                  ? "opacity-100"
                  : "opacity-30"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-radial from-omega-purple/20 via-transparent to-transparent" />
            {phase === "reveal-tier" && result?.overallTier === "S" && (
              <>
                <div className="absolute inset-0 bg-gradient-radial from-omega-gold/30 via-omega-gold/5 to-transparent animate-pulse" />
                <GoldenParticles />
              </>
            )}
          </div>

          {/* Idle state */}
          {phase === "idle" && !result && (
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="size-32 rounded-full bg-gradient-to-br from-omega-purple/30 to-omega-blue/30 border-2 border-omega-purple/40 flex items-center justify-center animate-float">
                  <Dices className="size-16 text-omega-purple" />
                </div>
                <div className="absolute -inset-3 rounded-full border border-omega-purple/20 animate-ping" style={{ animationDuration: "3s" }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-omega-muted">
                  Genera un combo completamente aleatorio
                </p>
                <p className="text-xs text-omega-muted/60">
                  Blade + Ratchet + Bit de la Xciclopedia completa
                </p>
              </div>
            </div>
          )}

          {/* Spinning state */}
          {phase === "spinning" && (
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="flex gap-4">
                <SlotReel label="Blade" spinning />
                <SlotReel label="Ratchet" spinning />
                <SlotReel label="Bit" spinning />
              </div>
              <p className="text-sm font-bold text-omega-purple animate-pulse">
                Generando combo...
              </p>
            </div>
          )}

          {/* Reveal states */}
          {(phase === "reveal-blade" ||
            phase === "reveal-ratchet" ||
            phase === "reveal-bit" ||
            phase === "reveal-tier" ||
            phase === "complete") &&
            result && (
              <div className="relative z-10 flex flex-col items-center gap-5 w-full">
                {/* Three slot reels */}
                <div className="flex gap-3 w-full max-w-sm">
                  <SlotReel
                    label="Blade"
                    value={result.blade}
                    tier={result.bladeTier}
                    revealed={
                      phase === "reveal-blade" ||
                      phase === "reveal-ratchet" ||
                      phase === "reveal-bit" ||
                      phase === "reveal-tier" ||
                      phase === "complete"
                    }
                    justRevealed={phase === "reveal-blade"}
                  />
                  <SlotReel
                    label="Ratchet"
                    value={result.ratchet}
                    tier={result.ratchetTier}
                    revealed={
                      phase === "reveal-ratchet" ||
                      phase === "reveal-bit" ||
                      phase === "reveal-tier" ||
                      phase === "complete"
                    }
                    justRevealed={phase === "reveal-ratchet"}
                    spinning={phase === "reveal-blade"}
                  />
                  <SlotReel
                    label="Bit"
                    value={result.bit}
                    tier={result.bitTier}
                    revealed={
                      phase === "reveal-bit" ||
                      phase === "reveal-tier" ||
                      phase === "complete"
                    }
                    justRevealed={phase === "reveal-bit"}
                    spinning={
                      phase === "reveal-blade" || phase === "reveal-ratchet"
                    }
                  />
                </div>

                {/* Tier reveal */}
                {(phase === "reveal-tier" || phase === "complete") && (
                  <TierReveal
                    tier={result.overallTier}
                    appearing={phase === "reveal-tier"}
                  />
                )}

                {/* Combo display */}
                {phase === "complete" && (
                  <div className="text-center animate-fade-in-up">
                    <p className="text-lg font-black text-omega-text">
                      {result.blade} {result.ratchet} {result.bit}
                    </p>
                    <p className="text-xs text-omega-muted mt-1">
                      Tu combo para el torneo
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Pull button */}
        <div className="p-4 border-t border-omega-border/30 bg-omega-surface/50">
          {phase === "complete" ? (
            <div className="flex gap-3">
              <button
                onClick={resetPull}
                className="omega-btn omega-btn-secondary flex-1 py-3 text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  resetPull();
                  setTimeout(() => doPull(), 100);
                }}
                disabled={coins < GACHA_COST}
                className="omega-btn omega-btn-primary flex-1 py-3 text-sm"
              >
                <Dices className="size-4" />
                Tirar de nuevo ({GACHA_COST} OC)
              </button>
            </div>
          ) : (
            <button
              onClick={doPull}
              disabled={!canPull}
              className={`omega-btn w-full py-4 text-lg font-black transition-all duration-300 ${
                canPull
                  ? "omega-btn-primary hover:scale-[1.02]"
                  : isAnimating
                    ? "bg-omega-purple/20 text-omega-purple border border-omega-purple/30 cursor-wait"
                    : "bg-omega-surface text-omega-muted border border-omega-border/30 cursor-not-allowed"
              }`}
            >
              {isAnimating ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="size-5 animate-spin" />
                  Revelando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Dices className="size-5" />
                  TIRAR ({GACHA_COST} OC)
                </span>
              )}
            </button>
          )}

          {error && (
            <p className="text-xs text-omega-red text-center mt-2">{error}</p>
          )}

          {/* Rates info */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-[10px] text-omega-gold font-bold">
              S: 5%
            </span>
            <span className="text-[10px] text-omega-purple font-bold">
              A: 15%
            </span>
            <span className="text-[10px] text-omega-blue font-bold">
              B: 35%
            </span>
            <span className="text-[10px] text-omega-muted font-bold">
              C: 45%
            </span>
          </div>
        </div>
      </div>

      {/* Pull History */}
      {pulls.length > 0 && (
        <div className="omega-card">
          <button
            onClick={() => setShowHistory((p) => !p)}
            className="omega-section-header w-full cursor-pointer hover:bg-omega-card-hover transition-colors"
          >
            <Clock className="size-4 text-omega-muted" />
            <span className="flex-1 text-left">
              Historial de Pulls ({pulls.length})
            </span>
            {showHistory ? (
              <ChevronUp className="size-4 text-omega-muted" />
            ) : (
              <ChevronDown className="size-4 text-omega-muted" />
            )}
          </button>
          {showHistory && (
            <div className="max-h-[400px] overflow-y-auto">
              {pulls.map((pull) => (
                <PullHistoryRow key={pull.id} pull={pull} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Torneo Gacha info */}
      <div className="omega-card">
        <div className="omega-section-header">
          <Trophy className="size-4 text-omega-gold" />
          Torneo Gacha
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-omega-muted">
            En un <strong className="text-omega-text">Torneo Gacha</strong>,
            cada jugador tira el BeyGacha y compite con el combo que le toque.
            Sin eleccion, pura suerte y habilidad.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-omega-surface border border-omega-border/30 p-3 text-center">
              <Dices className="size-5 mx-auto text-omega-purple mb-1" />
              <p className="text-[10px] text-omega-muted">1. Tirar</p>
            </div>
            <div className="rounded-lg bg-omega-surface border border-omega-border/30 p-3 text-center">
              <span className="text-xl block mb-1">VS</span>
              <p className="text-[10px] text-omega-muted">2. Competir</p>
            </div>
            <div className="rounded-lg bg-omega-surface border border-omega-border/30 p-3 text-center">
              <Trophy className="size-5 mx-auto text-omega-gold mb-1" />
              <p className="text-[10px] text-omega-muted">3. Ganar</p>
            </div>
          </div>
          <p className="text-xs text-omega-muted/60 text-center">
            Proximamente: torneos gacha semanales
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SlotReel({
  label,
  value,
  tier,
  spinning,
  revealed,
  justRevealed,
}: {
  label: string;
  value?: string;
  tier?: "S" | "A" | "B" | "C";
  spinning?: boolean;
  revealed?: boolean;
  justRevealed?: boolean;
}) {
  const tierConfig = tier ? TIER_CONFIG[tier] : null;

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">
        {label}
      </span>
      <div
        className={`
          w-full aspect-[3/4] rounded-xl border-2 flex items-center justify-center overflow-hidden relative
          transition-all duration-500
          ${
            revealed && tierConfig
              ? `${tierConfig.borderClass} bg-gradient-to-b ${tierConfig.bgClass}`
              : spinning
                ? "border-omega-purple/40 bg-omega-surface"
                : "border-omega-border/40 bg-omega-surface"
          }
          ${justRevealed ? "animate-flip-in scale-105" : ""}
        `}
      >
        {spinning && !revealed ? (
          <div className="flex flex-col gap-1 animate-slot-spin">
            <div className="text-xs text-omega-muted/40 font-bold">???</div>
            <div className="text-xs text-omega-muted/60 font-bold">???</div>
            <div className="text-xs text-omega-muted/40 font-bold">???</div>
          </div>
        ) : revealed && value ? (
          <div className="flex flex-col items-center gap-1 px-2">
            <span
              className={`text-sm font-black text-center leading-tight ${
                tierConfig?.textClass ?? "text-omega-text"
              }`}
            >
              {value}
            </span>
            {tier && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  tier === "S"
                    ? "bg-omega-gold/20 text-omega-gold"
                    : tier === "A"
                      ? "bg-omega-purple/20 text-omega-purple"
                      : tier === "B"
                        ? "bg-omega-blue/20 text-omega-blue"
                        : "bg-white/10 text-omega-muted"
                }`}
              >
                Tier {tier}
              </span>
            )}
          </div>
        ) : (
          <span className="text-2xl text-omega-muted/30">?</span>
        )}
      </div>
    </div>
  );
}

function TierReveal({
  tier,
  appearing,
}: {
  tier: "S" | "A" | "B" | "C";
  appearing: boolean;
}) {
  const config = TIER_CONFIG[tier];

  return (
    <div
      className={`
        text-center transition-all duration-700
        ${appearing ? "animate-tier-reveal" : ""}
      `}
    >
      <div
        className={`
          inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2
          ${config.borderClass} bg-gradient-to-r ${config.bgClass}
          ${tier === "S" ? "animate-pulse shadow-lg shadow-omega-gold/30" : ""}
        `}
      >
        {tier === "S" && <Sparkles className="size-6 text-omega-gold" />}
        <div>
          <p
            className={`text-2xl font-black ${config.textClass} ${
              tier === "S" ? "neon-gold" : ""
            }`}
          >
            {config.label}
          </p>
          <p className={`text-xs font-bold ${config.textClass} opacity-70`}>
            Tier {tier}
          </p>
        </div>
        {tier === "S" && <Sparkles className="size-6 text-omega-gold" />}
      </div>
    </div>
  );
}

function GoldenParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute size-1.5 rounded-full bg-omega-gold animate-particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function PullHistoryRow({ pull }: { pull: GachaPull }) {
  const tier = pull.tier_result as "S" | "A" | "B" | "C";
  const config = TIER_CONFIG[tier];
  const date = new Date(pull.pulled_at);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="omega-row">
      <div
        className={`size-8 rounded-lg flex items-center justify-center font-black text-sm border ${config.borderClass} bg-gradient-to-br ${config.bgClass}`}
      >
        <span className={config.textClass}>{tier}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-omega-text truncate">
          {pull.blade} {pull.ratchet} {pull.bit}
        </p>
        <p className="text-[10px] text-omega-muted">{timeAgo}</p>
      </div>
      {pull.tournament_id && (
        <div className="shrink-0">
          <Trophy className="size-3.5 text-omega-gold" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Recien";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days}d`;
}
