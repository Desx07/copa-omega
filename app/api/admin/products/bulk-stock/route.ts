import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// PATCH /api/admin/products/bulk-stock — Update stock for all active products
export async function PATCH(request: NextRequest) {
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
    const { stock } = body;

    if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
      return Response.json(
        { error: "El stock debe ser un entero >= 0" },
        { status: 400 }
      );
    }

    // Update all active products
    const { error: updateError, count } = await supabase
      .from("products")
      .update({ stock, updated_at: new Date().toISOString() })
      .eq("is_active", true);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ success: true, updated: count });
  } catch (err) {
    console.error("PATCH /api/admin/products/bulk-stock error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
