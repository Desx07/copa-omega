// ============================================================================
// SIMULATOR DATA — Datos de piezas para el Combo Simulator
// Propiedades de stats derivadas de la enciclopedia real (lib/encyclopedia.ts)
// ============================================================================

export interface BladeStats {
  name: string;
  type: "attack" | "defense" | "stamina" | "balance";
  tier: "S" | "A" | "B" | "C";
  weight: number; // gramos, 0 si desconocido
  atk: number;
  def: number;
  sta: number;
  wgt: number;
  bst: number; // burst resistance
}

export interface RatchetStats {
  label: string; // ej: "9-60"
  number: string; // ej: "9"
  height: string; // ej: "60"
  tier: "S" | "A" | "B" | "C";
  weight: number;
  defBonus: number;
  staBonus: number;
  wgtBonus: number;
  bstBonus: number;
}

export interface BitStats {
  name: string;
  category: "attack" | "defense" | "stamina" | "balance";
  tier: "S" | "A" | "B" | "C";
  weight: number;
  atkBonus: number;
  defBonus: number;
  staBonus: number;
  movBonus: number; // movement / mobility
}

// =============================================================================
// BLADES — stats basados en tipo, tier y peso real de encyclopedia.ts
// =============================================================================

export const BLADE_DATA: BladeStats[] = [
  // S Tier
  { name: "WizardRod",     type: "balance",  tier: "S", weight: 35.2, atk: 65, def: 80, sta: 90, wgt: 80, bst: 75 },
  { name: "SharkScale",    type: "attack",   tier: "S", weight: 33,   atk: 92, def: 45, sta: 55, wgt: 72, bst: 60 },
  { name: "AeroPegasus",   type: "attack",   tier: "S", weight: 32,   atk: 88, def: 40, sta: 50, wgt: 68, bst: 55 },
  { name: "WyvernGale",    type: "balance",  tier: "S", weight: 32,   atk: 70, def: 70, sta: 80, wgt: 70, bst: 70 },
  { name: "MeteorDragoon", type: "attack",   tier: "S", weight: 39.2, atk: 95, def: 55, sta: 60, wgt: 95, bst: 50 },

  // A Tier
  { name: "PhoenixWing",    type: "attack",   tier: "A", weight: 32.9, atk: 85, def: 55, sta: 50, wgt: 75, bst: 60 },
  { name: "CobaltDrake",    type: "defense",  tier: "A", weight: 38.1, atk: 50, def: 95, sta: 75, wgt: 95, bst: 85 },
  { name: "CobaltDragoon",  type: "defense",  tier: "A", weight: 37.8, atk: 45, def: 85, sta: 90, wgt: 92, bst: 80 },
  { name: "DranSword",      type: "attack",   tier: "A", weight: 35.4, atk: 80, def: 55, sta: 60, wgt: 82, bst: 65 },
  { name: "HellsScythe",    type: "balance",  tier: "A", weight: 32.9, atk: 70, def: 60, sta: 75, wgt: 70, bst: 65 },
  { name: "WhaleWave",      type: "attack",   tier: "A", weight: 34,   atk: 88, def: 40, sta: 45, wgt: 78, bst: 50 },
  { name: "TyrannoBeat",    type: "attack",   tier: "A", weight: 36.8, atk: 90, def: 50, sta: 45, wgt: 88, bst: 55 },
  { name: "SamuraiSaber",   type: "defense",  tier: "A", weight: 33,   atk: 45, def: 85, sta: 70, wgt: 72, bst: 75 },
  { name: "SilverWolf",     type: "defense",  tier: "A", weight: 33,   atk: 50, def: 80, sta: 70, wgt: 72, bst: 70 },
  { name: "GolemRock",      type: "defense",  tier: "A", weight: 34,   atk: 40, def: 88, sta: 78, wgt: 78, bst: 80 },
  { name: "ScorpioSpear",   type: "attack",   tier: "A", weight: 33,   atk: 82, def: 45, sta: 55, wgt: 72, bst: 55 },
  { name: "TyrannoRoar",    type: "attack",   tier: "A", weight: 36,   atk: 88, def: 45, sta: 42, wgt: 85, bst: 52 },
  { name: "YellKong",       type: "balance",  tier: "A", weight: 31.1, atk: 55, def: 65, sta: 80, wgt: 62, bst: 68 },
  { name: "ImpactDrake",    type: "attack",   tier: "A", weight: 39,   atk: 92, def: 50, sta: 40, wgt: 95, bst: 48 },
  { name: "HoverWyvern",    type: "defense",  tier: "A", weight: 35,   atk: 40, def: 90, sta: 82, wgt: 80, bst: 82 },
  { name: "ClockMirage",    type: "defense",  tier: "A", weight: 37.7, atk: 42, def: 92, sta: 80, wgt: 90, bst: 85 },
  { name: "MummyCurse",     type: "defense",  tier: "A", weight: 37.2, atk: 40, def: 90, sta: 82, wgt: 88, bst: 82 },
  { name: "PegasusBlast",   type: "attack",   tier: "A", weight: 32.7, atk: 85, def: 48, sta: 50, wgt: 70, bst: 58 },
  { name: "EmperorMight",   type: "attack",   tier: "A", weight: 32.5, atk: 83, def: 50, sta: 52, wgt: 70, bst: 60 },

  // B Tier
  { name: "DranDagger",     type: "balance",  tier: "B", weight: 34.9, atk: 60, def: 60, sta: 65, wgt: 78, bst: 65 },
  { name: "KnightShield",   type: "defense",  tier: "B", weight: 32.3, atk: 35, def: 78, sta: 72, wgt: 68, bst: 70 },
  { name: "LeonClaw",       type: "attack",   tier: "B", weight: 31.6, atk: 78, def: 40, sta: 45, wgt: 65, bst: 50 },
  { name: "ViperTail",      type: "balance",  tier: "B", weight: 34.4, atk: 55, def: 60, sta: 72, wgt: 78, bst: 62 },
  { name: "WeissTiger",     type: "balance",  tier: "B", weight: 32,   atk: 55, def: 65, sta: 68, wgt: 68, bst: 65 },
  { name: "KnightLance",    type: "attack",   tier: "B", weight: 32,   atk: 80, def: 35, sta: 40, wgt: 68, bst: 45 },
  { name: "KnightMail",     type: "defense",  tier: "B", weight: 32,   atk: 45, def: 75, sta: 65, wgt: 68, bst: 68 },
  { name: "PhoenixFeather", type: "attack",   tier: "B", weight: 32.9, atk: 70, def: 50, sta: 60, wgt: 72, bst: 55 },
  { name: "HellsChain",     type: "defense",  tier: "B", weight: 32,   atk: 40, def: 78, sta: 72, wgt: 68, bst: 72 },
  { name: "UnicornSting",   type: "defense",  tier: "B", weight: 32,   atk: 38, def: 76, sta: 70, wgt: 68, bst: 70 },
  { name: "LeonCrest",      type: "defense",  tier: "B", weight: 32,   atk: 35, def: 80, sta: 72, wgt: 68, bst: 72 },
  { name: "PhoenixRudder",  type: "defense",  tier: "B", weight: 32,   atk: 38, def: 75, sta: 68, wgt: 68, bst: 68 },
  { name: "TriceraPress",   type: "attack",   tier: "B", weight: 32,   atk: 75, def: 42, sta: 45, wgt: 68, bst: 52 },
  { name: "SamuraiCalibur", type: "attack",   tier: "B", weight: 32,   atk: 72, def: 40, sta: 42, wgt: 68, bst: 50 },
  { name: "DranBuster",     type: "attack",   tier: "B", weight: 32,   atk: 78, def: 35, sta: 38, wgt: 68, bst: 45 },
  { name: "ShinobiShadow",  type: "balance",  tier: "B", weight: 28.4, atk: 60, def: 50, sta: 65, wgt: 50, bst: 55 },
  { name: "DranBrave",      type: "attack",   tier: "B", weight: 32,   atk: 72, def: 38, sta: 42, wgt: 68, bst: 48 },
  { name: "ValorBison",     type: "defense",  tier: "B", weight: 33,   atk: 38, def: 78, sta: 70, wgt: 72, bst: 72 },
  { name: "MammothTusk",    type: "balance",  tier: "B", weight: 32,   atk: 55, def: 65, sta: 65, wgt: 68, bst: 65 },
  { name: "WizardArrow",    type: "attack",   tier: "B", weight: 31.9, atk: 75, def: 38, sta: 42, wgt: 65, bst: 48 },
  { name: "CrocCrunch",     type: "attack",   tier: "B", weight: 34,   atk: 80, def: 42, sta: 42, wgt: 78, bst: 50 },
  { name: "OrochiCluster",  type: "attack",   tier: "B", weight: 36.6, atk: 82, def: 45, sta: 40, wgt: 85, bst: 48 },
  { name: "DranStrike",     type: "attack",   tier: "B", weight: 32,   atk: 72, def: 42, sta: 45, wgt: 68, bst: 52 },
  { name: "HellsHammer",    type: "attack",   tier: "B", weight: 33.2, atk: 78, def: 45, sta: 42, wgt: 72, bst: 50 },
  { name: "VikingHack",     type: "attack",   tier: "B", weight: 32.7, atk: 76, def: 42, sta: 42, wgt: 70, bst: 50 },
  { name: "StunMedusa",     type: "defense",  tier: "B", weight: 33,   atk: 40, def: 80, sta: 72, wgt: 72, bst: 72 },
  { name: "RhinoHorn",      type: "defense",  tier: "B", weight: 32.5, atk: 42, def: 76, sta: 68, wgt: 70, bst: 70 },
  { name: "SphinxCowl",     type: "defense",  tier: "B", weight: 32.5, atk: 38, def: 78, sta: 70, wgt: 70, bst: 72 },
  { name: "BulletGryffon",  type: "attack",   tier: "B", weight: 34.4, atk: 80, def: 42, sta: 45, wgt: 78, bst: 50 },
  { name: "PerseussDark",   type: "defense",  tier: "B", weight: 32.1, atk: 40, def: 76, sta: 68, wgt: 68, bst: 70 },
  { name: "FoxBrush",       type: "balance",  tier: "B", weight: 31.8, atk: 58, def: 62, sta: 68, wgt: 65, bst: 62 },
  { name: "RampartAegis",   type: "defense",  tier: "B", weight: 34.8, atk: 38, def: 82, sta: 72, wgt: 78, bst: 78 },
  { name: "SolEclipse",     type: "attack",   tier: "B", weight: 32.3, atk: 74, def: 42, sta: 48, wgt: 68, bst: 52 },
  { name: "WolfHunt",       type: "attack",   tier: "B", weight: 31.3, atk: 72, def: 40, sta: 45, wgt: 64, bst: 50 },
  { name: "LeonFang",       type: "attack",   tier: "B", weight: 30.4, atk: 70, def: 38, sta: 42, wgt: 60, bst: 48 },
  { name: "PhoenixFlare",   type: "attack",   tier: "B", weight: 31.3, atk: 72, def: 40, sta: 45, wgt: 64, bst: 50 },

  // C Tier
  { name: "CrimsonGaruda",  type: "balance",  tier: "C", weight: 32,   atk: 50, def: 58, sta: 62, wgt: 68, bst: 60 },
  { name: "PteraSwing",     type: "attack",   tier: "C", weight: 32,   atk: 68, def: 38, sta: 40, wgt: 68, bst: 48 },
  { name: "ShelterDrake",   type: "defense",  tier: "C", weight: 32,   atk: 35, def: 72, sta: 65, wgt: 68, bst: 68 },
  { name: "HaevensRing",    type: "stamina",  tier: "C", weight: 32,   atk: 30, def: 55, sta: 80, wgt: 68, bst: 60 },
  { name: "SamuraiSteel",   type: "attack",   tier: "C", weight: 31.2, atk: 65, def: 38, sta: 40, wgt: 64, bst: 48 },
  { name: "BearScratch",    type: "attack",   tier: "C", weight: 29.7, atk: 65, def: 35, sta: 38, wgt: 55, bst: 45 },
  { name: "ShinobiKnife",   type: "attack",   tier: "C", weight: 29.7, atk: 68, def: 35, sta: 38, wgt: 55, bst: 42 },
  { name: "BlackShell",     type: "defense",  tier: "C", weight: 32.5, atk: 35, def: 72, sta: 65, wgt: 70, bst: 68 },
  { name: "GoatTackle",     type: "defense",  tier: "C", weight: 31.5, atk: 40, def: 68, sta: 62, wgt: 64, bst: 65 },
  { name: "SharkGill",      type: "attack",   tier: "C", weight: 29.6, atk: 65, def: 35, sta: 40, wgt: 55, bst: 45 },
  { name: "GhostCircle",    type: "balance",  tier: "C", weight: 26.6, atk: 45, def: 50, sta: 65, wgt: 42, bst: 55 },
  { name: "WizardArc",      type: "balance",  tier: "C", weight: 30.8, atk: 52, def: 58, sta: 65, wgt: 62, bst: 60 },
  { name: "HellsReaper",    type: "attack",   tier: "C", weight: 30.5, atk: 68, def: 38, sta: 40, wgt: 60, bst: 45 },
  { name: "CerberusFlame",  type: "attack",   tier: "C", weight: 28.7, atk: 65, def: 35, sta: 38, wgt: 52, bst: 42 },
];

