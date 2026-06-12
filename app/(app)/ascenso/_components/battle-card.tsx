"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { rankInfo, type RankLetter } from "@/lib/ascenso";

// ── Tipos ──
export interface BattlePlayer {
  id: string;
  alias: string;
  avatar_url?: string;
  rank: RankLetter;
  ticketPoints?: number; // puntos de ticket acumulados
  wins?: number;
  losses?: number;
  beyImage?: string;
  beyName?: string;
  characterId?: string; // chr_00, chr_05, etc — personaje de Beyblade X
  statusText?: string;
}

interface BattleCardProps {
  player: BattlePlayer;
  opponent: BattlePlayer;
  status: "loading" | "reveal" | "ready" | "in_progress" | "completed";
  winner?: string;
  /** Tipo de combate: normal (por puntos) o ascension (sube de rango) */
  kind: "normal" | "ascension";
  /** Puntos ganados en el combate (solo relevante en victoria normal) */
  pointsAwarded?: number | null;
}

// ── Colores del rango (badge chico) ──
const RANK_BADGE: Record<RankLetter, { bg: string; text: string }> = {
  F: { bg: "bg-gray-600", text: "text-gray-200" },
  E: { bg: "bg-green-700", text: "text-green-200" },
  D: { bg: "bg-blue-700", text: "text-blue-200" },
  C: { bg: "bg-purple-700", text: "text-purple-200" },
  B: { bg: "bg-red-700", text: "text-red-200" },
  A: { bg: "bg-amber-700", text: "text-amber-200" },
  S: { bg: "bg-yellow-500", text: "text-yellow-900" },
};

