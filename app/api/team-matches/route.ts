import { createClient } from "@/lib/supabase/server";

// GET — listar partidas de equipo
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: matches, error } = await supabase
      .from("team_matches")
      .select(`
        id, status, stars_bet, created_at, completed_at, winner_team_id,
        team1_score, team2_score,
        team1:teams!team1_id (id, name, logo_url, stars),
        team2:teams!team2_id (id, name, logo_url, stars),
        winner:teams!winner_team_id (id, name),
        team_match_fights (
          id, position, player1_id, player2_id, winner_player_id,
          player1_score, player2_score, status,
          player1:players!player1_id (id, alias, avatar_url),
          player2:players!player2_id (id, alias, avatar_url)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(matches ?? []);
  } catch (err) {
    console.error("GET /api/team-matches error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST — crear partida de equipo
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
    const { team1_id, team2_id, stars_bet } = body as {
      team1_id: string;
      team2_id: string;
      stars_bet: number;
    };

    if (!team1_id || !team2_id) {
      return Response.json({ error: "Faltan IDs de equipos" }, { status: 400 });
    }

    if (team1_id === team2_id) {
      return Response.json({ error: "Los equipos deben ser diferentes" }, { status: 400 });
    }

    // Verificar ambos equipos
    const { data: teams } = await supabase
      .from("teams")
      .select("id, name, is_active, team_members(player_id)")
      .in("id", [team1_id, team2_id]);

    if (!teams || teams.length !== 2) {
      return Response.json({ error: "Equipos no encontrados" }, { status: 404 });
    }

    for (const t of teams) {
      if (!t.is_active) {
        return Response.json({ error: `${t.name} esta inactivo` }, { status: 400 });
      }
      if ((t.team_members?.length ?? 0) < 3) {
        return Response.json({ error: `${t.name} necesita 3 miembros` }, { status: 400 });
      }
    }

    // Crear team match
    const { data: match, error: insertError } = await supabase
      .from("team_matches")
      .insert({
        team1_id,
        team2_id,
        stars_bet: stars_bet ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Crear 3 peleas (los jugadores se asignan luego)
    const fights = [1, 2, 3].map((pos) => ({
      team_match_id: match.id,
      position: pos,
    }));

    await supabase.from("team_match_fights").insert(fights);

    return Response.json(match, { status: 201 });
  } catch (err) {
    console.error("POST /api/team-matches error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
