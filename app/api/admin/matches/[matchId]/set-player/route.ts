import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/matches/[matchId]/set-player
 *
 * Admin can set/replace a player in any slot of any tournament match.
 * Works on any match status (pending, completed, bye).
 * Body: { tournament_id, slot: "player1" | "player2", player_id: string | null }
 * Pass player_id = null to clear a slot.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
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

    const body = await request.json();
    const { tournament_id, slot, player_id } = body;

    if (!tournament_id) {
      return Response.json({ error: "Falta tournament_id" }, { status: 400 });
    }
    if (!slot || !["player1", "player2"].includes(slot)) {
      return Response.json(
        { error: "slot debe ser 'player1' o 'player2'" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Fetch the match
    const { data: match, error: matchError } = await adminSupabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .eq("tournament_id", tournament_id)
      .single();

    if (matchError || !match) {
      return Response.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    // If setting a player (not clearing), validate they exist
    if (player_id) {
      const { data: player } = await adminSupabase
        .from("players")
        .select("id, alias")
        .eq("id", player_id)
        .single();

      if (!player) {
        return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
      }

      // Auto-register as participant if needed
      const { data: existing } = await adminSupabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", tournament_id)
        .eq("player_id", player_id)
        .maybeSingle();

      if (!existing) {
        await adminSupabase.from("tournament_participants").insert({
          tournament_id,
          player_id,
        });
      }
    }

    // Update the slot
    const field = slot === "player1" ? "player1_id" : "player2_id";
    const { error: updateErr } = await adminSupabase
      .from("tournament_matches")
      .update({ [field]: player_id || null })
      .eq("id", matchId);

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    return Response.json({ success: true, [field]: player_id || null });
  } catch (err) {
    console.error("POST /api/admin/matches/[matchId]/set-player error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
