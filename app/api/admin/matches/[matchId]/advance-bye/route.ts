import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/matches/[matchId]/advance-bye
 *
 * Manually advance a bye match that didn't auto-advance.
 * Admin only. Sets the winner and advances them to the next bracket match.
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
    const { tournament_id } = body;

    if (!tournament_id) {
      return Response.json({ error: "Falta tournament_id" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Fetch the match
    const { data: match, error: matchError } = await adminSupabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return Response.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    if (match.status !== "bye") {
      return Response.json(
        { error: "Este partido no es un bye" },
        { status: 400 }
      );
    }

    const winnerId = match.player1_id ?? match.player2_id;
    if (!winnerId) {
      return Response.json(
        { error: "No hay jugador en este partido bye" },
        { status: 400 }
      );
    }

    // Mark bye as resolved
    const { error: updateErr } = await adminSupabase
      .from("tournament_matches")
      .update({
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateErr) {
      console.error("[AdvanceBye] Error updating bye match:", updateErr);
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    // Advance winner to next match
    if (match.next_match_id) {
      const { data: feeders } = await adminSupabase
        .from("tournament_matches")
        .select("id, match_order")
        .eq("next_match_id", match.next_match_id)
        .order("match_order", { ascending: true });

      if (feeders) {
        const feederIndex = feeders.findIndex((f) => f.id === matchId);
        const slot = feederIndex === 0 ? "player1_id" : "player2_id";

        const { error: advanceErr } = await adminSupabase
          .from("tournament_matches")
          .update({ [slot]: winnerId })
          .eq("id", match.next_match_id);

        if (advanceErr) {
          console.error("[AdvanceBye] Error advancing to next match:", advanceErr);
          return Response.json({ error: advanceErr.message }, { status: 500 });
        }

        console.log(`[AdvanceBye] Advanced player ${winnerId} to ${slot} of match ${match.next_match_id}`);
      }
    }

    return Response.json({ success: true, winner_id: winnerId });
  } catch (err) {
    console.error("POST /api/admin/matches/[matchId]/advance-bye error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
