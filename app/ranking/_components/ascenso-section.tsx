"use client";

import Link from "next/link";
import { ChevronsUp } from "lucide-react";
import { rankInfo, type RankLetter } from "@/lib/ascenso";
import { OnlineDot } from "@/app/_components/online-dot";

/* -------------------------------------------------------------------------- */
/*  Sección de ranking del Modo Ascenso                                        */
/*  Lista ordenada por rango (S primero) y puntos de ticket desc.              */
/*  Si no hay datos (migración pendiente o torneo sin arrancar) muestra        */
/*  un estado vacío prolijo en vez de romper.                                  */
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
      <div className="mx-4 omega-card p-12 text-center space-y-4">
        <ChevronsUp className="size-16 text-omega-muted/30 mx-auto" />
        <div className="space-y-2">
          <p className="text-lg font-bold text-omega-muted">
            El ranking de ascenso se activa cuando arranque el torneo
          </p>
          <p className="text-sm text-omega-muted/70">
            Sumá puntos de ticket en cada batalla para subir de rango
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3">
      {/* Header de sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronsUp className="size-4 text-omega-green" />
          <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
            Ranking de Ascenso
          </h2>
        </div>
        <span className="omega-badge omega-badge-green">{ranking.length}</span>
      </div>

      {/* Filas (misma estética que el ranking de estrellas) */}
      <div className="space-y-2">
        {ranking.map((entry, index) => {
          const info = rankInfo(entry.rank_letter);
          return (
            <Link
              key={entry.id}
              href={`/player/${entry.id}`}
              data-testid={`ascenso-row-${entry.id}`}
              className={`rounded-xl border-l-4 bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3 ${entry.is_eliminated ? "opacity-60" : ""}`}
              style={{ borderLeftColor: info.glow }}
            >
              {/* Posición */}
              <span className="text-sm font-black text-omega-muted/70 w-6 text-center shrink-0">
                {index + 1}
              </span>

              {/* Avatar */}
              <div className="size-9 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                    {entry.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Alias + badge de rango */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-bold truncate ${entry.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"}`}
                  >
                    {entry.alias}
                  </span>
                  <OnlineDot playerId={entry.id} />
                </div>
                <span className="text-[11px] text-omega-muted">{info.name}</span>
              </div>

              {/* Letra de rango con gradiente + glow */}
              <div
                className={`size-8 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 0 12px ${info.glow}` }}
              >
                <span className="text-sm font-black text-white">
                  {entry.rank_letter}
                </span>
              </div>

              {/* Puntos de ticket */}
              <div className="flex items-center gap-1 shrink-0 w-20 justify-end">
                <span className="text-sm">🎫</span>
                <span className="text-sm font-black text-omega-gold">
                  {entry.ticket_points}
                </span>
                <span className="text-[10px] text-omega-muted">pts</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
