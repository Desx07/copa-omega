import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// PATCH /api/admin/matches/[matchId]/judge — Assign judge to a tournament match
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
  const { matchId } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  // Admin check
  const { data: admin } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!admin?.is_admin) {
    return Response.json({ error: "Solo administradores" }, { status: 403 });
  }

  const body = await request.json();
  const { judge_id } = body;

  if (!judge_id) {
    return Response.json({ error: "Falta campo: judge_id" }, { status: 400 });
  }

  // Verify the player exists and is_judge = true
  const { data: judge } = await supabase
    .from("players")
    .select("id, is_judge, alias")
    .eq("id", judge_id)
    .single();

  if (!judge) {
    return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
  }

  if (!judge.is_judge) {
    return Response.json(
      { error: `${judge.alias} no tiene rol de juez` },
      { status: 400 }
    );
  }

  // Verify the match exists
  const { data: match } = await supabase
    .from("tournament_matches")
    .select("id, status, player1_id, player2_id")
    .eq("id", matchId)
    .single();

  if (!match) {
    return Response.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  // Don't allow assigning a judge who is a player in the match
  if (judge_id === match.player1_id || judge_id === match.player2_id) {
    return Response.json(
      { error: "El juez no puede ser un jugador del partido" },
      { status: 400 }
    );
  }

  // Assign the judge
  const { error: updateError } = await supabase
    .from("tournament_matches")
    .update({ judge_id })
    .eq("id", matchId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ success: true, judge_alias: judge.alias });
  } catch (err) {
    console.error("PATCH /api/admin/matches/[matchId]/judge error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
