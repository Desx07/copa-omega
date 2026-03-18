import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/presence — heartbeat: update current user's online_at
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    await supabase
      .from("players")
      .update({ online_at: new Date().toISOString() })
      .eq("id", user.id);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Error" }, { status: 500 });
  }
}

/**
 * GET /api/presence — get count of users online in last 2 minutes
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .gte("online_at", twoMinAgo);

    return Response.json({ online: count ?? 0 });
  } catch {
    return Response.json({ error: "Error" }, { status: 500 });
  }
}
