// Badge definitions and checker function

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_win", name: "Primera Victoria", description: "Ganá tu primera batalla", icon: "\u{1F31F}" },
  { id: "streak_3", name: "Racha de 3", description: "Ganá 3 batallas seguidas", icon: "\u{1F525}" },
  { id: "streak_5", name: "Imparable", description: "Racha de 5 victorias seguidas", icon: "\u26A1" },
  { id: "champion", name: "Campeón", description: "Ganá un torneo", icon: "\u{1F3C6}" },
  { id: "executioner", name: "Verdugo", description: "Ganá 4 o más batallas en un mismo torneo", icon: "\u{1F480}" },
  { id: "sniper", name: "Francotirador", description: "Win rate mayor a 80% con mínimo 10 batallas", icon: "\u{1F3AF}" },
  { id: "legend", name: "Leyenda", description: "Ganá 3 torneos en total", icon: "\u{1F451}" },
  { id: "veteran", name: "Veterano", description: "Participá en 5 torneos", icon: "\u{1F91D}" },
  // Login streak badges
  { id: "streak_login_3", name: "Constante", description: "3 dias seguidos entrando a la app", icon: "\u{1F4C5}" },
  { id: "streak_login_7", name: "Dedicado", description: "7 dias seguidos entrando a la app", icon: "\u{1F5D3}\uFE0F" },
  { id: "streak_login_30", name: "Leyenda Diaria", description: "30 dias seguidos sin faltar", icon: "\u{1F48E}" },
  // Social & activity badges
  { id: "phoenix", name: "F\u{E9}nix", description: "Gan\u{E1} una batalla despu\u{E9}s de perder 3 seguidas", icon: "\u{1F525}" },
  { id: "gladiator", name: "Gladiador", description: "Pele\u{E1} 25 batallas en total", icon: "\u2694\uFE0F" },
  { id: "executioner_supreme", name: "Verdugo Supremo", description: "Gan\u{E1} 6+ batallas en un mismo torneo", icon: "\u{1F480}" },
  { id: "oracle", name: "Or\u{E1}culo", description: "Acert\u{E1} 10 predicciones seguidas", icon: "\u{1F52E}" },
  { id: "social_king", name: "Alma de la Fiesta", description: "Mand\u{E1} 100 mensajes en el chat", icon: "\u{1F4E2}" },
  { id: "challenger_badge", name: "Retador Serial", description: "Envi\u{E1} 10 retos a otros bladers", icon: "\u26A1" },
  { id: "giant_slayer", name: "David", description: "Gan\u{E1} contra alguien con el doble de estrellas", icon: "\u{1FAA8}" },
  { id: "collector", name: "Coleccionista", description: "Registr\u{E1} 5 beys en tu perfil", icon: "\u{1F4E6}" },
  { id: "voter", name: "Democr\u{E1}tico", description: "Vot\u{E1} en 10 encuestas", icon: "\u{1F5F3}\uFE0F" },
  { id: "combo_master", name: "Mente Maestra", description: "Tu combo recibe 15+ upvotes", icon: "\u{1F9E0}" },
  { id: "centurion", name: "Centuri\u{F3}n", description: "Alcanz\u{E1} 100 estrellas", icon: "\u2600\uFE0F" },
  { id: "streak_10", name: "Leyenda Viviente", description: "Racha de 10 victorias seguidas", icon: "\u{1F451}" },
];

export interface PlayerStats {
  wins: number;
  losses: number;
  current_streak: number;
  tournaments_won: number;
  tournaments_played: number;
  tournament_eliminations: number; // max eliminations in a single tournament
  login_streak?: number; // current daily login streak
  // New fields for new badges
  total_matches?: number;
  max_stars_ever?: number;
  had_losing_streak_3_then_won?: boolean;
  consecutive_correct_predictions?: number;
  chat_messages_count?: number;
  challenges_sent?: number;
  beat_double_stars_opponent?: boolean;
  beys_count?: number;
  poll_votes_count?: number;
  max_combo_upvotes?: number;
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

  // executioner: 4+ wins in a single tournament
  if (stats.tournament_eliminations >= 4) {
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

  // Login streak badges
  const loginStreak = stats.login_streak ?? 0;
  if (loginStreak >= 3) {
    unlocked.push("streak_login_3");
  }
  if (loginStreak >= 7) {
    unlocked.push("streak_login_7");
  }
  if (loginStreak >= 30) {
    unlocked.push("streak_login_30");
  }

  // ── New badges ──

  // phoenix: won after losing 3 in a row
  if (stats.had_losing_streak_3_then_won) {
    unlocked.push("phoenix");
  }

  // gladiator: 25+ total matches
  if ((stats.total_matches ?? (stats.wins + stats.losses)) >= 25) {
    unlocked.push("gladiator");
  }

  // executioner_supreme: 6+ wins in a single tournament
  if (stats.tournament_eliminations >= 6) {
    unlocked.push("executioner_supreme");
  }

  // oracle: 10+ consecutive correct predictions
  if ((stats.consecutive_correct_predictions ?? 0) >= 10) {
    unlocked.push("oracle");
  }

  // social_king: 100+ chat messages
  if ((stats.chat_messages_count ?? 0) >= 100) {
    unlocked.push("social_king");
  }

  // challenger_badge: 10+ challenges sent
  if ((stats.challenges_sent ?? 0) >= 10) {
    unlocked.push("challenger_badge");
  }

  // giant_slayer: beat someone with 2x your stars
  if (stats.beat_double_stars_opponent) {
    unlocked.push("giant_slayer");
  }

  // collector: 5+ beys registered
  if ((stats.beys_count ?? 0) >= 5) {
    unlocked.push("collector");
  }

  // voter: 10+ poll votes
  if ((stats.poll_votes_count ?? 0) >= 10) {
    unlocked.push("voter");
  }

  // combo_master: combo with 15+ upvotes
  if ((stats.max_combo_upvotes ?? 0) >= 15) {
    unlocked.push("combo_master");
  }

  // centurion: reached 100 stars
  if ((stats.max_stars_ever ?? 0) >= 100) {
    unlocked.push("centurion");
  }

  // streak_10: 10+ win streak
  if (stats.current_streak >= 10) {
    unlocked.push("streak_10");
  }

  return unlocked;
}
