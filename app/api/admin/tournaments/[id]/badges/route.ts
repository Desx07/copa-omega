import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/tournaments/[id]/badges
 * List tournament badges (top 3) with player info, for the admin podium cards UI.
 */
export async function GET(
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

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { data: badges, error } = await supabase
      .from("tournament_badges")
      .select(
        "id, position, card_image_url, player:players!player_id(id, alias, avatar_url)"
      )
      .eq("tournament_id", tournamentId)
      .order("position", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(badges ?? []);
  } catch (err) {
    console.error("GET /api/admin/tournaments/[id]/badges error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tournaments/[id]/badges
 * Manually assign or update podium positions.
 * Body: { player_id: string, position: 1 | 2 | 3 }
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

    const body = await request.json();
    const { player_id, position } = body;

    if (!player_id || ![1, 2, 3].includes(position)) {
      return Response.json(
        { error: "Se requiere player_id y position (1, 2 o 3)" },
        { status: 400 }
      );
    }

    // Upsert the badge (replace existing player in that position, or create new)
    // First, remove any existing badge for this position in this tournament
    await supabase
      .from("tournament_badges")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("position", position);

    // Also remove any existing badge for this player in this tournament (they can only have one position)
    await supabase
      .from("tournament_badges")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("player_id", player_id);

    // Insert the new badge
    const { data: badge, error: insertError } = await supabase
      .from("tournament_badges")
      .insert({
        tournament_id: tournamentId,
        player_id,
        position,
      })
      .select(
        "id, position, player:players!player_id(id, alias, avatar_url)"
      )
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(badge, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/tournaments/[id]/badges error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/tournaments/[id]/badges
 * Remove a podium position. Body: { position: 1 | 2 | 3 }
 */
export async function DELETE(
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

    const body = await request.json();
    const { position } = body;

    if (![1, 2, 3].includes(position)) {
      return Response.json(
        { error: "position debe ser 1, 2 o 3" },
        { status: 400 }
      );
    }

    await supabase
      .from("tournament_badges")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("position", position);

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/tournaments/[id]/badges error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
