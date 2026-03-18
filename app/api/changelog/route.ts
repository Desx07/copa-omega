import { createClient } from "@/lib/supabase/server";
import { getLatestVersion } from "@/lib/changelog";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { data: seen } = await supabase
      .from("changelog_seen")
      .select("version")
      .eq("player_id", user.id);

    return Response.json({
      latest_version: getLatestVersion(),
      seen_versions: (seen ?? []).map((s) => s.version),
    });
  } catch (err) {
    console.error("GET /api/changelog error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { version } = body;

    if (!version || typeof version !== "string") {
      return Response.json({ error: "Falta version" }, { status: 400 });
    }

    const { error } = await supabase
      .from("changelog_seen")
      .upsert(
        { player_id: user.id, version, seen_at: new Date().toISOString() },
        { onConflict: "player_id,version" }
      );

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/changelog error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
