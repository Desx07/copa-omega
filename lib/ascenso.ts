// ============================================================================
// Modo Ascenso — capa de datos compartida (rangos, tickets y progresión)
//
// IMPORTANTE: los nombres y ticketTarget DEBEN coincidir con el seed de
// `ascenso_ranks` en supabase/migrations/20260612000000_ascenso_system.sql.
// Los colores/glows vienen del RANK_CONFIG de app/(app)/ascenso (rank-tower).
// ============================================================================

export type RankLetter = "F" | "E" | "D" | "C" | "B" | "A" | "S";

export interface RankInfo {
  letter: RankLetter;
  name: string;
  /** Puntos de ticket para habilitar el combate de ascenso. null = rango máximo (S). */
  ticketTarget: number | null;
  /** Clases de gradiente Tailwind (ej: "from-gray-700 to-gray-900"). */
  color: string;
  /** Color rgba para box-shadow / glow. */
  glow: string;
}

/** Rangos en orden ascendente: F → S. */
export const RANKS: RankInfo[] = [
  { letter: "F", name: "Novato",   ticketTarget: 100,  color: "from-gray-700 to-gray-900",     glow: "rgba(156,163,175,0.3)" },
  { letter: "E", name: "Hierro",   ticketTarget: 150,  color: "from-green-800 to-green-950",   glow: "rgba(74,222,128,0.4)" },
  { letter: "D", name: "Bronce",   ticketTarget: 200,  color: "from-blue-700 to-blue-900",     glow: "rgba(96,165,250,0.5)" },
  { letter: "C", name: "Plata",    ticketTarget: 300,  color: "from-purple-700 to-purple-900", glow: "rgba(192,132,252,0.5)" },
  { letter: "B", name: "Oro",      ticketTarget: 400,  color: "from-red-700 to-red-900",       glow: "rgba(248,113,113,0.5)" },
  { letter: "A", name: "Diamante", ticketTarget: 500,  color: "from-amber-700 to-amber-900",   glow: "rgba(251,191,36,0.5)" },
  { letter: "S", name: "Omega",    ticketTarget: null, color: "from-yellow-500 to-amber-600",  glow: "rgba(253,224,71,0.6)" },
];

/** Info completa de un rango. Lanza si la letra no existe (imposible por tipo). */
export function rankInfo(letter: RankLetter): RankInfo {
  const info = RANKS.find((r) => r.letter === letter);
  if (!info) {
    throw new Error(`Rango desconocido: ${letter}`);
  }
  return info;
}

/** Siguiente rango en la escalera, o null si ya está en S. */
export function nextRank(letter: RankLetter): RankLetter | null {
  const idx = RANKS.findIndex((r) => r.letter === letter);
  if (idx === -1) return null;
  const next = RANKS[idx + 1];
  return next ? next.letter : null;
}

/** true si el ticket está lleno y habilita combate de ascenso. Rango S nunca. */
export function hasFullTicket(letter: RankLetter, ticketPoints: number): boolean {
  const target = rankInfo(letter).ticketTarget;
  if (target === null) return false; // rango S: no hay más ascenso
  return ticketPoints >= target;
}
