import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check admin or judge
    const { data: player } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!player?.is_admin && !player?.is_judge) {
      return Response.json(
        { error: "Solo administradores o jueces" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== "start" && action !== "stop") {
      return Response.json(
        { error: "action debe ser 'start' o 'stop'" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify match exists
    const { data: match, error: matchError } = await adminSupabase
      .from("matches")
      .select("id, status")
      .eq("id", id)
      .single();

    if (matchError || !match) {
      return Response.json({ error: "Partida no encontrada" }, { status: 404 });
    }

    if (action === "start") {
      // Don't allow starting a completed match as live
      if (match.status === "completed") {
        return Response.json(
          { error: "No se puede iniciar en vivo una partida ya completada" },
          { status: 400 }
        );
      }

      const { error: updateError } = await adminSupabase
        .from("matches")
        .update({ is_live: true, status: "in_progress" })
        .eq("id", id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      // action === "stop"
      const { error: updateError } = await adminSupabase
        .from("matches")
        .update({ is_live: false })
        .eq("id", id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }
    }

    return Response.json({ success: true, action });
  } catch (err) {
    console.error("POST /api/matches/[id]/live error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Public endpoint — no auth required
    // The id param is ignored; we return whatever match is currently live
    await params; // consume params to avoid Next.js warning

    const adminSupabase = createAdminClient();

    const { data: liveMatch, error } = await adminSupabase
      .from("matches")
      .select(
        `
        id,
        player1_id,
        player2_id,
        stars_bet,
        status,
        is_live,
        created_at,
        player1:players!matches_player1_id_fkey(id, alias, avatar_url, stars),
        player2:players!matches_player2_id_fkey(id, alias, avatar_url, stars)
      `
      )
      .eq("is_live", true)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ match: liveMatch ?? null });
  } catch (err) {
    console.error("GET /api/matches/[id]/live error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
