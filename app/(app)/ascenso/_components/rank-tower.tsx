"use client";

import { useState, useEffect } from "react";
import { RANKS, type RankLetter } from "@/lib/ascenso";

interface RankTowerProps {
  currentRank: RankLetter;
  playerAlias: string;
  ticketPoints: number; // puntos de ticket actuales del jugador
  kind: "normal" | "ascension"; // tipo de combate: normal (por puntos) o de ascenso
  onComplete: () => void; // Callback cuando termina la animación
}

// Color del texto de la letra por rango (el gradiente y el glow vienen de lib/ascenso)
const RANK_TEXT_COLOR: Record<RankLetter, string> = {
  S: "text-yellow-300",
  A: "text-amber-400",
  B: "text-red-400",
  C: "text-purple-400",
  D: "text-blue-400",
  E: "text-green-400",
  F: "text-gray-400",
};

// La torre se dibuja de arriba (S) hacia abajo (F)
const TOWER_RANKS = [...RANKS].reverse();

export default function RankTower({ currentRank, playerAlias, ticketPoints, kind, onComplete }: RankTowerProps) {
  const [phase, setPhase] = useState<"enter" | "highlight" | "zoom" | "exit">("enter");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const currentIndex = TOWER_RANKS.findIndex(r => r.letter === currentRank);

  useEffect(() => {
    // Fase 1: entrada (0.5s)
    const t1 = setTimeout(() => setPhase("highlight"), 500);

    // Fase 2: barrer rangos de abajo hacia arriba hasta el actual
    const t2 = setTimeout(() => {
      let idx = TOWER_RANKS.length - 1;
      const interval = setInterval(() => {
        setHighlightIndex(idx);
        idx--;
        if (idx < currentIndex) {
          clearInterval(interval);
          // Fase 3: zoom al rango actual
          setTimeout(() => setPhase("zoom"), 400);
        }
      }, 200);
    }, 800);

    // Fase 4: salir después de mostrar
    const t3 = setTimeout(() => {
      setPhase("exit");
      setTimeout(onComplete, 600);
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [currentIndex, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500
        ${phase === "enter" ? "opacity-0" : "opacity-100"}
        ${phase === "exit" ? "opacity-0" : ""}`}
    >
      {/* Grid triangular de fondo (estilo neón) */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "linear-gradient(60deg, rgba(255,0,100,0.15) 1px, transparent 1px), linear-gradient(-60deg, rgba(0,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-4">
        {/* Título */}
        <h2
          className={`text-lg font-mono tracking-[0.3em] text-cyan-400/80 mb-6 transition-all duration-500
            ${phase === "highlight" || phase === "zoom" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {kind === "ascension" ? "COMBATE DE ASCENSO" : "COMBATE DE RANGO"}
        </h2>

        {/* Torre de rangos */}
        <div className="w-full space-y-1.5">
          {TOWER_RANKS.map((rank, i) => {
            const textColor = RANK_TEXT_COLOR[rank.letter];
            const isCurrent = i === currentIndex;
            const isHighlighted = i === highlightIndex;
            const isZoomed = phase === "zoom" && isCurrent;

            return (
              <div
                key={rank.letter}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
                  bg-gradient-to-r ${rank.color}
                  ${isZoomed ? "scale-110 ring-2 ring-white/80 shadow-[0_0_40px_rgba(255,255,255,0.3)]" : ""}
                  ${isHighlighted && !isCurrent ? "scale-105 brightness-125" : ""}
                  ${!isCurrent && !isHighlighted ? "opacity-40 scale-95" : ""}
                  ${isCurrent && !isZoomed ? "opacity-90" : ""}`}
                style={isZoomed ? { boxShadow: `0 0 50px ${rank.glow}` } : undefined}
              >
                {/* Rango */}
                <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center">
                  <span className={`text-xl font-black ${textColor}`}>{rank.letter}</span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">{rank.name}</div>
                  <div className="text-[10px] text-white/50">
                    {rank.ticketTarget != null
                      ? `🎫 ${rank.ticketTarget.toLocaleString()} pts`
                      : "RANGO MÁXIMO"}
                  </div>
                </div>

                {/* Indicador de jugador */}
                {isCurrent && (
                  <div className={`transition-all duration-500 ${isZoomed ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{playerAlias}</div>
                      <div className={`text-[10px] ${textColor}`}>🎫 {ticketPoints.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Flecha de barrido */}
                {isHighlighted && !isCurrent && (
                  <div className="absolute -left-3 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Texto inferior */}
        <p
          className={`mt-6 text-sm font-mono text-white/40 tracking-wider transition-all duration-500
            ${phase === "zoom" ? "opacity-100" : "opacity-0"}`}
        >
          OPONENTE DEFINIDO
        </p>
      </div>
    </div>
  );
}
