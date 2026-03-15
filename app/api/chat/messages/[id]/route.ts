import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// DELETE /api/chat/messages/[id] — delete a chat message (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/chat/messages/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
