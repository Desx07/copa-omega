import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// GET /api/chat/messages — get chat messages (authenticated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor"); // created_at ISO string
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    let query = supabase
      .from("chat_messages")
      .select("id, player_id, content, created_at, player:players!player_id(alias, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Return in chronological order (oldest first)
    const sorted = (messages ?? []).reverse();

    return Response.json({
      messages: sorted,
      hasMore: (messages?.length ?? 0) === limit,
    });
  } catch (err) {
    console.error("GET /api/chat/messages error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages — send a chat message (authenticated)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const content = (body.content ?? "").trim();

    if (!content) {
      return Response.json({ error: "El mensaje no puede estar vacio" }, { status: 400 });
    }

    if (content.length > 500) {
      return Response.json({ error: "Maximo 500 caracteres" }, { status: 400 });
    }

    const { data: message, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        player_id: user.id,
        content,
      })
      .select("id, player_id, content, created_at, player:players!player_id(alias, avatar_url)")
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(message, { status: 201 });
  } catch (err) {
    console.error("POST /api/chat/messages error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