// =============================================================================
// RATCHETS — con variantes por altura
// =============================================================================

const RATCHET_NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "9"] as const;
const STANDARD_HEIGHTS = ["60", "70", "80"] as const;

// Stats base por numero de ratchet
const RATCHET_BASE: Record<string, { tier: "S" | "A" | "B" | "C"; defBase: number; staBase: number; bstBase: number }> = {
  "0": { tier: "C", defBase: 60, staBase: 55, bstBase: 30 },
  "1": { tier: "A", defBase: 55, staBase: 65, bstBase: 65 },
  "2": { tier: "C", defBase: 40, staBase: 35, bstBase: 20 },
  "3": { tier: "B", defBase: 65, staBase: 60, bstBase: 70 },
  "4": { tier: "B", defBase: 55, staBase: 50, bstBase: 45 },
  "5": { tier: "A", defBase: 70, staBase: 65, bstBase: 65 },
  "6": { tier: "B", defBase: 60, staBase: 55, bstBase: 55 },
  "7": { tier: "S", defBase: 78, staBase: 70, bstBase: 72 },
  "9": { tier: "S", defBase: 75, staBase: 80, bstBase: 78 },
};

// Pesos reales de la enciclopedia
const RATCHET_WEIGHTS: Record<string, number> = {
  "0-60": 6.8, "0-70": 6.9, "0-80": 7.6,
  "1-60": 6.0, "1-70": 7.3, "1-80": 6.8,
  "2-60": 6.1, "2-70": 6.3, "2-80": 6.7,
  "3-60": 6.3, "3-70": 6.4, "3-80": 7.0,
  "3-85": 4.9,
  "4-50": 5.9, "4-55": 4.7, "4-60": 6.2, "4-70": 6.4, "4-80": 7.0,
  "5-60": 6.5, "5-70": 6.8, "5-80": 7.3,
  "M-85": 10.7,
  "6-60": 6.1, "6-70": 6.4, "6-80": 6.8,
  "7-55": 5.2, "7-60": 7.1, "7-70": 7.2, "7-80": 7.8,
  "9-60": 6.2, "9-65": 4.5, "9-70": 6.4, "9-80": 7.0,
};