// ── Player Card (estilo Pokémon Z-A) ──
function PlayerCard({
  player,
  side,
  isWinner,
  isRevealed,
}: {
  player: BattlePlayer;
  side: "left" | "right";
  isWinner?: boolean;
  isRevealed: boolean;
}) {
  const badge = RANK_BADGE[player.rank] ?? RANK_BADGE.F;
  const isLeft = side === "left";
  const charId = player.characterId || (isLeft ? "00" : "05");
  const statusText = player.statusText || (isLeft ? "¡AL MÁXIMO!" : "PRÓXIMO COMBATE");

  return (
    <div className={`relative flex-1 overflow-hidden rounded-xl ${isWinner ? "ring-2 ring-yellow-400" : ""}`}>
      <div className="relative w-full aspect-[4/3] sm:aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-950">
        {/* Personaje de Beyblade X como fondo principal */}
        <div className="absolute inset-0 flex items-end justify-center">
          <Image
            src={`/characters/chr_${charId}.png`}
            alt={player.alias}
            width={400}
            height={500}
            className="object-contain h-[90%] w-auto drop-shadow-[0_0_15px_rgba(100,150,255,0.3)]"
          />
        </div>

        {/* Overlay gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Nombre arriba */}
        <div className="absolute top-2 left-0 right-0 text-center">
          <span className="text-white font-bold text-sm sm:text-base drop-shadow-lg">
            {player.alias}
          </span>
        </div>

        {/* Badge de rango — esquina */}
        <div className={`absolute ${isLeft ? "left-2" : "right-2"} top-8 sm:top-10`}>
          <div className={`${badge.bg} px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg`}>
            <span className="text-[10px] font-bold text-white/70 uppercase">Rango</span>
            <span className={`text-xl font-black ${badge.text}`}>{player.rank}</span>
          </div>
        </div>

        {/* Banner diagonal con estado */}
        <div className="absolute bottom-12 sm:bottom-14 left-0 right-0">
          <div className={`
            py-1.5 px-3
            ${isLeft
              ? "bg-gradient-to-r from-fuchsia-600/90 via-purple-600/90 to-transparent"
              : "bg-gradient-to-l from-cyan-600/90 via-blue-600/90 to-transparent"
            }
            ${isLeft ? "text-left" : "text-right"}
          `}
            style={{ clipPath: isLeft
              ? "polygon(0 0, 100% 10%, 95% 100%, 0 100%)"
              : "polygon(5% 0, 100% 0, 100% 100%, 0 90%)"
            }}
          >
            <span className="text-white font-black text-sm sm:text-base tracking-wide drop-shadow-lg">
              {statusText}
            </span>
          </div>
        </div>

        {/* Info inferior */}
        <div className="absolute bottom-2 left-0 right-0 px-3">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>
              {player.ticketPoints !== undefined ? `🎫 ${player.ticketPoints.toLocaleString()}` : ""}
            </span>
            <span>{player.beyName ?? rankInfo(player.rank).name}</span>
            <span>
              {player.wins !== undefined && player.losses !== undefined
                ? `${player.wins}W ${player.losses}L`
                : ""}
            </span>
          </div>
        </div>

        {/* Winner — borde dorado + banner arriba */}
        {isWinner && (
          <>
            <div className="absolute inset-0 ring-4 ring-yellow-400/60 rounded-xl pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-yellow-500/90 to-amber-500/90 py-1.5 text-center z-20">
              <span className="text-white font-black text-sm tracking-wider">GANADOR</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Opponent hidden card ──
function HiddenCard() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-xl">
      <div className="relative w-full aspect-[4/3] sm:aspect-[3/4] bg-gradient-to-br from-slate-800 to-slate-950 flex flex-col items-center justify-center gap-3">
        {/* Silueta */}
        <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-5xl text-white/15">?</span>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-l from-cyan-600/90 via-blue-600/90 to-transparent py-1.5 px-6 w-full text-right"
          style={{ clipPath: "polygon(5% 0, 100% 0, 100% 100%, 0 90%)" }}>
          <span className="text-white font-black text-sm tracking-wide animate-pulse">
            PRÓXIMO COMBATE
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Loading — Stadium + Logo ──
function LoadingAnimation() {
  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center overflow-hidden rounded-xl">
      <Image src="/stadium.png" alt="" fill className="object-cover opacity-30 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      <div className="relative flex flex-col items-center z-10">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-cyan-500/20 animate-pulse rounded-full scale-150" />
          <Image src="/bladers-logo.png" alt="Bladers Santa Fe" width={140} height={140}
            className="relative drop-shadow-[0_0_30px_rgba(0,255,255,0.4)] animate-pulse"
            style={{ animationDuration: "2s" }} />
        </div>
        <p className="mt-5 text-cyan-400 text-sm font-mono tracking-[0.3em] animate-pulse">
          OPONENTE DEFINIDO
        </p>
      </div>
    </div>
  );
}

// ── Pantalla principal ──
export default function BattleScreen({ player, opponent, status, winner, kind, pointsAwarded }: BattleCardProps) {
  const [showLoading, setShowLoading] = useState(status === "loading");
  const [revealed, setRevealed] = useState(status !== "loading");
  const isAscension = kind === "ascension";

  // Texto de victoria según el tipo de combate
  const victoryText = isAscension
    ? "¡VICTORIA! ASCENSO CONFIRMADO"
    : pointsAwarded != null
      ? `¡VICTORIA! +${pointsAwarded.toLocaleString()} PUNTOS`
      : "¡VICTORIA!";

  useEffect(() => {
    if (status === "loading") {
      setShowLoading(true);
      setRevealed(false);
      const timer = setTimeout(() => {
        setShowLoading(false);
        setRevealed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (status === "reveal" || status === "ready") {
      setShowLoading(false);
      setRevealed(true);
    }
  }, [status]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Header tabs (como Pokémon Z-A) */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">⚔️ Zona de combate</span>
        </div>
        <span className="text-white font-bold text-xs sm:text-sm bg-white/10 px-3 py-1 rounded-full">
          {isAscension ? "Combate de ascenso" : "Combate"}
        </span>
      </div>

      {/* Cards container */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/50">
        {showLoading && <LoadingAnimation />}

        <div className="flex gap-1 p-1">
          {/* Player card */}
          <PlayerCard
            player={player}
            side="left"
            isWinner={winner === player.id}
            isRevealed={true}
          />

          {/* Opponent card */}
          <div className={`flex-1 transition-all duration-1000 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            {revealed ? (
              <PlayerCard
                player={{...opponent, statusText: "PRÓXIMO COMBATE"}}
                side="right"
                isWinner={winner === opponent.id}
                isRevealed={true}
              />
            ) : (
              <HiddenCard />
            )}
          </div>
        </div>

        {/* Banner inferior */}
        {status === "ready" && (
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 py-2 text-center">
            <span className="text-white font-bold text-xs tracking-wider">
              {isAscension ? "¡COMBATE DE ASCENSO LISTO!" : "¡COMBATE LISTO!"}
            </span>
          </div>
        )}
        {status === "completed" && winner && (
          <div className={`py-2 text-center ${winner === player.id
            ? "bg-gradient-to-r from-yellow-600 to-amber-600"
            : "bg-gradient-to-r from-gray-700 to-gray-800"}`}>
            <span className="text-white font-bold text-xs tracking-wider">
              {winner === player.id ? victoryText : "DERROTA — INTENTÁ DE NUEVO"}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
