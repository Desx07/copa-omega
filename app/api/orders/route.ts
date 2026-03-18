import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// GET /api/orders — List orders (admin: all, user: own only)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if admin
    const { data: player } = await supabase
      .from("players")
      .select("is_admin, alias")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("orders")
      .select(
        "*, player:players!player_id(id, alias), items:order_items(id, product_id, quantity, unit_price, product:products(id, name))"
      )
      .order("created_at", { ascending: false });

    // RLS handles filtering, but for non-admin we explicitly filter for clarity
    if (!player?.is_admin) {
      query = query.eq("player_id", user.id);
    }

    const { data: orders, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(orders ?? []);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/orders — Create order (authenticated)
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
    const { items, payment_method, payment_proof_url, notes } = body;

    // Validate payment_method
    const validMethods = ["cash", "transfer"];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return Response.json(
        { error: "payment_method debe ser 'cash' o 'transfer'" },
        { status: 400 }
      );
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Se requiere al menos un item" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return Response.json(
          { error: "Cada item debe tener product_id y quantity" },
          { status: 400 }
        );
      }
      if (
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return Response.json(
          { error: "quantity debe ser un entero >= 1" },
          { status: 400 }
        );
      }
    }

    // Fetch all products from DB (use admin client to bypass RLS for stock checks)
    const adminClient = createAdminClient();
    const productIds = items.map((i: { product_id: string }) => i.product_id);

    const { data: products, error: productsError } = await adminClient
      .from("products")
      .select("id, name, price, stock, is_active")
      .in("id", productIds);

    if (productsError) {
      return Response.json({ error: productsError.message }, { status: 500 });
    }

    if (!products || products.length !== productIds.length) {
      const foundIds = new Set((products ?? []).map((p) => p.id));
      const missing = productIds.filter((id: string) => !foundIds.has(id));
      return Response.json(
        { error: `Productos no encontrados: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Check duplicates in request
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return Response.json(
        { error: "No se permiten productos duplicados en el pedido" },
        { status: 400 }
      );
    }

    // Validate all products are active and have enough stock
    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const orderItems: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      product_name: string;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return Response.json(
          { error: `Producto no encontrado: ${item.product_id}` },
          { status: 400 }
        );
      }

      if (!product.is_active) {
        return Response.json(
          { error: `El producto "${product.name}" no está disponible` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return Response.json(
          {
            error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);
      total += unitPrice * item.quantity;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        product_name: product.name,
      });
    }

    // Round total to 2 decimal places
    total = Math.round(total * 100) / 100;

    // Create order using admin client for atomic stock deduction
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        player_id: user.id,
        total,
        payment_method,
        payment_proof_url: payment_proof_url || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      return Response.json({ error: orderError.message }, { status: 500 });
    }

    // Insert order items
    const itemRows = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await adminClient
      .from("order_items")
      .insert(itemRows);

    if (itemsError) {
      // Rollback: delete the order
      await adminClient.from("orders").delete().eq("id", order.id);
      return Response.json({ error: itemsError.message }, { status: 500 });
    }

    // Deduct stock atomically for each product
    for (const item of orderItems) {
      const { error: stockError } = await adminClient
        .rpc("decrement_stock", { p_product_id: item.product_id, p_quantity: item.quantity });

      if (stockError) {
        console.error(
          `Error deducting stock for product ${item.product_id}:`,
          stockError
        );
      }
    }

    // Fetch player alias for the email
    const { data: playerData } = await adminClient
      .from("players")
      .select("alias")
      .eq("id", user.id)
      .single();

    const playerAlias = playerData?.alias ?? "Jugador desconocido";

    // Send email notification to admin
    try {
      const itemsHtml = orderItems
        .map(
          (item) =>
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unit_price * item.quantity).toFixed(2)}</td>
            </tr>`
        )
        .join("");

      await getResend().emails.send({
        from: "Copa Omega <onboarding@resend.dev>",
        to: "arieltsume@gmail.com",
        subject: `Nuevo pedido #${order.id.slice(0, 8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Nuevo pedido recibido</h2>
            <p><strong>Pedido:</strong> #${order.id.slice(0, 8)}</p>
            <p><strong>Jugador:</strong> ${playerAlias}</p>
            <p><strong>Método de pago:</strong> ${payment_method === "cash" ? "Efectivo" : "Transferencia"}</p>
            ${payment_proof_url && typeof payment_proof_url === "string" && payment_proof_url.startsWith("https://") ? `<p><strong>Comprobante:</strong> <a href="${escapeHtml(payment_proof_url)}">Ver comprobante</a></p>` : ""}
            ${notes && typeof notes === "string" ? `<p><strong>Notas:</strong> ${escapeHtml(notes)}</p>` : ""}
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 8px; text-align: left;">Producto</th>
                  <th style="padding: 8px; text-align: center;">Cant.</th>
                  <th style="padding: 8px; text-align: right;">P. Unit.</th>
                  <th style="padding: 8px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 8px; text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <p style="color: #666; font-size: 12px;">Fecha: ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Don't fail the order if email fails
      console.error("Error sending order notification email:", emailErr);
    }

    // Re-fetch order with items for response
    const { data: fullOrder } = await adminClient
      .from("orders")
      .select(
        "*, items:order_items(id, product_id, quantity, unit_price, product:products(id, name))"
      )
      .eq("id", order.id)
      .single();

    return Response.json(fullOrder, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
