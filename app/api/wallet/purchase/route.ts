import { createClient } from "@/lib/supabase/server";

// POST — comprar voucher o golden ticket (via RPC atomico)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { item_type } = body as { item_type: string };

    // Validar tipo antes de llamar al RPC
    const validTypes = ["discount_5", "discount_10", "discount_15", "discount_20", "golden_ticket"];
    if (!validTypes.includes(item_type)) {
      return Response.json({ error: "Item no encontrado en el catalogo" }, { status: 400 });
    }

    // RPC atomico: verifica balance, descuenta, crea voucher, registra transaccion
    const { data: voucherId, error: rpcError } = await supabase.rpc("purchase_voucher", {
      p_player_id: user.id,
      p_voucher_type: item_type,
    });

    if (rpcError) {
      // El RPC lanza excepciones para saldo insuficiente y tipos invalidos
      const msg = rpcError.message.toLowerCase();
      if (msg.includes("saldo insuficiente") || msg.includes("insufficient")) {
        return Response.json({ error: "Saldo insuficiente" }, { status: 400 });
      }
      return Response.json({ error: rpcError.message }, { status: 500 });
    }

    // Obtener balance actualizado
    const { data: wallet } = await supabase
      .from("omega_wallets")
      .select("balance")
      .eq("player_id", user.id)
      .single();

    return Response.json(
      { success: true, voucher_id: voucherId, new_balance: wallet?.balance ?? 0 },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/wallet/purchase error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
