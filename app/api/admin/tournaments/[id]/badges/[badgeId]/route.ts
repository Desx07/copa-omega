import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/tournaments/[id]/badges/[badgeId]
 * Update a tournament badge — currently only card_image_url.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; badgeId: string }> }
) {
  try {
    const { id: tournamentId, badgeId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // Verify badge exists and belongs to this tournament
    const { data: badge } = await supabase
      .from("tournament_badges")
      .select("id")
      .eq("id", badgeId)
      .eq("tournament_id", tournamentId)
      .single();

    if (!badge) {
      return Response.json(
        { error: "Badge no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { card_image_url } = body;

    // Allow null/empty to clear the card
    const urlValue =
      typeof card_image_url === "string" && card_image_url.trim()
        ? card_image_url.trim()
        : null;

    const { error: updateError } = await supabase
      .from("tournament_badges")
      .update({ card_image_url: urlValue })
      .eq("id", badgeId);

    if (updateError) {
      console.error("Error updating badge:", updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true, card_image_url: urlValue });
  } catch (err) {
    console.error("PATCH /api/admin/tournaments/[id]/badges/[badgeId] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
