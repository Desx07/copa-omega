import { createClient } from "@/lib/supabase/server";

// POST — aplicar voucher de descuento a un pedido
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { voucher_id, order_id } = body as { voucher_id: string; order_id?: string };

    if (!voucher_id) {
      return Response.json({ error: "Falta voucher_id" }, { status: 400 });
    }

    // Verificar voucher
    const { data: voucher } = await supabase
      .from("player_vouchers")
      .select("id, is_used, player_id, discount_percent")
      .eq("id", voucher_id)
      .eq("player_id", user.id)
      .single();

    if (!voucher) {
      return Response.json({ error: "Voucher no encontrado" }, { status: 404 });
    }

    if (voucher.is_used) {
      return Response.json({ error: "Este voucher ya fue usado" }, { status: 400 });
    }

    // Marcar como usado
    const { error } = await supabase
      .from("player_vouchers")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", voucher_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Registrar transaccion
    await supabase.from("wallet_transactions").insert({
      player_id: user.id,
      type: "used",
      amount: 0,
      description: `Voucher ${voucher.discount_percent}% usado${order_id ? ` en pedido` : ""}`,
    });

    return Response.json({ success: true, discount_percent: voucher.discount_percent });
  } catch (err) {
    console.error("POST /api/wallet/apply-voucher error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
