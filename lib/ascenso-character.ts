// ============================================================================
// Modo Ascenso — personaje determinístico por jugador
//
// Mismo algoritmo que app/(app)/ascenso/page.tsx (characterFor): a partir del
// id de jugador devuelve un id de personaje estable (no cambia entre renders ni
// sesiones). Se extrae acá para reutilizarlo en el server (banner del carrusel)
// sin duplicar la lista ni el hash.
// ============================================================================

// Personajes de Beyblade X disponibles en /public/characters (chr_XX.png).
export const CHARACTER_IDS = [
  "00", "01", "05", "06", "07", "08", "10", "11", "12", "16", "17", "18",
  "19", "20", "21", "22", "24", "25", "26", "27", "32", "36", "37", "38",
  "39", "40", "41", "42", "43", "44", "45", "46", "48", "49", "50", "51",
  "52", "53", "54", "55", "56", "57", "58",
];

/** Id de personaje determinístico a partir del id de jugador. */
export function characterFor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
  }
  return CHARACTER_IDS[hash % CHARACTER_IDS.length];
}
