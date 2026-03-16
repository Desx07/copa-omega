import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/matches/[matchId]/assign-player
 *
 * Assign a player to a bye slot in an elimination bracket match.
 * This allows adding late-arriving players to the bracket.
 * Admin only.
 *
 * Body: { tournament_id, player_alias }
 *
 * The player must exist in the players table and will be auto-registered
 * as a tournament participant if not already registered.
 * The match status changes from "bye" to "pending" so it can be played.
 */
export async function POST(
  request: Request,
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
    const { tournament_id, player_alias } = body;

    if (!tournament_id) {
      return Response.json({ error: "Falta tournament_id" }, { status: 400 });
    }
    if (!player_alias || typeof player_alias !== "string") {
      return Response.json({ error: "Falta player_alias" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Find the player by alias (case-insensitive)
    const { data: player, error: playerError } = await adminSupabase
      .from("players")
      .select("id, alias")
      .ilike("alias", player_alias.trim())
      .single();

    if (playerError || !player) {
      return Response.json(
        { error: `Jugador "${player_alias}" no encontrado. Debe tener una cuenta creada.` },
        { status: 404 }
      );
    }

    // Fetch the match
    const { data: match, error: matchError } = await adminSupabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return Response.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    if (match.tournament_id !== tournament_id) {
      return Response.json({ error: "El partido no pertenece a este torneo" }, { status: 400 });
    }

    // Verify this is a bye match that hasn't been resolved
    if (match.status !== "bye") {
      return Response.json(
        { error: "Este partido no es un bye" },
        { status: 400 }
      );
    }

    if (match.winner_id) {
      return Response.json(
        { error: "Este bye ya fue avanzado, no se puede agregar jugador" },
        { status: 400 }
      );
    }

    // Check that there's an empty slot
    if (match.player1_id && match.player2_id) {
      return Response.json(
        { error: "Este partido ya tiene dos jugadores" },
        { status: 400 }
      );
    }

    // Check player isn't already in this match
    if (match.player1_id === player.id || match.player2_id === player.id) {
      return Response.json(
        { error: "Este jugador ya esta en este partido" },
        { status: 400 }
      );
    }

    // Register the player as tournament participant if not already
    const { data: existingParticipant } = await adminSupabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournament_id)
      .eq("player_id", player.id)
      .single();

    if (!existingParticipant) {
      const { error: regError } = await adminSupabase
        .from("tournament_participants")
        .insert({
          tournament_id: tournament_id,
          player_id: player.id,
        });

      if (regError) {
        console.error("[AssignPlayer] Error registering participant:", regError);
        return Response.json(
          { error: "Error registrando al jugador en el torneo" },
          { status: 500 }
        );
      }
      console.log(`[AssignPlayer] Registered ${player.alias} (${player.id}) as participant`);
    }

    // Assign the player to the empty slot and change status to "pending"
    const updateData: Record<string, unknown> = {
      status: "pending",
    };

    if (!match.player1_id) {
      updateData.player1_id = player.id;
    } else {
      updateData.player2_id = player.id;
    }

    const { error: updateErr } = await adminSupabase
      .from("tournament_matches")
      .update(updateData)
      .eq("id", matchId);

    if (updateErr) {
      console.error("[AssignPlayer] Error updating match:", updateErr);
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    console.log(`[AssignPlayer] Assigned ${player.alias} to match ${matchId}, status changed to pending`);

    return Response.json({
      success: true,
      player_id: player.id,
      player_alias: player.alias,
    });
  } catch (err) {
    console.error("POST /api/admin/matches/[matchId]/assign-player error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
