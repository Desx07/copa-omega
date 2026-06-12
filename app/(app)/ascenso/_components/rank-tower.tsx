"use client";

import { useState, useEffect } from "react";

interface RankTowerProps {
  currentRank: string;
  playerAlias: string;
  stars: number;
  onComplete: () => void; // Callback cuando termina la animación
}

const RANKS = [
  { letter: "S", name: "Omega", color: "from-yellow-500 to-amber-600", textColor: "text-yellow-300", glowColor: "rgba(253,224,71,0.6)", stars: "56+" },
  { letter: "A", name: "Diamante", color: "from-amber-700 to-amber-900", textColor: "text-amber-400", glowColor: "rgba(251,191,36,0.5)", stars: "41-55" },
  { letter: "B", name: "Oro", color: "from-red-700 to-red-900", textColor: "text-red-400", glowColor: "rgba(248,113,113,0.5)", stars: "31-40" },
  { letter: "C", name: "Plata", color: "from-purple-700 to-purple-900", textColor: "text-purple-400", glowColor: "rgba(192,132,252,0.5)", stars: "21-30" },
  { letter: "D", name: "Bronce", color: "from-blue-700 to-blue-900", textColor: "text-blue-400", glowColor: "rgba(96,165,250,0.5)", stars: "11-20" },
  { letter: "E", name: "Hierro", color: "from-green-800 to-green-950", textColor: "text-green-400", glowColor: "rgba(74,222,128,0.4)", stars: "1-10" },
  { letter: "F", name: "Novato", color: "from-gray-700 to-gray-900", textColor: "text-gray-400", glowColor: "rgba(156,163,175,0.3)", stars: "0" },
];

export default function RankTower({ currentRank, playerAlias, stars, onComplete }: RankTowerProps) {
  const [phase, setPhase] = useState<"enter" | "highlight" | "zoom" | "exit">("enter");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const currentIndex = RANKS.findIndex(r => r.letter === currentRank);

  useEffect(() => {
    // Fase 1: entrada (0.5s)
    const t1 = setTimeout(() => setPhase("highlight"), 500);

    // Fase 2: barrer rangos de abajo hacia arriba hasta el actual
    const t2 = setTimeout(() => {
      let idx = RANKS.length - 1;
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
          COMBATE DE ASCENSO
        </h2>

        {/* Torre de rangos */}
        <div className="w-full space-y-1.5">
          {RANKS.map((rank, i) => {
            const isCurrent = i === currentIndex;
            const isHighlighted = i === highlightIndex;
            const isPast = i > currentIndex;
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
                style={isZoomed ? { boxShadow: `0 0 50px ${rank.glowColor}` } : undefined}
              >
                {/* Rango */}
                <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center">
                  <span className={`text-xl font-black ${rank.textColor}`}>{rank.letter}</span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-bold text-sm text-white">{rank.name}</div>
                  <div className="text-[10px] text-white/50">⭐ {rank.stars}</div>
                </div>

                {/* Indicador de jugador */}
                {isCurrent && (
                  <div className={`transition-all duration-500 ${isZoomed ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{playerAlias}</div>
                      <div className={`text-[10px] ${rank.textColor}`}>⭐ {stars}</div>
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
          BUSCANDO OPONENTE...
        </p>
      </div>
    </div>
  );
}
