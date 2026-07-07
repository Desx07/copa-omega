// ============================================================================
// Modo Ascenso — capa de datos compartida (rangos, tickets y progresión)
//
// IMPORTANTE: los nombres y ticketTarget DEBEN coincidir con el seed de
// `ascenso_ranks` en supabase/migrations/20260612000000_ascenso_system.sql.
// Los colores/glows vienen del RANK_CONFIG de app/(app)/ascenso (rank-tower).
// ============================================================================

export type RankLetter = "F" | "E" | "D" | "C" | "B" | "A" | "S";

// ── Progresión estilo Pokémon Z-A: subir de rango cuesta N peleas ──
// Cada victoria da POINTS_PER_WIN puntos fijos (el perdedor no suma), así el
// costo por rango es predecible: peleas × POINTS_PER_WIN.
// Peleas por rango: 30 el primero, +10 por cada rango siguiente.
/** Puntos fijos que suma el ganador de una pelea normal de ascenso. */
export const POINTS_PER_WIN = 10;
/** Peleas necesarias para llenar el ticket de cada rango (F→E = 30, +10 por rango). */
export const FIGHTS_PER_RANK: Record<Exclude<RankLetter, "S">, number> = {
  F: 30, E: 40, D: 50, C: 60, B: 70, A: 80,
};

export interface RankInfo {
  letter: RankLetter;
  name: string;
  /** Peleas ganadas para habilitar el combate de ascenso. null = rango máximo (S). */
  fightsToRankUp: number | null;
  /** Puntos de ticket para habilitar el combate de ascenso. null = rango máximo (S). */
  ticketTarget: number | null;
  /** Clases de gradiente Tailwind (ej: "from-gray-700 to-gray-900"). */
  color: string;
  /** Color rgba para box-shadow / glow. */
  glow: string;
}

/** Rangos en orden ascendente: F → S. ticketTarget = peleas × POINTS_PER_WIN. */
export const RANKS: RankInfo[] = [
  { letter: "F", name: "Novato",   fightsToRankUp: 30,   ticketTarget: 30 * POINTS_PER_WIN,  color: "from-gray-700 to-gray-900",     glow: "rgba(156,163,175,0.3)" },
  { letter: "E", name: "Hierro",   fightsToRankUp: 40,   ticketTarget: 40 * POINTS_PER_WIN,  color: "from-green-800 to-green-950",   glow: "rgba(74,222,128,0.4)" },
  { letter: "D", name: "Bronce",   fightsToRankUp: 50,   ticketTarget: 50 * POINTS_PER_WIN,  color: "from-blue-700 to-blue-900",     glow: "rgba(96,165,250,0.5)" },
  { letter: "C", name: "Plata",    fightsToRankUp: 60,   ticketTarget: 60 * POINTS_PER_WIN,  color: "from-purple-700 to-purple-900", glow: "rgba(192,132,252,0.5)" },
  { letter: "B", name: "Oro",      fightsToRankUp: 70,   ticketTarget: 70 * POINTS_PER_WIN,  color: "from-red-700 to-red-900",       glow: "rgba(248,113,113,0.5)" },
  { letter: "A", name: "Diamante", fightsToRankUp: 80,   ticketTarget: 80 * POINTS_PER_WIN,  color: "from-amber-700 to-amber-900",   glow: "rgba(251,191,36,0.5)" },
  { letter: "S", name: "Omega",    fightsToRankUp: null, ticketTarget: null, color: "from-yellow-500 to-amber-600",  glow: "rgba(253,224,71,0.6)" },
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
