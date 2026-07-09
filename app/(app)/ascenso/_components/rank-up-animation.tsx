"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { rankInfo, type RankLetter } from "@/lib/ascenso";
import { RANK_HEX } from "./ascenso-ui";

interface RankUpAnimationProps {
  fromRank: RankLetter;
  toRank: RankLetter;
  playerAlias: string;
  characterId: string;
  onComplete: () => void;
}

export default function RankUpAnimation({
  fromRank, toRank, playerAlias, characterId, onComplete,
}: RankUpAnimationProps) {
  const [phase, setPhase] = useState<"flash" | "reveal" | "complete">("flash");
  // Nombre desde lib/ascenso (única fuente) y color desde RANK_HEX (paleta de la sección).
  const toName = rankInfo(toRank).name;
  const hex = RANK_HEX[toRank];
  // Glow del color del rango con alpha para halos y sombras de texto.
  const glow = `${hex}cc`;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("reveal"), 500),
      setTimeout(() => setPhase("complete"), 2500),
      setTimeout(onComplete, 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#05070d]">
      {/* Flash blanco */}
      {phase === "flash" && (
        <div className="absolute inset-0 bg-white animate-ping" style={{ animationDuration: "0.4s" }} />
      )}

      {/* Fondo — stadium borroso */}
      <Image src="/stadium.png" alt="" fill className="object-cover opacity-20 blur-md" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido central */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glow grande de fondo */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${glow}, transparent 60%)`,
            animationDuration: "1.5s",
          }}
        />

        {/* Personaje grande */}
        <div className={`relative transition-all duration-1000 ${
          phase === "flash" ? "opacity-0 scale-75" : "opacity-100 scale-100"
        }`}>
          <Image
            src={`/characters/chr_${characterId}.png`}
            alt={playerAlias}
            width={300}
            height={300}
            className="relative drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          />
        </div>

        {/* Rango nuevo — grande y con glow */}
        <div className={`mt-4 transition-all duration-700 ${
          phase === "reveal" || phase === "complete" ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-8"
        }`}>
          <div className="flex items-center gap-4">
            {/* Flecha de ascenso */}
            <span className="text-white/30 text-3xl">
              {fromRank}
            </span>
            <span className="text-white/50 text-2xl">→</span>
            <span
              className="text-[80px] font-black leading-none"
              style={{ color: hex, textShadow: `0 0 40px ${glow}, 0 0 80px ${glow}` }}
            >
              {toRank}
            </span>
          </div>
        </div>

        {/* Texto de ascenso */}
        <div className={`mt-6 transition-all duration-700 delay-500 ${
          phase === "complete" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <p className="text-2xl font-black text-center tracking-wider"
            style={{ color: hex }}>
            ¡ASCENSO CONFIRMADO!
          </p>
          <p className="text-white/40 text-sm text-center mt-2">
            {playerAlias} subió al rango {toName}
          </p>
        </div>
      </div>

      {/* Rayos de luz radiales */}
      {(phase === "reveal" || phase === "complete") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 origin-left"
              style={{
                width: "150%",
                height: "2px",
                background: `linear-gradient(to right, ${glow}, transparent 60%)`,
                transform: `rotate(${i * 30}deg)`,
                opacity: 0.15,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
