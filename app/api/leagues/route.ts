import { createClient } from "@/lib/supabase/server";

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

    // Obtener todas las ligas ordenadas por tier
    const { data: leagues, error: leaguesError } = await supabase
      .from("leagues")
      .select("*")
      .order("tier", { ascending: true });

    if (leaguesError) {
      return Response.json({ error: leaguesError.message }, { status: 500 });
    }

    // Obtener season activa
    const { data: activeSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .maybeSingle();

    const seasonId = activeSeason?.id ?? null;

    // Obtener conteo de miembros por liga en la season activa
    const { data: memberships } = await supabase
      .from("league_memberships")
      .select("league_id, player_id")
      .eq("season_id", seasonId ?? "");

    const memberCounts: Record<string, number> = {};
    for (const m of memberships ?? []) {
      memberCounts[m.league_id] = (memberCounts[m.league_id] ?? 0) + 1;
    }

    // Obtener la liga del usuario actual
    const { data: userMembership } = await supabase
      .from("league_memberships")
      .select("league_id, position, wins, losses, games_played, promotion_points")
      .eq("player_id", user.id)
      .eq("season_id", seasonId ?? "")
      .maybeSingle();

    // Construir respuesta con conteos
    const leaguesWithCounts = (leagues ?? []).map((league) => ({
      ...league,
      member_count: memberCounts[league.id] ?? 0,
      is_current: userMembership?.league_id === league.id,
    }));

    return Response.json({
      leagues: leaguesWithCounts,
      user_membership: userMembership,
      season_id: seasonId,
    });
  } catch (err) {
    console.error("GET /api/leagues error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
