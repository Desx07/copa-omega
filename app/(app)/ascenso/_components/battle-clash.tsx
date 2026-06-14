"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { type RankLetter } from "@/lib/ascenso";

// ── Datos mínimos de cada contendiente para el choque ──
export interface ClashFighter {
  alias: string;
  rank: RankLetter;
  characterId?: string; // chr_XX de /public/characters
}

interface BattleClashProps {
  player: ClashFighter;
  opponent: ClashFighter;
  /** Combate normal o de ascenso — sube la intensidad del texto/colores */
  kind: "normal" | "ascension";
  /** Se llama cuando termina toda la secuencia de choque */
  onComplete: () => void;
}

// ── Línea de tiempo de la animación (ms) ──
// 0       → entran los personajes a toda velocidad
// ~600    → IMPACTO: flash + shake + chispas + onda + "VS"
// 1700    → se sostiene el VS un instante
// 2200    → fade-out y onComplete
const IMPACT_MS = 600;
const HOLD_MS = 2200;
const FADE_MS = 450;

// Chispas que salen disparadas del centro en todas direcciones
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 70 + (i % 4) * 28; // distintas distancias para que no sea un anillo perfecto
  return {
    sx: Math.cos(angle) * dist,
    sy: Math.sin(angle) * dist,
    color: i % 3 === 0 ? "#ffd60a" : i % 3 === 1 ? "#00b4d8" : "#7b2ff7",
    delay: (i % 5) * 0.03,
  };
});

export default function BattleClash({ player, opponent, kind, onComplete }: BattleClashProps) {
  // "charge" = entrando · "impact" = ya chocaron (dispara efectos) · "exit" = saliendo
  const [stage, setStage] = useState<"charge" | "impact" | "exit">("charge");
  const isAscension = kind === "ascension";

  // Colores acentos según el tipo de combate (ascenso = dorado, normal = cyan)
  const accent = isAscension ? "#ffd60a" : "#00b4d8";

  const playerChar = player.characterId || "00";
  const opponentChar = opponent.characterId || "05";

  // Las chispas no deben recalcularse en cada render
  const sparks = useMemo(() => SPARKS, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("impact"), IMPACT_MS),
      setTimeout(() => setStage("exit"), HOLD_MS),
      setTimeout(onComplete, HOLD_MS + FADE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      data-testid="ascenso-clash"
      className={`fixed inset-0 z-50 overflow-hidden bg-black transition-opacity duration-300 ${
        stage === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Fondo: estadio borroso + viñeta para dar profundidad */}
      <Image src="/stadium.png" alt="" fill className="object-cover opacity-25 blur-[3px]" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />

      {/* Líneas de velocidad radiales (manga speed lines) detrás de todo */}
      <div className="clash-speed-lines absolute inset-0 origin-center pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            background:
              "repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.05) 0deg, transparent 2deg 8deg)",
          }}
        />
      </div>

      {/* Capa que recibe el shake en el impacto (envuelve a los personajes) */}
      <div className={`relative w-full h-full ${stage !== "charge" ? "clash-shake" : ""}`}>
        {/* ── Personaje jugador — entra desde la izquierda ── */}
        <div className="clash-char-left absolute left-0 top-0 bottom-0 w-1/2 flex items-end justify-center pb-20 sm:pb-24">
          <div className="relative flex flex-col items-center">
            <Image
              src={`/characters/chr_${playerChar}.png`}
              alt={player.alias}
              width={360}
              height={460}
              priority
              className="h-[55vh] sm:h-[65vh] w-auto object-contain drop-shadow-[0_0_25px_rgba(157,78,221,0.55)]"
            />
            <span className="mt-2 text-fuchsia-300 font-black text-base sm:text-xl tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {player.alias}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-white/50">RANGO {player.rank}</span>
          </div>
        </div>

        {/* ── Oponente — entra desde la derecha ── */}
        <div className="clash-char-right absolute right-0 top-0 bottom-0 w-1/2 flex items-end justify-center pb-20 sm:pb-24">
          <div className="relative flex flex-col items-center">
            <Image
              src={`/characters/chr_${opponentChar}.png`}
              alt={opponent.alias}
              width={360}
              height={460}
              priority
              // Espejado para que "mire" hacia el jugador
              className="h-[55vh] sm:h-[65vh] w-auto object-contain scale-x-[-1] drop-shadow-[0_0_25px_rgba(0,180,216,0.55)]"
            />
            <span className="mt-2 text-cyan-300 font-black text-base sm:text-xl tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {opponent.alias}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-white/50">RANGO {opponent.rank}</span>
          </div>
        </div>

        {/* ── Centro: efectos de impacto ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {stage !== "charge" && (
            <>
              {/* Flash radial al chocar */}
              <div
                className="clash-flash absolute w-[60vw] h-[60vw] max-w-[640px] max-h-[640px] rounded-full"
                style={{
                  background: `radial-gradient(circle, #ffffff 0%, ${accent} 35%, transparent 70%)`,
                }}
              />

              {/* Onda expansiva */}
              <div
                className="clash-shockwave absolute w-[40vw] h-[40vw] max-w-[420px] max-h-[420px] rounded-full border-solid"
                style={{ borderColor: accent }}
              />

              {/* Chispas disparadas desde el centro */}
              {sparks.map((s, i) => (
                <span
                  key={i}
                  className="clash-spark"
                  style={
                    {
                      "--sx": `${s.sx}px`,
                      "--sy": `${s.sy}px`,
                      background: s.color,
                      boxShadow: `0 0 8px ${s.color}`,
                      animationDelay: `${0.55 + s.delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </>
          )}

          {/* VS gigante con impacto */}
          <div className="clash-vs relative flex flex-col items-center">
            <span
              className="font-black italic leading-none select-none"
              style={{
                fontSize: "clamp(5rem, 22vw, 13rem)",
                color: "#ffffff",
                WebkitTextStroke: `3px ${accent}`,
                textShadow: `0 0 24px ${accent}, 0 0 60px ${accent}99, 0 6px 16px rgba(0,0,0,0.8)`,
              }}
            >
              VS
            </span>
            {/* Etiqueta del tipo de combate bajo el VS */}
            <span
              className="mt-1 px-4 py-1 rounded-full text-[11px] sm:text-sm font-black tracking-[0.25em] uppercase"
              style={{
                color: isAscension ? "#0a0a0f" : "#ffffff",
                background: isAscension
                  ? "linear-gradient(90deg, #ffd60a, #ffc300)"
                  : "rgba(0,180,216,0.18)",
                border: isAscension ? "none" : "1px solid rgba(0,180,216,0.5)",
                boxShadow: isAscension ? "0 0 25px rgba(255,214,10,0.5)" : "none",
              }}
            >
              {isAscension ? "Combate de ascenso" : "Combate"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
