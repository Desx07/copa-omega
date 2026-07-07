"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronsUp } from "lucide-react";
import { rankInfo, type RankLetter } from "@/lib/ascenso";
import {
  RankSeal,
  RANK_HEX,
  ASCENSO_TEXT_GRADIENT,
  ASCENSO_TEXT_GRADIENT_GOLD,
} from "@/app/(app)/ascenso/_components/ascenso-ui";
import { OnlineDot } from "@/app/_components/online-dot";

/* -------------------------------------------------------------------------- */
/*  Sección de ranking del Modo Ascenso                                        */
/*  Lista ordenada por rango (S primero) y puntos de ticket desc.              */
/*  Estética alineada con la landing aprobada de Ascenso: sellos hexagonales   */
/*  por rango (hex-clip + RANK_HEX + glow), header tipo estadio y acentos      */
/*  cian/ámbar. NO es una tabla plana más de Copa Omega.                       */
/*  Si no hay datos (migración pendiente o torneo sin arrancar) muestra        */
/*  un estado vacío prolijo, con la misma identidad visual.                    */
/* -------------------------------------------------------------------------- */

// Entrada del ranking de ascenso, ya saneada y ordenada por el server component
export interface AscensoEntry {
  id: string;
  alias: string;
  avatar_url: string | null;
  rank_letter: RankLetter;
  ticket_points: number;
  is_eliminated: boolean;
}

export function AscensoSection({ ranking }: { ranking: AscensoEntry[] }) {
  // Estado vacío: la migración de ascenso todavía no corrió o no hay jugadores
  if (ranking.length === 0) {
    return (
      <div className="px-4">
        <AscensoHeader count={0} topLetter={null} />
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-sm">
          <RankSeal letter="F" caption="rango base" size="md" className="mx-auto" />
          <div className="mt-5 space-y-2">
            <p className="text-lg font-black uppercase tracking-tight text-white/90">
              El ranking de ascenso se activa cuando arranque el torneo
            </p>
            <p className="text-sm text-omega-muted">
              Sumá puntos de ticket en cada batalla para escalar de{" "}
              <span className={ASCENSO_TEXT_GRADIENT}>F</span> a{" "}
              <span className={ASCENSO_TEXT_GRADIENT_GOLD}>S</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3">
      <AscensoHeader count={ranking.length} topLetter={ranking[0].rank_letter} />

      {/* Filas: cada blader es una "estación" translúcida sobre el estadio,
          con su sello hexagonal de rango y la barra de progreso del ticket. */}
      <div className="space-y-2.5">
        {ranking.map((entry, index) => (
          <AscensoRow key={entry.id} entry={entry} position={index + 1} leader={index === 0} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header de sección con estética estadio (contenido, no fondo fijo global)   */
/* -------------------------------------------------------------------------- */

function AscensoHeader({ count, topLetter }: { count: number; topLetter: RankLetter | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#05070d]">
      {/* Capa 1 — estadio real (contenido dentro del panel, no full-page). */}
      <Image
        src="/stadium.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-top opacity-40 mix-blend-screen"
      />
      {/* Capa 2 — resplandor frío cian. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_0%,_rgba(56,189,248,0.22),_transparent_70%)]" />
      {/* Capa 3 — viñeta para asentar el texto. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_0%,_transparent_40%,_rgba(2,4,10,0.9)_100%)]" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          {/* Kicker font-mono con línea cian (marca de la landing). */}
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-400/60" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/90">
              Ranking · Ascenso
            </p>
          </div>
          <h2 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-white/95">
            Escalera de{" "}
            <span className={ASCENSO_TEXT_GRADIENT_GOLD}>rangos</span>
          </h2>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-cyan-200/70">
            <ChevronsUp className="size-3.5" />
            {count} {count === 1 ? "blader en pista" : "bladers en pista"}
          </p>
        </div>

        {/* Sello del rango más alto en juego (o F si el ranking está vacío). */}
        <RankSeal letter={topLetter ?? "F"} size="sm" pulse className="shrink-0" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fila de blader                                                             */
/* -------------------------------------------------------------------------- */

function AscensoRow({
  entry,
  position,
  leader,
}: {
  entry: AscensoEntry;
  position: number;
  leader: boolean;
}) {
  const info = rankInfo(entry.rank_letter);
  const color = RANK_HEX[entry.rank_letter];
  const target = info.ticketTarget; // null en rango S (máximo)
  // Progreso del ticket hacia el próximo ascenso (0..100). En S se muestra lleno.
  const progress =
    target === null ? 100 : Math.min(100, Math.round((entry.ticket_points / target) * 100));

  return (
    <Link
      href={`/player/${entry.id}`}
      data-testid={`ascenso-row-${entry.id}`}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.06] ${
        entry.is_eliminated ? "opacity-60" : ""
      }`}
    >
      {/* Filo de color del rango a la izquierda (identidad por rango). */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(to bottom, ${color}, ${color}55)` }}
      />

      {/* Posición */}
      <span className="w-5 shrink-0 text-center font-mono text-sm font-black text-white/45">
        {position}
      </span>

      {/* Avatar con borde del color del rango */}
      <div
        className="size-10 shrink-0 overflow-hidden rounded-full border bg-omega-dark"
        style={{ borderColor: `${color}80` }}
      >
        {entry.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatar_url} alt="" className="size-full object-cover" />
        ) : (
          <div
            className="flex size-full items-center justify-center text-sm font-black"
            style={{ color }}
          >
            {entry.alias.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Alias + nombre de rango + barra de progreso del ticket */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`truncate text-sm font-black uppercase tracking-tight ${
              entry.is_eliminated ? "text-omega-muted line-through" : "text-white/90"
            }`}
          >
            {entry.alias}
          </span>
          <OnlineDot playerId={entry.id} />
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {info.name}
          </span>
          {/* Barra de progreso del ticket hacia el próximo rango. */}
          <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${color}, ${color})`,
                boxShadow: `0 0 8px ${color}aa`,
              }}
            />
          </span>
        </div>
      </div>

      {/* Sello hexagonal de rango (la pieza distintiva de la landing).
          El líder late para marcar la cima de la escalera. */}
      <RankSeal
        letter={entry.rank_letter}
        size="sm"
        pulse={leader}
        className="shrink-0 scale-90 md:scale-100"
      />

      {/* Ticket: puntos actuales / objetivo del rango (o MÁX en S). */}
      <div className="w-16 shrink-0 text-right">
        <p className={`font-mono text-base font-black leading-none ${ASCENSO_TEXT_GRADIENT_GOLD}`}>
          {entry.ticket_points}
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-omega-muted">
          {target === null ? "máx" : `/ ${target} pts`}
        </p>
      </div>
    </Link>
  );
}
