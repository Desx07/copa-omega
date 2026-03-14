import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/products/[id] — Update product (admin only)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
    const { name, description, price, stock, is_active } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return Response.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description || null;
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return Response.json(
          { error: "El precio debe ser un número >= 0" },
          { status: 400 }
        );
      }
      updates.price = price;
    }

    if (stock !== undefined) {
      if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
        return Response.json(
          { error: "El stock debe ser un entero >= 0" },
          { status: 400 }
        );
      }
      updates.stock = stock;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") {
        return Response.json(
          { error: "is_active debe ser boolean" },
          { status: 400 }
        );
      }
      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { error: "No se proporcionaron campos para actualizar" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*, images:product_images(id, image_url, sort_order)")
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return Response.json(
          { error: "Producto no encontrado" },
          { status: 404 }
        );
      }
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json(product);
  } catch (err) {
    console.error("PATCH /api/admin/products/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] — Delete product (admin only)
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Check product exists
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return Response.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Delete product (cascades to product_images)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
