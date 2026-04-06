import { createClient } from "@/lib/supabase/server";

// Catalogo de items comprables
const VOUCHER_CATALOG = [
  { type: "voucher_5", discount_percent: 5, cost: 50, label: "5% descuento" },
  { type: "voucher_10", discount_percent: 10, cost: 100, label: "10% descuento" },
  { type: "voucher_15", discount_percent: 15, cost: 200, label: "15% descuento" },
  { type: "voucher_20", discount_percent: 20, cost: 350, label: "20% descuento" },
];

const GOLDEN_TICKET_COST = 500;

// POST — comprar voucher o golden ticket
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { item_type } = body as { item_type: string };

    // Obtener balance actual
    const { data: player } = await supabase
      .from("players")
      .select("omega_coins")
      .eq("id", user.id)
      .single();

    const currentBalance = player?.omega_coins ?? 0;

    if (item_type === "golden_ticket") {
      if (currentBalance < GOLDEN_TICKET_COST) {
        return Response.json({ error: "Saldo insuficiente" }, { status: 400 });
      }

      // Descontar coins
      const { error: updateError } = await supabase
        .from("players")
        .update({ omega_coins: currentBalance - GOLDEN_TICKET_COST })
        .eq("id", user.id);

      if (updateError) {
        return Response.json({ error: updateError.message }, { status: 500 });
      }

      // Crear golden ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("player_vouchers")
        .insert({ player_id: user.id, type: "golden_ticket", discount_percent: null, is_used: false })
        .select()
        .single();

      if (ticketError) {
        return Response.json({ error: ticketError.message }, { status: 500 });
      }

      // Registrar transaccion
      await supabase.from("wallet_transactions").insert({
        player_id: user.id,
        type: "spent",
        amount: -GOLDEN_TICKET_COST,
        description: "Compra: Golden Ticket",
      });

      return Response.json({ success: true, ticket, new_balance: currentBalance - GOLDEN_TICKET_COST }, { status: 201 });
    }

    // Voucher
    const catalogItem = VOUCHER_CATALOG.find((v) => v.type === item_type);
    if (!catalogItem) {
      return Response.json({ error: "Item no encontrado en el catalogo" }, { status: 400 });
    }

    if (currentBalance < catalogItem.cost) {
      return Response.json({ error: "Saldo insuficiente" }, { status: 400 });
    }

    // Descontar coins
    const { error: updateError } = await supabase
      .from("players")
      .update({ omega_coins: currentBalance - catalogItem.cost })
      .eq("id", user.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Crear voucher
    const { data: voucher, error: voucherError } = await supabase
      .from("player_vouchers")
      .insert({
        player_id: user.id,
        type: catalogItem.type,
        discount_percent: catalogItem.discount_percent,
        is_used: false,
      })
      .select()
      .single();

    if (voucherError) {
      return Response.json({ error: voucherError.message }, { status: 500 });
    }

    // Registrar transaccion
    await supabase.from("wallet_transactions").insert({
      player_id: user.id,
      type: "spent",
      amount: -catalogItem.cost,
      description: `Compra: ${catalogItem.label}`,
    });

    return Response.json({ success: true, voucher, new_balance: currentBalance - catalogItem.cost }, { status: 201 });
  } catch (err) {
    console.error("POST /api/wallet/purchase error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
