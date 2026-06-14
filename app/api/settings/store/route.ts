import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET — check store status: 'open' | 'closed' | 'hidden'
export async function GET() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "store_enabled")
    .single();

  const status = data?.value ?? "open";
  return Response.json({ status });
}

// PATCH — change store status (admin only)
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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

  let body;
  try {
    body = await request.json();
  } catch (err) {
    console.error("Failed to parse store settings body:", err);
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }
  const validStatuses = ["open", "closed", "hidden"];
  if (!validStatuses.includes(body.status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }

  // Upsert con el cliente de servicio: si la key "store_enabled" todavía no
  // tiene fila, un UPDATE afectaría 0 filas sin error y no persistiría nada.
  // Además la RLS de app_settings puede no permitir INSERT al usuario. El
  // permiso real ya se validó arriba (is_admin).
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("app_settings")
    .upsert(
      { key: "store_enabled", value: body.status, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ status: body.status });
}
