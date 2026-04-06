import { createClient } from "@/lib/supabase/server";

// POST — generar todas las partidas de la liga (round-robin)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Obtener equipos inscriptos en esta liga de equipo
    const { data: leagueTeams } = await supabase
      .from("team_league_teams")
      .select("team_id")
      .eq("team_league_id", leagueId);

    const teamIds = (leagueTeams ?? []).map((m) => m.team_id);

    if (teamIds.length < 2) {
      return Response.json({ error: "Se necesitan al menos 2 equipos para generar partidas" }, { status: 400 });
    }

    // Generar round-robin (cada equipo juega contra todos los demas)
    const matchInserts = [];
    let round = 1;

    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        matchInserts.push({
          team_league_id: leagueId,
          team1_id: teamIds[i],
          team2_id: teamIds[j],
          round,
          status: "pending",
        });
        round++;
      }
    }

    const { data: matches, error: insertError } = await supabase
      .from("team_league_matches")
      .insert(matchInserts)
      .select();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ matches: matches ?? [], total: matchInserts.length }, { status: 201 });
  } catch (err) {
    console.error("POST /api/leagues/[id]/start error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
