import { createClient } from "@/lib/supabase/server";

// POST /api/tournaments/[id]/register — Register player to tournament (authenticated)
export async function POST(
  _request: Request,
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
      .eq("id", user.id)
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
        player_id: user.id,
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
