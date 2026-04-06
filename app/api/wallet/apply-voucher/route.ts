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

    // Usar RPC atomico si hay order_id
    if (order_id) {
      const { data, error } = await supabase.rpc("apply_voucher", {
        p_player_id: user.id,
        p_voucher_id: voucher_id,
        p_order_id: order_id,
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ success: true, data });
    }

    // Sin order_id: marcar manualmente
    // Verificar voucher
    const { data: voucher } = await supabase
      .from("player_vouchers")
      .select("id, is_used, player_id, discount_percent, type")
      .eq("id", voucher_id)
      .eq("player_id", user.id)
      .single();

    if (!voucher) {
      return Response.json({ error: "Voucher no encontrado" }, { status: 404 });
    }

    if (voucher.is_used) {
      return Response.json({ error: "Este voucher ya fue usado" }, { status: 400 });
    }

    if (voucher.type === "golden_ticket") {
      return Response.json({ error: "Los golden tickets no se aplican a ordenes. Usa /api/wallet/use-ticket" }, { status: 400 });
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

    return Response.json({ success: true, discount_percent: voucher.discount_percent });
  } catch (err) {
    console.error("POST /api/wallet/apply-voucher error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
