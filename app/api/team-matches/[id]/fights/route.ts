import { createClient } from "@/lib/supabase/server";

// PATCH — actualizar pelea individual dentro de team match
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
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
    const { fight_id, player1_id, player2_id, player1_score, player2_score, winner_player_id, status } = body;

    if (!fight_id) {
      return Response.json({ error: "Falta fight_id" }, { status: 400 });
    }

    // Verificar que la pelea pertenece a esta partida
    const { data: fight } = await supabase
      .from("team_match_fights")
      .select("id, team_match_id")
      .eq("id", fight_id)
      .eq("team_match_id", matchId)
      .single();

    if (!fight) {
      return Response.json({ error: "Pelea no encontrada" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (player1_id !== undefined) updates.player1_id = player1_id;
    if (player2_id !== undefined) updates.player2_id = player2_id;
    if (player1_score !== undefined) updates.player1_score = player1_score;
    if (player2_score !== undefined) updates.player2_score = player2_score;
    if (winner_player_id !== undefined) updates.winner_player_id = winner_player_id;
    if (status !== undefined) updates.status = status;

    const { error } = await supabase
      .from("team_match_fights")
      .update(updates)
      .eq("id", fight_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/team-matches/[id]/fights error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
