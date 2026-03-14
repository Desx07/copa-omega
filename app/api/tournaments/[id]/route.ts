import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/tournaments/[id] — Tournament detail with participants and matches
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*, created_by_player:players!created_by(id, alias)")
      .eq("id", id)
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

    // Fetch participants
    const { data: participants, error: participantsError } = await supabase
      .from("tournament_participants")
      .select("*, player:players!player_id(id, alias, stars)")
      .eq("tournament_id", id)
      .order("seed", { ascending: true, nullsFirst: false });

    if (participantsError) {
      return Response.json(
        { error: participantsError.message },
        { status: 500 }
      );
    }

    // Fetch matches
    const { data: matches, error: matchesError } = await supabase
      .from("tournament_matches")
      .select(
        "*, player1:players!player1_id(id, alias), player2:players!player2_id(id, alias), winner:players!winner_id(id, alias), judge:players!judge_id(id, alias)"
      )
      .eq("tournament_id", id)
      .order("round", { ascending: true })
      .order("match_order", { ascending: true });

    if (matchesError) {
      return Response.json({ error: matchesError.message }, { status: 500 });
    }

    return Response.json({
      ...tournament,
      participants: participants ?? [],
      matches: matches ?? [],
    });
  } catch (err) {
    console.error("GET /api/tournaments/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] — Delete tournament (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
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

    // Use admin client to bypass RLS for cascade delete
    const adminClient = createAdminClient();

    // Delete tournament (cascades to participants, matches, points)
    const { error } = await adminClient
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tournaments/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