function buildRatchetData(): RatchetStats[] {
  const results: RatchetStats[] = [];

  // Ratchets estandar
  for (const num of RATCHET_NUMBERS) {
    const base = RATCHET_BASE[num];
    for (const height of STANDARD_HEIGHTS) {
      const label = `${num}-${height}`;
      const weight = RATCHET_WEIGHTS[label] ?? 6.5;
      const heightMod = height === "60" ? 0 : height === "70" ? -3 : -6;
      results.push({
        label,
        number: num,
        height,
        tier: base.tier,
        weight,
        defBonus: base.defBase + heightMod,
        staBonus: base.staBase + heightMod,
        wgtBonus: Math.round(weight * 10),
        bstBonus: base.bstBase + (height === "60" ? 5 : height === "70" ? 0 : -5),
      });
    }
  }

  // Variantes especiales
  const specials: { label: string; number: string; height: string; tier: "S" | "A" | "B" | "C"; defB: number; staB: number; bstB: number }[] = [
    { label: "3-85",  number: "3",   height: "85", tier: "C", defB: 50, staB: 40, bstB: 30 },
    { label: "4-55",  number: "4",   height: "55", tier: "C", defB: 52, staB: 48, bstB: 40 },
    { label: "M-85",  number: "M",   height: "85", tier: "B", defB: 72, staB: 55, bstB: 45 },
    { label: "7-55",  number: "7",   height: "55", tier: "B", defB: 72, staB: 65, bstB: 60 },
    { label: "9-65",  number: "9",   height: "65", tier: "A", defB: 72, staB: 75, bstB: 65 },
  ];

  for (const s of specials) {
    const weight = RATCHET_WEIGHTS[s.label] ?? 6.0;
    results.push({
      label: s.label,
      number: s.number,
      height: s.height,
      tier: s.tier,
      weight,
      defBonus: s.defB,
      staBonus: s.staB,
      wgtBonus: Math.round(weight * 10),
      bstBonus: s.bstB,
    });
  }

  return results.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export const RATCHET_DATA: RatchetStats[] = buildRatchetData();

// =============================================================================
// BITS — stats de movimiento basados en categoria y tier
// =============================================================================

export const BIT_DATA: BitStats[] = [
  // Attack
  { name: "Rush",         category: "attack",   tier: "S", weight: 2.0, atkBonus: 30, defBonus: 0,  staBonus: -5,  movBonus: 25 },
  { name: "Low Rush",     category: "attack",   tier: "S", weight: 1.9, atkBonus: 28, defBonus: 2,  staBonus: -3,  movBonus: 25 },
  { name: "Flat",         category: "attack",   tier: "A", weight: 2.2, atkBonus: 25, defBonus: 0,  staBonus: -8,  movBonus: 22 },
  { name: "Low Flat",     category: "attack",   tier: "B", weight: 2.1, atkBonus: 28, defBonus: 0,  staBonus: -10, movBonus: 24 },
  { name: "Under Flat",   category: "attack",   tier: "B", weight: 2.1, atkBonus: 26, defBonus: 2,  staBonus: -8,  movBonus: 22 },
  { name: "Gear Rush",    category: "attack",   tier: "A", weight: 2.1, atkBonus: 28, defBonus: 0,  staBonus: -6,  movBonus: 26 },
  { name: "Gear Flat",    category: "attack",   tier: "A", weight: 2.3, atkBonus: 30, defBonus: -2, staBonus: -10, movBonus: 28 },
  { name: "Vortex",       category: "attack",   tier: "B", weight: 2.1, atkBonus: 28, defBonus: -2, staBonus: -12, movBonus: 26 },
  { name: "Cyclone",      category: "attack",   tier: "A", weight: 2.1, atkBonus: 25, defBonus: 2,  staBonus: -5,  movBonus: 22 },
  { name: "Accel",        category: "attack",   tier: "B", weight: 2.6, atkBonus: 30, defBonus: -5, staBonus: -15, movBonus: 30 },
  { name: "Rubber Accel", category: "attack",   tier: "C", weight: 3.2, atkBonus: 28, defBonus: -5, staBonus: -18, movBonus: 28 },
  { name: "Level",        category: "attack",   tier: "A", weight: 2.7, atkBonus: 22, defBonus: 5,  staBonus: -5,  movBonus: 18 },
  { name: "Quake",        category: "attack",   tier: "C", weight: 2.2, atkBonus: 22, defBonus: -5, staBonus: -12, movBonus: 25 },
  { name: "Turbo",        category: "attack",   tier: "C", weight: 12.7,atkBonus: 20, defBonus: 5,  staBonus: -10, movBonus: 15 },
  { name: "Jolt",         category: "attack",   tier: "A", weight: 2.6, atkBonus: 26, defBonus: 0,  staBonus: -8,  movBonus: 24 },

  // Stamina
  { name: "Orb",          category: "stamina",  tier: "S", weight: 2.0, atkBonus: -10, defBonus: 5,  staBonus: 30, movBonus: -5 },
  { name: "Low Orb",      category: "stamina",  tier: "A", weight: 1.9, atkBonus: -8,  defBonus: 8,  staBonus: 28, movBonus: -5 },
  { name: "Ball",         category: "stamina",  tier: "S", weight: 2.0, atkBonus: -8,  defBonus: 15, staBonus: 25, movBonus: -8 },
  { name: "Free Ball",    category: "stamina",  tier: "A", weight: 1.9, atkBonus: -8,  defBonus: 10, staBonus: 28, movBonus: -6 },
  { name: "Disk Ball",    category: "stamina",  tier: "C", weight: 3.2, atkBonus: -10, defBonus: 15, staBonus: 18, movBonus: -10 },
  { name: "Gear Ball",    category: "stamina",  tier: "C", weight: 2.1, atkBonus: 5,   defBonus: 8,  staBonus: 18, movBonus: 2 },
  { name: "Glide",        category: "stamina",  tier: "B", weight: 2.6, atkBonus: -5,  defBonus: 12, staBonus: 22, movBonus: -5 },
  { name: "Wall Ball",    category: "stamina",  tier: "B", weight: 2.1, atkBonus: -8,  defBonus: 18, staBonus: 20, movBonus: -8 },
  { name: "Wedge",        category: "stamina",  tier: "A", weight: 1.8, atkBonus: -5,  defBonus: 8,  staBonus: 25, movBonus: -2 },
  { name: "Wall Wedge",   category: "stamina",  tier: "B", weight: 2.4, atkBonus: -5,  defBonus: 15, staBonus: 20, movBonus: -5 },

  // Defense
  { name: "Needle",        category: "defense",  tier: "B", weight: 2.0, atkBonus: -5,  defBonus: 22, staBonus: 15, movBonus: -10 },
  { name: "Metal Needle",  category: "defense",  tier: "C", weight: 2.8, atkBonus: -5,  defBonus: 20, staBonus: 18, movBonus: -8 },
  { name: "Dot",           category: "defense",  tier: "B", weight: 2.0, atkBonus: -2,  defBonus: 20, staBonus: 12, movBonus: -8 },
  { name: "High Needle",   category: "defense",  tier: "B", weight: 2.2, atkBonus: -5,  defBonus: 25, staBonus: 15, movBonus: -10 },
  { name: "Under Needle",  category: "defense",  tier: "A", weight: 1.8, atkBonus: -2,  defBonus: 22, staBonus: 18, movBonus: -8 },
  { name: "Gear Needle",   category: "defense",  tier: "C", weight: 2.0, atkBonus: 2,   defBonus: 20, staBonus: 10, movBonus: -5 },
  { name: "Spike",         category: "defense",  tier: "C", weight: 2.0, atkBonus: -8,  defBonus: 18, staBonus: 12, movBonus: -12 },
  { name: "Bound Spike",   category: "defense",  tier: "C", weight: 2.0, atkBonus: 5,   defBonus: 15, staBonus: 8,  movBonus: 5 },

  // Balance
  { name: "Taper",        category: "balance",  tier: "A", weight: 2.2, atkBonus: 10,  defBonus: 8,  staBonus: 15, movBonus: 10 },
  { name: "High Taper",   category: "balance",  tier: "A", weight: 2.3, atkBonus: 12,  defBonus: 6,  staBonus: 12, movBonus: 12 },
  { name: "Unite",        category: "balance",  tier: "S", weight: 2.1, atkBonus: 8,   defBonus: 10, staBonus: 18, movBonus: 8 },
  { name: "Kick",         category: "balance",  tier: "A", weight: 2.2, atkBonus: 15,  defBonus: 5,  staBonus: 10, movBonus: 15 },
  { name: "Trans Kick",   category: "balance",  tier: "B", weight: 2.3, atkBonus: 12,  defBonus: 5,  staBonus: 8,  movBonus: 12 },
  { name: "Point",        category: "balance",  tier: "S", weight: 2.2, atkBonus: 12,  defBonus: 12, staBonus: 15, movBonus: 12 },
  { name: "Gear Point",   category: "balance",  tier: "A", weight: 2.3, atkBonus: 15,  defBonus: 8,  staBonus: 10, movBonus: 15 },
  { name: "Trans Point",  category: "balance",  tier: "B", weight: 2.2, atkBonus: 10,  defBonus: 10, staBonus: 12, movBonus: 10 },
  { name: "Hexa",         category: "balance",  tier: "S", weight: 2.6, atkBonus: -5,  defBonus: 25, staBonus: 20, movBonus: -10 },
  { name: "Elevate",      category: "balance",  tier: "S", weight: 3.3, atkBonus: 5,   defBonus: 15, staBonus: 22, movBonus: 5 },
  { name: "Zap",          category: "balance",  tier: "B", weight: 2.6, atkBonus: 18,  defBonus: 2,  staBonus: 5,  movBonus: 18 },
  { name: "Merge",        category: "balance",  tier: "C", weight: 3.4, atkBonus: 8,   defBonus: 10, staBonus: 8,  movBonus: 5 },
  { name: "Operate",      category: "balance",  tier: "C", weight: 14,  atkBonus: 5,   defBonus: 8,  staBonus: 5,  movBonus: 0 },
];

// =============================================================================
// FUNCIONES DE CALCULO
// =============================================================================

export interface ComboStats {
  atk: number;
  def: number;
  sta: number;
  wgt: number;
  bst: number;
  totalWeight: number;
  tier: "S" | "A" | "B" | "C";
  winRate: number;
  suggestion: string;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

const TIER_SCORES: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };

export function calculateComboStats(
  blade: BladeStats,
  ratchet: RatchetStats,
  bit: BitStats
): ComboStats {
  // Stats base del blade + modificadores
  const rawAtk = blade.atk + bit.atkBonus;
  const rawDef = blade.def + bit.defBonus + ratchet.defBonus * 0.3;
  const rawSta = blade.sta + bit.staBonus + ratchet.staBonus * 0.3;
  const rawWgt = blade.wgt + ratchet.wgtBonus * 0.15;
  const rawBst = blade.bst + ratchet.bstBonus * 0.3;

  const atk = clamp(Math.round(rawAtk));
  const def = clamp(Math.round(rawDef));
  const sta = clamp(Math.round(rawSta));
  const wgt = clamp(Math.round(rawWgt));
  const bst = clamp(Math.round(rawBst));

  const totalWeight = blade.weight + ratchet.weight + bit.weight;

  // Tier basado en promedio ponderado de los tiers de cada pieza
  const avgTier = (TIER_SCORES[blade.tier] * 3 + TIER_SCORES[ratchet.tier] * 2 + TIER_SCORES[bit.tier] * 2) / 7;
  const tier: "S" | "A" | "B" | "C" = avgTier >= 3.5 ? "S" : avgTier >= 2.7 ? "A" : avgTier >= 1.8 ? "B" : "C";

  // Win rate estimado basado en el tier
  const baseWin = tier === "S" ? 68 : tier === "A" ? 55 : tier === "B" ? 42 : 30;
  // Sinergia: blade type + bit category match
  let synergy = 0;
  if (blade.type === "attack" && bit.category === "attack") synergy = 5;
  if (blade.type === "defense" && (bit.category === "stamina" || bit.category === "defense")) synergy = 5;
  if (blade.type === "stamina" && bit.category === "stamina") synergy = 5;
  if (blade.type === "balance" && bit.category === "balance") synergy = 4;
  // Ratchet 9 y 7 son los mejores
  if (ratchet.number === "9" || ratchet.number === "7") synergy += 3;

  const winRate = Math.min(85, baseWin + synergy + Math.floor(Math.random() * 5));

  // Sugerencia inteligente
  const suggestion = generateSuggestion(blade, ratchet, bit, { atk, def, sta, wgt, bst });

  return { atk, def, sta, wgt, bst, totalWeight, tier, winRate, suggestion };
}

function generateSuggestion(
  blade: BladeStats,
  ratchet: RatchetStats,
  bit: BitStats,
  stats: { atk: number; def: number; sta: number; wgt: number; bst: number }
): string {
  // Ataque bajo con blade de ataque
  if (blade.type === "attack" && bit.category === "stamina") {
    return "Tu blade es de ataque pero tu bit es de stamina. Proba con Rush o Flat para maximizar el ataque.";
  }
  if (blade.type === "attack" && stats.atk < 70) {
    return "Para mejorar el ataque, proba cambiar el bit a Rush o Gear Flat para mas agresividad.";
  }
  if (blade.type === "defense" && bit.category === "attack") {
    return "Tu blade es defensivo pero tu bit es de ataque. Proba Ball o Hexa para aprovechar su defensa.";
  }
  if (stats.sta < 40) {
    return "Tu combo tiene poca stamina. Considerá usar Ball o Unite para mejorar la resistencia.";
  }
  if (stats.bst < 50 && ratchet.number === "2") {
    return "El ratchet 2 tiene mucho riesgo de burst. Proba con 9 o 7 para mas seguridad.";
  }
  if (ratchet.number === "0") {
    return "El ratchet 0 es muy riesgoso por sus salientes. El 9 te da mas estabilidad sin perder peso.";
  }
  if (stats.def > 80 && stats.atk < 50) {
    return "Combo muy defensivo. Si enfrentas atacantes agresivos, vas a resistir bien. Plantate en el centro.";
  }
  if (stats.atk > 80 && stats.sta < 45) {
    return "Combo muy agresivo con poca stamina. Necesitas ganar rapido por KO o Xtreme Finish.";
  }
  if (bit.name === "Elevate" && blade.type !== "defense") {
    return "Elevate rinde mejor con blades defensivos left-spin como CobaltDragoon para ecualizar.";
  }
  // Default
  const avgStat = (stats.atk + stats.def + stats.sta + stats.wgt + stats.bst) / 5;
  if (avgStat > 70) return "Combo equilibrado y competitivo. Buena eleccion para torneo.";
  if (avgStat > 55) return "Combo decente. Optimiza el ratchet (proba 9-60 o 7-60) para subir de nivel.";
  return "Combo basico. Revisa las piezas de tier S y A en la Xciclopedia para mejorar.";
}
