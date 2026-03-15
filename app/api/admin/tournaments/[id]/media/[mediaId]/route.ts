import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/tournaments/[id]/media/[mediaId]
 * Remove a media item from a tournament gallery.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id: tournamentId, mediaId } = await params;
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

    // Delete the media item, scoped to the tournament
    const { error: deleteError } = await supabase
      .from("tournament_media")
      .delete()
      .eq("id", mediaId)
      .eq("tournament_id", tournamentId);

    if (deleteError) {
      console.error("Error deleting media:", deleteError);
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/tournaments/[id]/media/[mediaId] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
