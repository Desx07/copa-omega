// =============================================================================
// BeyGacha — Sistema de combo random con tiers ponderados
// Usa los datos reales de la Xciclopedia
// =============================================================================

import { BLADES, RATCHETS, BITS } from "@/lib/encyclopedia";

export const GACHA_COST = 30; // Omega Coins

// Pesos de probabilidad por tier
// S=5%, A=15%, B=35%, C=45%
const TIER_WEIGHTS: Record<string, number> = {
  S: 5,
  A: 15,
  B: 35,
  C: 45,
};

interface GachaPiece {
  name: string;
  tier: "S" | "A" | "B" | "C";
}

// Agrupar piezas por tier
function groupByTier<T extends { tier: string }>(
  items: T[],
  getName: (item: T) => string
): Record<string, GachaPiece[]> {
  const groups: Record<string, GachaPiece[]> = { S: [], A: [], B: [], C: [] };
  for (const item of items) {
    const tier = item.tier as "S" | "A" | "B" | "C";
    if (groups[tier]) {
      groups[tier].push({ name: getName(item), tier });
    }
  }
  return groups;
}

// Seleccionar tier basado en los pesos de probabilidad
function pickTier(): "S" | "A" | "B" | "C" {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [tier, weight] of Object.entries(TIER_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) return tier as "S" | "A" | "B" | "C";
  }
  return "C"; // fallback
}

// Seleccionar un item random de un array
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Ratchets tienen variantes de altura, generamos combos reales
// Cada ratchet tiene su numero base y alturas posibles
const RATCHET_HEIGHTS: Record<string, string[]> = {
  "0": ["0-60", "0-70", "0-80"],
  "1": ["1-60", "1-70", "1-80"],
  "2": ["2-60", "2-70", "2-80"],
  "3": ["3-60", "3-70", "3-80"],
  "3-85": ["3-85"],
  "4": ["4-50", "4-60", "4-70", "4-80"],
  "4-55": ["4-55"],
  "5": ["5-60", "5-70", "5-80"],
  "M-85": ["M-85"],
  "6": ["6-60", "6-70", "6-80"],
  "7": ["7-60", "7-70", "7-80"],
  "7-55": ["7-55"],
  "9": ["9-60", "9-65", "9-70", "9-80"],
};

export interface GachaResult {
  blade: string;
  bladeTier: "S" | "A" | "B" | "C";
  ratchet: string;
  ratchetTier: "S" | "A" | "B" | "C";
  bit: string;
  bitTier: "S" | "A" | "B" | "C";
  overallTier: "S" | "A" | "B" | "C";
}

// Calcular el tier general del combo
// Si hay al menos 2 piezas S -> S
// Si hay al menos 1 pieza S o 2 A -> A
// Si hay al menos 1 pieza A o 2 B -> B
// Sino -> C
function calculateOverallTier(
  bladeTier: string,
  ratchetTier: string,
  bitTier: string
): "S" | "A" | "B" | "C" {
  const tiers = [bladeTier, ratchetTier, bitTier];
  const counts = { S: 0, A: 0, B: 0, C: 0 };
  for (const t of tiers) counts[t as keyof typeof counts]++;

  if (counts.S >= 2) return "S";
  if (counts.S >= 1 && counts.A >= 1) return "A";
  if (counts.A >= 2) return "A";
  if (counts.A >= 1 || counts.B >= 2) return "B";
  return "C";
}

// El pull principal
export function pullGacha(): GachaResult {
  const bladesByTier = groupByTier(BLADES, (b) => b.name);
  const ratchetsByTier = groupByTier(RATCHETS, (r) => r.number);
  const bitsByTier = groupByTier(BITS, (b) => b.name);

  // Seleccionar tier para cada pieza
  const bladeTier = pickTier();
  const ratchetTier = pickTier();
  const bitTier = pickTier();

  // Seleccionar pieza dentro del tier
  // Si un tier esta vacio (no hay piezas de ese tier), usar el siguiente
  const blade =
    bladesByTier[bladeTier].length > 0
      ? pickRandom(bladesByTier[bladeTier])
      : pickRandom(bladesByTier.B);
  const ratchetBase =
    ratchetsByTier[ratchetTier].length > 0
      ? pickRandom(ratchetsByTier[ratchetTier])
      : pickRandom(ratchetsByTier.B);
  const bit =
    bitsByTier[bitTier].length > 0
      ? pickRandom(bitsByTier[bitTier])
      : pickRandom(bitsByTier.B);

  // Generar ratchet completo con altura random
  const heights = RATCHET_HEIGHTS[ratchetBase.name] || [`${ratchetBase.name}-60`];
  const fullRatchet = pickRandom(heights);

  const overallTier = calculateOverallTier(bladeTier, ratchetTier, bitTier);

  return {
    blade: blade.name,
    bladeTier: blade.tier,
    ratchet: fullRatchet,
    ratchetTier: ratchetBase.tier,
    bit: bit.name,
    bitTier: bit.tier,
    overallTier,
  };
}

// Colores y labels por tier
export const TIER_CONFIG = {
  S: { label: "LEGENDARIO", color: "gold", bgClass: "from-yellow-500/30 to-amber-600/30", textClass: "text-omega-gold", borderClass: "border-omega-gold/50" },
  A: { label: "EPICO", color: "purple", bgClass: "from-purple-500/30 to-violet-600/30", textClass: "text-omega-purple", borderClass: "border-omega-purple/50" },
  B: { label: "RARO", color: "blue", bgClass: "from-blue-500/30 to-cyan-600/30", textClass: "text-omega-blue", borderClass: "border-omega-blue/50" },
  C: { label: "COMUN", color: "gray", bgClass: "from-gray-500/20 to-gray-600/20", textClass: "text-omega-muted", borderClass: "border-omega-border" },
} as const;

// Stats del gacha para mostrar en la UI
export function getGachaStats() {
  return {
    totalBlades: BLADES.length,
    totalRatchets: RATCHETS.length,
    totalBits: BITS.length,
    tierRates: { S: "5%", A: "15%", B: "35%", C: "45%" },
  };
}
