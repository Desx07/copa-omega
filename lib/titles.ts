// Auto-generated titles based on player stats
export function getTitle(wins: number, losses: number, streak: number): { label: string; color: string } {
  if (wins > 0 && losses === 0) return { label: "Invicto", color: "text-omega-gold" };
  if (streak >= 5) return { label: "Imparable", color: "text-omega-gold" };
  if (streak >= 3) return { label: "En racha", color: "text-omega-green" };
  if (wins >= 10) return { label: "Leyenda", color: "text-omega-purple" };
  if (wins >= 6) return { label: "Veterano", color: "text-omega-blue" };
  if (wins >= 3) return { label: "Guerrero", color: "text-omega-blue" };
  if (wins >= 1) return { label: "Competidor", color: "text-omega-muted" };
  return { label: "Novato", color: "text-omega-muted" };
}

export const BADGE_EMOJIS: Record<string, string> = {
  fire: "\u{1F525}",
  lightning: "\u26A1",
  skull: "\u{1F480}",
  crown: "\u{1F451}",
  sword: "\u2694\uFE0F",
  star: "\u2B50",
  dragon: "\u{1F409}",
  wolf: "\u{1F43A}",
  ice: "\u2744\uFE0F",
  boom: "\u{1F4A5}",
};

export const ACCENT_COLORS: Record<string, { label: string; border: string; bg: string }> = {
  red: { label: "Rojo", border: "border-omega-red", bg: "bg-omega-red" },
  blue: { label: "Azul", border: "border-omega-blue", bg: "bg-omega-blue" },
  green: { label: "Verde", border: "border-omega-green", bg: "bg-omega-green" },
  purple: { label: "Violeta", border: "border-omega-purple", bg: "bg-omega-purple" },
  gold: { label: "Dorado", border: "border-omega-gold", bg: "bg-omega-gold" },
  white: { label: "Blanco", border: "border-omega-text", bg: "bg-omega-text" },
};
