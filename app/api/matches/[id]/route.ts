import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { winner_id, player1_score, player2_score } = body;

    if (!winner_id) {
      return Response.json({ error: "Falta campo: winner_id" }, { status: 400 });
    }

    // Validate scores if provided
    if (player1_score != null && (typeof player1_score !== "number" || player1_score < 0)) {
      return Response.json(
        { error: "player1_score debe ser un numero >= 0" },
        { status: 400 }
      );
    }
    if (player2_score != null && (typeof player2_score !== "number" || player2_score < 0)) {
      return Response.json(
        { error: "player2_score debe ser un numero >= 0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("resolve_match", {
      p_match_id: id,
      p_winner_id: winner_id,
    });

    // Save scores if provided
    if (!error && player1_score != null && player2_score != null) {
      await supabase
        .from("matches")
        .update({ player1_score, player2_score })
        .eq("id", id);
    }

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // Fetch match to find both players for badge checking
    const { data: matchData } = await supabase
      .from("matches")
      .select("player1_id, player2_id")
      .eq("id", id)
      .single();

    // Trigger badge checks for both players (fire-and-forget)
    if (matchData) {
      const baseUrl = new URL(request.url).origin;
      const badgePlayers = [matchData.player1_id, matchData.player2_id].filter(Boolean);
      for (const playerId of badgePlayers) {
        fetch(`${baseUrl}/api/badges/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") ?? "",
          },
          body: JSON.stringify({ player_id: playerId }),
        }).catch(() => {});
      }
    }

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/matches/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
