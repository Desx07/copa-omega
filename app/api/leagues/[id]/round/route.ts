import { createClient } from "@/lib/supabase/server";

// POST — abrir siguiente ronda de la liga
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

    // Obtener la siguiente ronda pendiente
    const { data: nextRound } = await supabase
      .from("league_matches")
      .select("round")
      .eq("league_id", leagueId)
      .eq("status", "pending")
      .order("round", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextRound) {
      return Response.json({ error: "No hay rondas pendientes" }, { status: 400 });
    }

    // Marcar todas las partidas de esa ronda como "in_progress"
    const { data: matches, error } = await supabase
      .from("league_matches")
      .update({ status: "in_progress" })
      .eq("league_id", leagueId)
      .eq("round", nextRound.round)
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ round: nextRound.round, matches: matches ?? [] });
  } catch (err) {
    console.error("POST /api/leagues/[id]/round error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
