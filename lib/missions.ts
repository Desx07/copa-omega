export interface MissionDef {
  id: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  check: string; // what to check: "combo", "prediction", "poll", "ranking", "comment", "challenge"
}

export const ALL_MISSIONS: MissionDef[] = [
  { id: "combo", label: "Compartí un combo", description: "Publicá tu combinación de bey", icon: "Swords", check: "combo" },
  { id: "prediction", label: "Hacé una predicción", description: "Predecí quién gana", icon: "Target", check: "prediction" },
  { id: "poll", label: "Votá en una encuesta", description: "Dá tu opinión", icon: "BarChart3", check: "poll" },
  { id: "ranking", label: "Mirá el ranking", description: "Chequeá las posiciones", icon: "Trophy", check: "ranking" },
  { id: "comment", label: "Comentá una batalla", description: "Dejá tu opinión en el feed", icon: "MessageSquare", check: "comment" },
  { id: "challenge", label: "Retá a un blader", description: "Enviá un desafío", icon: "Zap", check: "challenge" },
];

// Get 4 missions for a given week (deterministic based on week)
export function getMissionsForWeek(weekStart: string): MissionDef[] {
  const seed = new Date(weekStart).getTime();
  const shuffled = [...ALL_MISSIONS].sort((a, b) => {
    const hashA = (seed * 31 + a.id.charCodeAt(0)) % 1000;
    const hashB = (seed * 31 + b.id.charCodeAt(0)) % 1000;
    return hashA - hashB;
  });
  return shuffled.slice(0, 4);
}

// Get Monday of current week
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}
