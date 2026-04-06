import { createClient } from "@/lib/supabase/server";

// GET — obtener balance, vouchers y transacciones
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Balance del jugador
    const { data: player } = await supabase
      .from("players")
      .select("id, alias, omega_coins")
      .eq("id", user.id)
      .single();

    const balance = player?.omega_coins ?? 0;

    // Vouchers del jugador
    const { data: vouchers } = await supabase
      .from("wallet_vouchers")
      .select("id, type, discount_percent, cost, is_used, used_at, created_at")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    // Golden tickets
    const { data: tickets } = await supabase
      .from("wallet_golden_tickets")
      .select("id, is_used, used_at, tournament_id, created_at")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    // Transacciones recientes
    const { data: transactions } = await supabase
      .from("wallet_transactions")
      .select("id, type, amount, description, created_at")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return Response.json({
      balance,
      vouchers: vouchers ?? [],
      tickets: tickets ?? [],
      transactions: transactions ?? [],
    });
  } catch (err) {
    console.error("GET /api/wallet error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
