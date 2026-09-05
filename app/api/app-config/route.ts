import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTournamentMode, LANDING_FEATURED_KEY } from "@/lib/tournament-mode";

// Keys de configuración de modalidades + flags varios de la app.
const CONFIG_KEYS = [
  "teams_enabled",
  "wallet_enabled",
  "mode_copa_omega_enabled",
  "mode_ascenso_enabled",
  "mode_liga_enabled",
  LANDING_FEATURED_KEY,
];

// GET — obtener feature flags
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", CONFIG_KEYS);

    const config: Record<string, string> = {};
    for (const row of data ?? []) {
      config[row.key] = row.value;
    }

    return Response.json(config);
  } catch (err) {
    console.error("GET /api/app-config error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — actualizar feature flags (admin only)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    if (!CONFIG_KEYS.includes(key)) {
      return Response.json({ error: "Key invalida" }, { status: 400 });
    }

    // La landing destacada solo acepta una modalidad conocida
    if (key === LANDING_FEATURED_KEY && !isTournamentMode(value)) {
      return Response.json({ error: "Modalidad invalida" }, { status: 400 });
    }

    // Upsert en app_settings con el cliente de servicio: la RLS de la tabla
    // solo permite UPDATE (no INSERT), así que las keys que todavía no tienen
    // fila fallarían. El permiso real ya se validó arriba (is_admin).
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("app_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ key, value });
  } catch (err) {
    console.error("PATCH /api/app-config error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
