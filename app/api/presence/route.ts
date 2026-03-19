import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/presence — heartbeat: update current user's online_at
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    // Use admin client to bypass RLS restrictions on players table
    const admin = createAdminClient();
    await admin
      .from("players")
      .update({ online_at: new Date().toISOString() })
      .eq("id", user.id);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("POST /api/presence error:", err);
    return Response.json({ error: "Error" }, { status: 500 });
  }
}

/**
 * GET /api/presence — get count + list of users online in last 90 seconds
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const threshold = new Date(Date.now() - 90_000).toISOString();

    const { data: onlineUsers } = await supabase
      .from("players")
      .select("id, alias, avatar_url")
      .gte("online_at", threshold)
      .order("alias");

    return Response.json({ online: onlineUsers?.length ?? 0, users: onlineUsers ?? [] });
  } catch (err) {
    console.error("GET /api/presence error:", err);
    return Response.json({ error: "Error" }, { status: 500 });
  }
}
