import type { createClient } from "@/lib/supabase/server";

// ── Modalidad de torneo activa ──
// Un admin elige la modalidad y toda la app + la landing se reconfiguran.
// Solo una modalidad activa a la vez. Se persiste en app_settings (key 'tournament_mode').
export type TournamentMode = "copa_omega" | "ascenso" | "liga";

export const TOURNAMENT_MODES = ["copa_omega", "ascenso", "liga"] as const;

export const DEFAULT_TOURNAMENT_MODE: TournamentMode = "copa_omega";

// Cliente Supabase del servidor, tipado sin `any`.
type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

// Type guard: valida que un string sea una modalidad conocida.
export function isTournamentMode(value: string): value is TournamentMode {
  return (TOURNAMENT_MODES as readonly string[]).includes(value);
}

// Lee la modalidad activa desde app_settings.
// Nunca lanza: si falta la fila o el valor es inválido, devuelve el default (copa_omega).
export async function getTournamentMode(
  supabase: ServerSupabase
): Promise<TournamentMode> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "tournament_mode")
    .maybeSingle();

  const value = data?.value;
  if (typeof value === "string" && isTournamentMode(value)) {
    return value;
  }
  return DEFAULT_TOURNAMENT_MODE;
}
