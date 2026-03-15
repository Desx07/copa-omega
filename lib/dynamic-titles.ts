/**
 * Dynamic titles based on the last 10 match results.
 * Recalculate after each match to give players a current "form" indicator.
 */

export interface DynamicTitle {
  label: string;
  color: string;
  bg: string;
}

const TITLES: { minWins: number; title: DynamicTitle }[] = [
  {
    minWins: 8,
    title: {
      label: "En llamas",
      color: "text-omega-gold",
      bg: "bg-omega-gold/15 border-omega-gold/40",
    },
  },
  {
    minWins: 6,
    title: {
      label: "Ascendiendo",
      color: "text-omega-green",
      bg: "bg-omega-green/15 border-omega-green/40",
    },
  },
  {
    minWins: 4,
    title: {
      label: "Estable",
      color: "text-omega-blue",
      bg: "bg-omega-blue/15 border-omega-blue/40",
    },
  },
  {
    minWins: 2,
    title: {
      label: "En peligro",
      color: "text-orange-400",
      bg: "bg-orange-400/15 border-orange-400/40",
    },
  },
  {
    minWins: 0,
    title: {
      label: "Recuperándose",
      color: "text-omega-red",
      bg: "bg-omega-red/15 border-omega-red/40",
    },
  },
];

const DEFAULT_TITLE: DynamicTitle = {
  label: "Blader",
  color: "text-omega-muted",
  bg: "bg-omega-muted/15 border-omega-muted/40",
};

/**
 * Takes an array of match results (last 10) where each element indicates
 * whether the player won that match (true = win, false = loss).
 * Returns the appropriate dynamic title.
 */
export function getDynamicTitle(last10Results: boolean[]): DynamicTitle {
  if (last10Results.length === 0) {
    return DEFAULT_TITLE;
  }

  const wins = last10Results.filter(Boolean).length;

  for (const entry of TITLES) {
    if (wins >= entry.minWins) {
      return entry.title;
    }
  }

  return DEFAULT_TITLE;
}

/**
 * Computes wins from the last N matches (typically 10) given an array of
 * match objects with winner_id.
 */
export function computeTitleFromMatches(
  matches: { winner_id: string | null }[],
  playerId: string,
  limit = 10
): DynamicTitle {
  const last = matches.slice(0, limit);
  const results = last.map((m) => m.winner_id === playerId);
  return getDynamicTitle(results);
}
