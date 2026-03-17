import { createClient } from "@/lib/supabase/server";
import { getCurrentWeekStart } from "@/lib/missions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
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

    const { matchId } = await params;

    const { data: comments, error } = await supabase
      .from("battle_comments")
      .select(
        "id, content, created_at, player_id, player:players!player_id(id, alias, avatar_url)"
      )
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(comments);
  } catch (err) {
    console.error("GET /api/battles/[matchId]/comments error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
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

    const { matchId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return Response.json(
        { error: "Falta el contenido del comentario" },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 200) {
      return Response.json(
        { error: "El comentario debe tener entre 1 y 200 caracteres" },
        { status: 400 }
      );
    }

    // Verify the match exists and is completed
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, status")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return Response.json(
        { error: "Partida no encontrada" },
        { status: 404 }
      );
    }

    if (match.status !== "completed") {
      return Response.json(
        { error: "Solo se puede comentar partidas completadas" },
        { status: 400 }
      );
    }

    const { data: comment, error: insertError } = await supabase
      .from("battle_comments")
      .insert({
        match_id: matchId,
        player_id: user.id,
        content: content.trim(),
      })
      .select(
        "id, content, created_at, player_id, player:players!player_id(id, alias, avatar_url)"
      )
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Auto-complete mission (fire-and-forget)
    supabase.from("player_missions").upsert({
      player_id: user.id,
      week_start: getCurrentWeekStart(),
      mission_id: "comment",
      completed_at: new Date().toISOString(),
    }, { onConflict: "player_id,week_start,mission_id" }).then(() => {});

    return Response.json(comment, { status: 201 });
  } catch (err) {
    console.error("POST /api/battles/[matchId]/comments error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
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

    await params; // consume params

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return Response.json(
        { error: "Falta commentId" },
        { status: 400 }
      );
    }

    // RLS handles permission (own comment or admin)
    const { error: deleteError } = await supabase
      .from("battle_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/battles/[matchId]/comments error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
