import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/tournaments/[id]/media
 * Add a photo or video link to a tournament gallery.
 */
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

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Verify tournament exists
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", tournamentId)
      .single();

    if (!tournament) {
      return Response.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { url, type, caption, thumbnail_url } = body;

    if (!url || typeof url !== "string") {
      return Response.json({ error: "URL es obligatorio" }, { status: 400 });
    }

    const validTypes = ["photo", "video"];
    if (!type || !validTypes.includes(type)) {
      return Response.json(
        { error: "type debe ser 'photo' o 'video'" },
        { status: 400 }
      );
    }

    // Get max sort_order for this tournament
    const { data: lastMedia } = await supabase
      .from("tournament_media")
      .select("sort_order")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastMedia?.sort_order ?? -1) + 1;

    const { data: media, error: insertError } = await supabase
      .from("tournament_media")
      .insert({
        tournament_id: tournamentId,
        url: url.trim(),
        type,
        caption: caption?.trim() || null,
        thumbnail_url: thumbnail_url?.trim() || null,
        sort_order: nextOrder,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting media:", insertError);
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(media, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/tournaments/[id]/media error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/tournaments/[id]/media
 * List all media for a tournament.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();

    const { data: media, error } = await supabase
      .from("tournament_media")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("sort_order", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(media ?? []);
  } catch (err) {
    console.error("GET /api/admin/tournaments/[id]/media error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
