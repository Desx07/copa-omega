import { createClient } from "@/lib/supabase/server";

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
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }
  const validStatuses = ["open", "closed", "hidden"];
  if (!validStatuses.includes(body.status)) {
    return Response.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_settings")
    .update({ value: body.status, updated_at: new Date().toISOString() })
    .eq("key", "store_enabled");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ status: body.status });
}
