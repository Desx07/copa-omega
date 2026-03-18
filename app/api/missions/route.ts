import { createClient } from "@/lib/supabase/server";
import { getMissionsForWeek, getCurrentWeekStart } from "@/lib/missions";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const weekStart = getCurrentWeekStart();
    const missions = getMissionsForWeek(weekStart);

    // Get player's completed missions this week
    const { data: completed } = await supabase
      .from("player_missions")
      .select("mission_id")
      .eq("player_id", user.id)
      .eq("week_start", weekStart);

    const completedIds = new Set((completed ?? []).map(c => c.mission_id));

    return Response.json({
      week_start: weekStart,
      missions: missions.map(m => ({
        ...m,
        completed: completedIds.has(m.id),
      })),
    });
  } catch (err) {
    console.error("GET /api/missions error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Complete a mission
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const { mission_id } = body;

    if (!mission_id || typeof mission_id !== "string") {
      return Response.json({ error: "Falta mission_id" }, { status: 400 });
    }

    const weekStart = getCurrentWeekStart();
    const validMissions = getMissionsForWeek(weekStart);
    if (!validMissions.some(m => m.id === mission_id)) {
      return Response.json({ error: "Misión no válida" }, { status: 400 });
    }

    const { error } = await supabase
      .from("player_missions")
      .upsert({
        player_id: user.id,
        week_start: weekStart,
        mission_id,
        completed_at: new Date().toISOString(),
      }, { onConflict: "player_id,week_start,mission_id" });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/missions error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
