// Badge definitions and checker function

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_win", name: "Primera Victoria", description: "Ganá tu primera batalla", icon: "\u{1F31F}" },
  { id: "streak_3", name: "En Llamas", description: "Racha de 3 victorias seguidas", icon: "\u{1F525}" },
  { id: "streak_5", name: "Imparable", description: "Racha de 5 victorias seguidas", icon: "\u26A1" },
  { id: "champion", name: "Campeón", description: "Ganá un torneo", icon: "\u{1F3C6}" },
  { id: "executioner", name: "Verdugo", description: "Eliminá a 3 bladers en el mismo torneo", icon: "\u{1F480}" },
  { id: "sniper", name: "Francotirador", description: "Win rate mayor a 80% con mínimo 10 batallas", icon: "\u{1F3AF}" },
  { id: "legend", name: "Leyenda", description: "Ganá 3 torneos en total", icon: "\u{1F451}" },
  { id: "veteran", name: "Veterano", description: "Participá en 5 torneos", icon: "\u{1F91D}" },
];

export interface PlayerStats {
  wins: number;
  losses: number;
  current_streak: number;
  tournaments_won: number;
  tournaments_played: number;
  tournament_eliminations: number; // max eliminations in a single tournament
}

/**
 * Given a player's stats, returns an array of badge IDs that should be unlocked.
 */
export function checkBadges(stats: PlayerStats): string[] {
  const unlocked: string[] = [];

  // first_win: wins >= 1
  if (stats.wins >= 1) {
    unlocked.push("first_win");
  }

  // streak_3: current streak >= 3
  if (stats.current_streak >= 3) {
    unlocked.push("streak_3");
  }

  // streak_5: current streak >= 5
  if (stats.current_streak >= 5) {
    unlocked.push("streak_5");
  }

  // champion: tournaments_won >= 1
  if (stats.tournaments_won >= 1) {
    unlocked.push("champion");
  }

  // executioner: tournament_eliminations >= 3 in same tournament
  if (stats.tournament_eliminations >= 3) {
    unlocked.push("executioner");
  }

  // sniper: win_rate > 80% AND total_matches >= 10
  const totalMatches = stats.wins + stats.losses;
  if (totalMatches >= 10) {
    const winRate = (stats.wins / totalMatches) * 100;
    if (winRate > 80) {
      unlocked.push("sniper");
    }
  }

  // legend: tournaments_won >= 3
  if (stats.tournaments_won >= 3) {
    unlocked.push("legend");
  }

  // veteran: tournaments_played >= 5
  if (stats.tournaments_played >= 5) {
    unlocked.push("veteran");
  }

  return unlocked;
}
