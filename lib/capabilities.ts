// ============================================================================
// Capabilities — motor central de "qué se puede hacer" según las modalidades.
//
// PROBLEMA que resuelve: hasta ahora cada componente/endpoint preguntaba por el
// flag crudo (`if (mode_copa_omega_enabled) ...`) y se olvidaban checks sueltos
// → con una modalidad apagada seguían viéndose estrellas, creándose partidas
// por estrellas, etc. Acá se derivan las capacidades UNA sola vez desde los
// flags, y toda la app (UI y backend) consume ESTO, no el flag crudo.
//
// Regla: apagar una modalidad apaga TODO su ecosistema desde un solo lugar.
// ============================================================================
import { getModeConfig, type ModeConfig } from "@/lib/tournament-mode";
import type { createClient } from "@/lib/supabase/server";

export interface Capabilities {
  // Flags base (por si algo los necesita directo)
  copaEnabled: boolean;
  ascensoEnabled: boolean;
  ligaEnabled: boolean;
  teamsEnabled: boolean;
  walletEnabled: boolean;
  /** La tienda se muestra en el dashboard (estado != "hidden"). */
  storeVisible: boolean;

  // Copa Omega / estrellas
  /** Crear/resolver partidas y retos que apuestan estrellas. */
  canPlayStars: boolean;
  /** Mostrar estrellas en la UI (badges, hero, cards, ranking por estrellas). */
  canViewStars: boolean;

  // Ascenso
  /** Crear/resolver partidas de ascenso. */
  canPlayAscenso: boolean;
  /** Mostrar el ecosistema de ascenso (rangos, tickets, /ascenso). */
  canViewAscenso: boolean;

  // Derivados
  /** Modos de partida individual disponibles ahora mismo. */
  availableMatchModes: Array<"copa_omega" | "ascenso">;
  /** Tab que debe quedar seleccionada por defecto en /ranking (evita tab vacía). */
  defaultRankingTab: "estrellas" | "ascenso" | "equipos";
  /** Modalidad destacada de la landing (heredada de getModeConfig). */
  featured: ModeConfig["featured"];
}

export interface RawFlags {
  copaEnabled: boolean;
  ascensoEnabled: boolean;
  ligaEnabled: boolean;
  teamsEnabled: boolean;
  walletEnabled: boolean;
  storeVisible: boolean;
  featured: ModeConfig["featured"];
}

/**
 * Función PURA: flags → capacidades. Testeable al 100% con una matriz de flags.
 * Toda la lógica de "qué apaga qué" vive acá y solo acá.
 */
export function deriveCapabilities(f: RawFlags): Capabilities {
  const availableMatchModes: Array<"copa_omega" | "ascenso"> = [];
  if (f.copaEnabled) availableMatchModes.push("copa_omega");
  if (f.ascensoEnabled) availableMatchModes.push("ascenso");

  // Default de ranking: la primera modalidad activa (nunca una tab de algo apagado).
  const defaultRankingTab: Capabilities["defaultRankingTab"] = f.copaEnabled
    ? "estrellas"
    : f.ascensoEnabled
    ? "ascenso"
    : f.ligaEnabled
    ? "equipos"
    : "estrellas"; // fallback inocuo si TODO está apagado

  return {
    copaEnabled: f.copaEnabled,
    ascensoEnabled: f.ascensoEnabled,
    ligaEnabled: f.ligaEnabled,
    teamsEnabled: f.teamsEnabled,
    walletEnabled: f.walletEnabled,
    storeVisible: f.storeVisible,

    canPlayStars: f.copaEnabled,
    canViewStars: f.copaEnabled,
    canPlayAscenso: f.ascensoEnabled,
    canViewAscenso: f.ascensoEnabled,

    availableMatchModes,
    defaultRankingTab,
    featured: f.featured,
  };
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Lee los flags desde app_settings y devuelve las capacidades resueltas.
 * Usar en Server Components y en API routes. Nunca lanza (usa defaults seguros).
 * Wallet: habilitada salvo que el flag sea explícitamente "false".
 */
export async function getCapabilities(supabase: ServerSupabase): Promise<Capabilities> {
  const modeConfig = await getModeConfig(supabase);
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["teams_enabled", "wallet_enabled", "store_enabled"]);
  const map = new Map<string, string>((data ?? []).map((r) => [r.key, r.value]));

  return deriveCapabilities({
    copaEnabled: modeConfig.active.copa_omega,
    ascensoEnabled: modeConfig.active.ascenso,
    ligaEnabled: modeConfig.active.liga,
    teamsEnabled: map.get("teams_enabled") === "true",
    walletEnabled: map.get("wallet_enabled") !== "false",
    // store_enabled guarda "open" | "closed" | "hidden" (default "open").
    // La tienda se oculta del dashboard solo con "hidden".
    storeVisible: (map.get("store_enabled") ?? "open") !== "hidden",
    featured: modeConfig.featured,
  });
}

/**
 * Helper para API routes: si la capacidad está apagada, devuelve una Response 403
 * lista para retornar; si está habilitada, devuelve null (seguí el flujo normal).
 *
 *   const caps = await getCapabilities(supabase);
 *   const gate = capabilityGate(caps.canPlayStars, "La Copa Omega está desactivada");
 *   if (gate) return gate;
 */
export function capabilityGate(enabled: boolean, message: string): Response | null {
  if (enabled) return null;
  return Response.json({ error: message }, { status: 403 });
}
