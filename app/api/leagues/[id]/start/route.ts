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

    // Obtener season activa
    const { data: activeSeason } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .maybeSingle();

    if (!activeSeason) {
      return Response.json({ error: "No hay temporada activa" }, { status: 400 });
    }

    // Obtener equipos en esta liga
    // Las ligas de equipo se basan en team_league_memberships
    const { data: memberships } = await supabase
      .from("team_league_memberships")
      .select("team_id")
      .eq("league_id", leagueId)
      .eq("season_id", activeSeason.id);

    const teamIds = (memberships ?? []).map((m) => m.team_id);

    if (teamIds.length < 2) {
      return Response.json({ error: "Se necesitan al menos 2 equipos para generar partidas" }, { status: 400 });
    }

    // Generar round-robin (cada equipo juega contra todos los demas)
    const matchInserts = [];
    let round = 1;

    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        matchInserts.push({
          league_id: leagueId,
          season_id: activeSeason.id,
          team1_id: teamIds[i],
          team2_id: teamIds[j],
          round,
          status: "pending",
        });
        round++;
      }
    }

    const { data: matches, error: insertError } = await supabase
      .from("league_matches")
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
