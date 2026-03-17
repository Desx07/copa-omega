import { createClient } from "@/lib/supabase/server";
import { getCurrentWeekStart } from "@/lib/missions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { id: challengeId } = await params;

    const { data, error } = await supabase
      .from("challenge_comments")
      .select("id, content, created_at, player_id, player:players!player_id(id, alias, avatar_url)")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data ?? []);
  } catch (err) {
    console.error("GET /api/challenges/[id]/comments error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { id: challengeId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0 || content.length > 200) {
      return Response.json({ error: "Comentario entre 1 y 200 caracteres" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("challenge_comments")
      .insert({ challenge_id: challengeId, player_id: user.id, content: content.trim() })
      .select("id, content, created_at, player_id, player:players!player_id(id, alias, avatar_url)")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Auto-complete mission (fire-and-forget)
    supabase.from("player_missions").upsert({
      player_id: user.id,
      week_start: getCurrentWeekStart(),
      mission_id: "comment",
      completed_at: new Date().toISOString(),
    }, { onConflict: "player_id,week_start,mission_id" }).then(() => {});

    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/challenges/[id]/comments error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
