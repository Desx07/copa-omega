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

    // Parametro opcional: league_id para filtrar una liga especifica
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get("league_id");

    // Obtener season activa
    const { data: activeSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .maybeSingle();

    const seasonId = activeSeason?.id ?? null;

    if (!seasonId) {
      return Response.json({ error: "No hay temporada activa" }, { status: 404 });
    }

    // Construir query de memberships con datos de jugador y liga
    let query = supabase
      .from("league_memberships")
      .select(
        "id, position, games_played, wins, losses, promotion_points, joined_at, player:players!player_id(id, alias, avatar_url, stars, wins, losses), league:leagues!league_id(id, name, tier, color, icon)"
      )
      .eq("season_id", seasonId)
      .order("position", { ascending: true });

    if (leagueId) {
      query = query.eq("league_id", leagueId);
    }

    const { data: standings, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Agrupar por liga si no se filtro
    if (!leagueId) {
      const grouped: Record<string, {
        league: { id: string; name: string; tier: number; color: string; icon: string };
        players: typeof standings;
      }> = {};

      for (const s of standings ?? []) {
        const league = s.league as unknown as { id: string; name: string; tier: number; color: string; icon: string };
        if (!league) continue;
        if (!grouped[league.id]) {
          grouped[league.id] = { league, players: [] };
        }
        grouped[league.id].players.push(s);
      }

      // Ordenar por tier descendente (Omega primero)
      const sorted = Object.values(grouped).sort(
        (a, b) => b.league.tier - a.league.tier
      );

      return Response.json({ standings: sorted, season_id: seasonId });
    }

    return Response.json({ standings: standings ?? [], season_id: seasonId });
  } catch (err) {
    console.error("GET /api/leagues/standings error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
