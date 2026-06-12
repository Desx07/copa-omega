import type { createClient } from "@/lib/supabase/server";

// ── Modalidades de torneo ──
// Cada modalidad se activa/desactiva de forma INDEPENDIENTE (pueden convivir
// varias activas a la vez). Adentro de la app, cada modalidad activa muestra
// su propia sección/UI. La landing pública solo puede mostrar UNA: la "destacada".
export type TournamentMode = "copa_omega" | "ascenso" | "liga";

export const TOURNAMENT_MODES = ["copa_omega", "ascenso", "liga"] as const;

export const DEFAULT_TOURNAMENT_MODE: TournamentMode = "copa_omega";

// Keys en app_settings (value text):
//  - mode_copa_omega_enabled | mode_ascenso_enabled | mode_liga_enabled  → 'true' | 'false'
//  - landing_featured  → 'copa_omega' | 'ascenso' | 'liga'
const ENABLED_KEY: Record<TournamentMode, string> = {
  copa_omega: "mode_copa_omega_enabled",
  ascenso: "mode_ascenso_enabled",
  liga: "mode_liga_enabled",
};
export const LANDING_FEATURED_KEY = "landing_featured";

// Config resuelta de modalidades.
export interface ModeConfig {
  /** Qué modalidades están activas (visibles adentro de la app). */
  active: Record<TournamentMode, boolean>;
  /** Modalidad que ocupa la landing pública. Siempre una de las activas. */
  featured: TournamentMode;
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

// Type guard: valida que un string sea una modalidad conocida.
export function isTournamentMode(value: string): value is TournamentMode {
  return (TOURNAMENT_MODES as readonly string[]).includes(value);
}

// Devuelve la key de activación de una modalidad (para el endpoint admin).
export function enabledKeyFor(mode: TournamentMode): string {
  return ENABLED_KEY[mode];
}

// Lee la config de modalidades desde app_settings. Nunca lanza.
// Si no hay ninguna fila, default: solo Copa Omega activa y destacada
// (estado histórico de la app, no rompe nada).
export async function getModeConfig(supabase: ServerSupabase): Promise<ModeConfig> {
  const keys = [...Object.values(ENABLED_KEY), LANDING_FEATURED_KEY];
  const { data } = await supabase.from("app_settings").select("key, value").in("key", keys);

  const map = new Map<string, string>();
  for (const row of data ?? []) map.set(row.key, row.value);

  // Si nunca se configuró nada, Copa Omega queda activa por defecto.
  const sinConfig = (data ?? []).length === 0;

  const active: Record<TournamentMode, boolean> = {
    copa_omega: sinConfig ? true : map.get(ENABLED_KEY.copa_omega) === "true",
    ascenso: map.get(ENABLED_KEY.ascenso) === "true",
    liga: map.get(ENABLED_KEY.liga) === "true",
  };

  // Destacada: la configurada si es válida y está activa; si no, la primera activa; si no hay, copa_omega.
  const rawFeatured = map.get(LANDING_FEATURED_KEY);
  let featured: TournamentMode = DEFAULT_TOURNAMENT_MODE;
  if (rawFeatured && isTournamentMode(rawFeatured) && active[rawFeatured]) {
    featured = rawFeatured;
  } else {
    featured = TOURNAMENT_MODES.find((m) => active[m]) ?? DEFAULT_TOURNAMENT_MODE;
  }

  return { active, featured };
}
