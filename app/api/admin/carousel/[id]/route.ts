import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// PATCH /api/admin/carousel/[id] — update carousel item (admin only)
export async function PATCH(
  request: NextRequest,
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

    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.type !== undefined) {
      if (!["photo", "video"].includes(body.type)) {
        return Response.json(
          { error: "type debe ser 'photo' o 'video'" },
          { status: 400 }
        );
      }
      updates.type = body.type;
    }
    if (body.url !== undefined) updates.url = body.url;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
    if (body.title !== undefined) updates.title = body.title;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const { data: item, error: updateError } = await supabase
      .from("carousel_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json(item);
  } catch (err) {
    console.error("PATCH /api/admin/carousel/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/carousel/[id] — delete carousel item (admin only)
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

    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("carousel_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/carousel/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
