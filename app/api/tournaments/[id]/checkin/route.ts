import { createClient } from "@/lib/supabase/server";

// POST: Player checks in for tournament
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "No autorizado" }, { status: 401 });

    const { id: tournamentId } = await params;

    // Verify tournament has check-in open
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, checkin_open, checkin_deadline, status")
      .eq("id", tournamentId)
      .single();

    if (!tournament)
      return Response.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    if (tournament.status !== "registration") {
      return Response.json(
        { error: "El torneo ya no está en fase de registro" },
        { status: 400 }
      );
    }
    if (!tournament.checkin_open) {
      return Response.json(
        { error: "El check-in no está abierto" },
        { status: 400 }
      );
    }
    if (
      tournament.checkin_deadline &&
      new Date(tournament.checkin_deadline) < new Date()
    ) {
      return Response.json(
        { error: "El check-in ya cerró" },
        { status: 400 }
      );
    }

    // Verify player is registered
    const { data: participant, error: pErr } = await supabase
      .from("tournament_participants")
      .select("id, checked_in")
      .eq("tournament_id", tournamentId)
      .eq("player_id", user.id)
      .single();

    if (pErr || !participant) {
      return Response.json(
        { error: "No estás inscripto en este torneo" },
        { status: 400 }
      );
    }

    if (participant.checked_in) {
      return Response.json({ message: "Ya hiciste check-in" });
    }

    // Check in
    const { error } = await supabase
      .from("tournament_participants")
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq("id", participant.id);

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/tournaments/[id]/checkin error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
