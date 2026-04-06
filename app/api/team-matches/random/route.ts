import { createClient } from "@/lib/supabase/server";

// POST — sorteo aleatorio de equipos
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin && !adminPlayer?.is_judge) {
      return Response.json({ error: "Solo administradores o jueces" }, { status: 403 });
    }

    const body = await request.json();
    const { team_ids, stars_bet } = body as {
      team_ids: string[];
      stars_bet: number;
    };

    if (!Array.isArray(team_ids) || team_ids.length < 2) {
      return Response.json({ error: "Se necesitan al menos 2 equipos" }, { status: 400 });
    }

    if (typeof stars_bet !== "number" || stars_bet < 0 || stars_bet > 5) {
      return Response.json({ error: "stars_bet debe ser entre 0 y 5" }, { status: 400 });
    }

    // Verificar equipos
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, logo_url, stars, is_active, team_members(player_id)")
      .in("id", team_ids);

    if (teamsError || !teams || teams.length !== team_ids.length) {
      return Response.json({ error: "Uno o mas equipos no encontrados" }, { status: 404 });
    }

    for (const t of teams) {
      if (!t.is_active) {
        return Response.json({ error: `${t.name} esta inactivo` }, { status: 400 });
      }
    }

    // Fisher-Yates shuffle
    const shuffled = [...team_ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let byeTeamId: string | null = null;
    const toPair = [...shuffled];
    if (toPair.length % 2 !== 0) {
      byeTeamId = toPair.pop()!;
    }

    // Crear partidas
    const matchInserts = [];
    for (let i = 0; i < toPair.length; i += 2) {
      matchInserts.push({
        team1_id: toPair[i],
        team2_id: toPair[i + 1],
        stars_bet,
        created_by: user.id,
      });
    }

    const { data: matches, error: insertError } = await supabase
      .from("team_matches")
      .insert(matchInserts)
      .select(`
        id, stars_bet,
        team1:teams!team1_id (id, name, logo_url, stars),
        team2:teams!team2_id (id, name, logo_url, stars)
      `);

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Crear peleas para cada partida
    for (const match of matches ?? []) {
      const fights = [1, 2, 3].map((pos) => ({
        team_match_id: match.id,
        position: pos,
      }));
      await supabase.from("team_match_fights").insert(fights);
    }

    const byeTeam = byeTeamId
      ? teams.find((t) => t.id === byeTeamId) ?? null
      : null;

    return Response.json(
      { matches: matches ?? [], bye_team: byeTeam ? { id: byeTeam.id, name: byeTeam.name, logo_url: byeTeam.logo_url } : null },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/team-matches/random error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
