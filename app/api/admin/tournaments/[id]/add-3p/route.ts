import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/tournaments/[id]/add-3p
 * Creates a 3rd place match for a single elimination tournament that doesn't have one.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!admin?.is_admin) return Response.json({ error: "Solo administradores" }, { status: 403 });

    // Check if 3P already exists
    const { data: existing } = await supabase
      .from("tournament_matches")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("bracket_position", "3P")
      .maybeSingle();

    if (existing) {
      return Response.json({ already_exists: true, match_id: existing.id });
    }

    // Get the final round number
    const { data: finalMatch } = await supabase
      .from("tournament_matches")
      .select("round")
      .eq("tournament_id", tournamentId)
      .eq("bracket_position", "F")
      .maybeSingle();

    if (!finalMatch) {
      return Response.json({ error: "No se encontro la llave final" }, { status: 400 });
    }

    // Create 3P match
    const adminSupabase = createAdminClient();
    const { data: match, error } = await adminSupabase
      .from("tournament_matches")
      .insert({
        tournament_id: tournamentId,
        round: finalMatch.round,
        match_order: 1,
        player1_id: null,
        player2_id: null,
        bracket_position: "3P",
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, match_id: match.id });
  } catch (err) {
    console.error("POST /api/admin/tournaments/[id]/add-3p error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
