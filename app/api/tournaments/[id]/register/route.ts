import { createClient } from "@/lib/supabase/server";

// POST /api/tournaments/[id]/register — Register player to tournament
// Body optional: { player_id } — admin can register other players
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if admin is registering someone else
    let targetPlayerId = user.id;
    try {
      const body = await request.json();
      if (body.player_id) {
        // Verify caller is admin or judge
        const { data: admin } = await supabase
          .from("players")
          .select("is_admin, is_judge")
          .eq("id", user.id)
          .single();
        if (!admin?.is_admin && !admin?.is_judge) {
          return Response.json({ error: "Solo admins/jueces pueden inscribir a otros" }, { status: 403 });
        }
        targetPlayerId = body.player_id;
      }
    } catch {
      // No body or invalid JSON — register self
    }

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, name, status, max_participants")
      .eq("id", tournamentId)
      .single();

    if (tournamentError) {
      if (tournamentError.code === "PGRST116") {
        return Response.json(
          { error: "Torneo no encontrado" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: tournamentError.message },
        { status: 500 }
      );
    }

    // Check tournament is in registration phase
    if (tournament.status !== "registration") {
      return Response.json(
        { error: "El torneo no está en fase de inscripción" },
        { status: 400 }
      );
    }

    // Check current participant count
    const { count, error: countError } = await supabase
      .from("tournament_participants")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if (countError) {
      return Response.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= tournament.max_participants) {
      return Response.json(
        { error: "El torneo está lleno" },
        { status: 400 }
      );
    }

    // Check if player exists in players table
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("id, alias")
      .eq("id", targetPlayerId)
      .single();

    if (playerError || !player) {
      return Response.json(
        { error: "Perfil de jugador no encontrado" },
        { status: 404 }
      );
    }

    // Register player
    const { data: participant, error: insertError } = await supabase
      .from("tournament_participants")
      .insert({
        tournament_id: tournamentId,
        player_id: targetPlayerId,
      })
      .select("*, player:players!player_id(id, alias)")
      .single();

    if (insertError) {
      // Unique constraint violation = already registered
      if (insertError.code === "23505") {
        return Response.json(
          { error: "Ya estás inscripto en este torneo" },
          { status: 409 }
        );
      }
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(participant, { status: 201 });
  } catch (err) {
    console.error("POST /api/tournaments/[id]/register error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
