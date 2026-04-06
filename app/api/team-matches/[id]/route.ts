import { createClient } from "@/lib/supabase/server";

// PATCH — resolver partida de equipo
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Obtener la partida con sus peleas
    const { data: match } = await supabase
      .from("team_matches")
      .select(`
        id, team1_id, team2_id, stars_bet, status,
        team_match_fights (id, position, winner_id, status)
      `)
      .eq("id", id)
      .single();

    if (!match) {
      return Response.json({ error: "Partida no encontrada" }, { status: 404 });
    }

    if (match.status === "completed") {
      return Response.json({ error: "La partida ya esta completada" }, { status: 400 });
    }

    // Contar victorias por equipo basado en las peleas completadas
    const fights = match.team_match_fights ?? [];
    const completedFights = fights.filter((f) => f.status === "completed");

    if (completedFights.length < 2) {
      return Response.json({ error: "Se necesitan al menos 2 peleas completadas" }, { status: 400 });
    }

    // Determinar ganador desde el body o calcular automaticamente
    const body = await request.json();
    const winnerTeamId = body.winner_team_id as string | undefined;

    // Contar victorias
    const team1Wins = body.team1_wins as number | undefined;
    const team2Wins = body.team2_wins as number | undefined;

    if (team1Wins === undefined || team2Wins === undefined) {
      return Response.json({ error: "Faltan team1_wins y team2_wins" }, { status: 400 });
    }

    const finalWinner = winnerTeamId || (team1Wins > team2Wins ? match.team1_id : match.team2_id);

    // Actualizar match
    const { error: updateError } = await supabase
      .from("team_matches")
      .update({
        status: "completed",
        winner_team_id: finalWinner,
        team1_wins: team1Wins,
        team2_wins: team2Wins,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Actualizar estrellas y W/L de los equipos
    const loserId = finalWinner === match.team1_id ? match.team2_id : match.team1_id;
    const starsBet = match.stars_bet ?? 0;

    // Obtener datos actuales de ambos equipos para actualizar
    const { data: winnerTeam } = await supabase
      .from("teams")
      .select("wins, stars")
      .eq("id", finalWinner)
      .single();

    const { data: loserTeam } = await supabase
      .from("teams")
      .select("losses, stars")
      .eq("id", loserId)
      .single();

    if (winnerTeam) {
      await supabase
        .from("teams")
        .update({
          wins: (winnerTeam.wins ?? 0) + 1,
          stars: (winnerTeam.stars ?? 0) + starsBet,
        })
        .eq("id", finalWinner);
    }

    if (loserTeam) {
      await supabase
        .from("teams")
        .update({
          losses: (loserTeam.losses ?? 0) + 1,
          stars: Math.max(0, (loserTeam.stars ?? 0) - starsBet),
        })
        .eq("id", loserId);
    }

    return Response.json({ success: true, winner_team_id: finalWinner });
  } catch (err) {
    console.error("PATCH /api/team-matches/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
