import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// POST /api/admin/carousel — add carousel item (admin only)
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

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { type, url, thumbnail_url, title, target } = body;

    if (!type || !url) {
      return Response.json(
        { error: "Faltan campos: type, url" },
        { status: 400 }
      );
    }

    if (!["photo", "video"].includes(type)) {
      return Response.json(
        { error: "type debe ser 'photo' o 'video'" },
        { status: 400 }
      );
    }

    // Get max sort_order
    const { data: lastItem } = await supabase
      .from("carousel_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastItem?.sort_order ?? -1) + 1;

    const { data: item, error: insertError } = await supabase
      .from("carousel_items")
      .insert({
        type,
        url,
        thumbnail_url: thumbnail_url || null,
        title: title || null,
        sort_order: nextOrder,
        created_by: user.id,
        target: target || "landing",
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(item, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/carousel error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
