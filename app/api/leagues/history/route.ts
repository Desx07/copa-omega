import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Parametro opcional: player_id (por defecto el usuario actual)
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("player_id") ?? user.id;

    const { data: history, error } = await supabase
      .from("league_history")
      .select(
        "id, reason, changed_at, from_league:leagues!from_league(id, name, tier, color), to_league:leagues!to_league(id, name, tier, color), season:seasons!season_id(id, name, number)"
      )
      .eq("player_id", playerId)
      .order("changed_at", { ascending: false })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ history: history ?? [] });
  } catch (err) {
    console.error("GET /api/leagues/history error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
