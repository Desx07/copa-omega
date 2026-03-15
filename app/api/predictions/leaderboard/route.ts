import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/predictions/leaderboard
 * Returns the top predictors ranked by correct predictions.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get players with prediction stats, sorted by correct predictions
    const { data: players, error } = await supabase
      .from("players")
      .select("id, alias, avatar_url, predictions_correct, predictions_total")
      .gt("predictions_total", 0)
      .order("predictions_correct", { ascending: false })
      .order("predictions_total", { ascending: true })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const leaderboard = (players ?? []).map((p, i) => ({
      rank: i + 1,
      player_id: p.id,
      alias: p.alias,
      avatar_url: p.avatar_url,
      correct: p.predictions_correct,
      total: p.predictions_total,
      accuracy: p.predictions_total > 0
        ? Math.round((p.predictions_correct / p.predictions_total) * 100)
        : 0,
    }));

    return Response.json(leaderboard);
  } catch (err) {
    console.error("GET /api/predictions/leaderboard error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
