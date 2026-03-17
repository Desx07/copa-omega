export const XP_VALUES = {
  win_match: 20,
  lose_match: 5,
  win_tournament_match: 20,
  lose_tournament_match: 5,
  tournament_1st: 50,
  tournament_2nd: 30,
  tournament_3rd: 20,
  tournament_participate: 15,
  share_combo: 3,
  make_prediction: 2,
  vote_poll: 2,
  login_tournament_day: 5,
} as const;

export interface Level {
  name: string;
  minXp: number;
  color: string;
  bg: string;
}

export const LEVELS: Level[] = [
  { name: "Principiante", minXp: 0, color: "text-omega-muted", bg: "bg-omega-muted/20" },
  { name: "Blader", minXp: 50, color: "text-omega-blue", bg: "bg-omega-blue/20" },
  { name: "Guerrero", minXp: 150, color: "text-omega-green", bg: "bg-omega-green/20" },
  { name: "Elite", minXp: 350, color: "text-omega-purple", bg: "bg-omega-purple/20" },
  { name: "Maestro", minXp: 700, color: "text-omega-red", bg: "bg-omega-red/20" },
  { name: "Leyenda", minXp: 1200, color: "text-omega-gold", bg: "bg-omega-gold/20" },
  { name: "Omega", minXp: 2000, color: "text-omega-gold", bg: "bg-gradient-to-r from-omega-gold/30 to-omega-purple/30" },
];

export function getLevel(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number): Level | null {
  const current = getLevel(xp);
  const idx = LEVELS.indexOf(current);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelProgress(xp: number): number {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.round((progress / range) * 100);
}
