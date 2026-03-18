import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/orders/[id] — Update order status (admin only)
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
    const { status } = body;

    // Validate status
    const validStatuses = ["confirmed", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return Response.json(
        {
          error: `Estado inválido. Debe ser uno de: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Fetch current order to validate transition
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !currentOrder) {
      return Response.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Prevent updating already cancelled or delivered orders
    if (currentOrder.status === "cancelled") {
      return Response.json(
        { error: "No se puede modificar un pedido cancelado" },
        { status: 400 }
      );
    }

    if (currentOrder.status === "delivered") {
      return Response.json(
        { error: "No se puede modificar un pedido ya entregado" },
        { status: 400 }
      );
    }

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "*, player:players!player_id(id, alias), items:order_items(id, product_id, quantity, unit_price, product:products(id, name))"
      )
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // If cancelled, restore stock
    if (status === "cancelled") {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = createAdminClient();

      const { data: orderItems } = await adminClient
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", id);

      if (orderItems) {
        for (const item of orderItems) {
          await adminClient.rpc("restore_stock", {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }
    }

    return Response.json(order);
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
