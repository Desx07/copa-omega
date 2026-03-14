import { createClient } from "@/lib/supabase/server";

// GET — check if store is enabled
export async function GET() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "store_enabled")
    .single();

  return Response.json({ enabled: data?.value === "true" });
}

// PATCH — toggle store (admin only)
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

  const body = await request.json();
  const enabled = body.enabled === true;

  const { error } = await supabase
    .from("app_settings")
    .update({ value: enabled ? "true" : "false", updated_at: new Date().toISOString() })
    .eq("key", "store_enabled");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ enabled });
}
