import { createClient } from "@/lib/supabase/server";

// POST — usar golden ticket para inscripcion a torneo
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { ticket_id, tournament_id } = body as { ticket_id: string; tournament_id?: string };

    if (!ticket_id) {
      return Response.json({ error: "Falta ticket_id" }, { status: 400 });
    }

    // Verificar ticket
    const { data: ticket } = await supabase
      .from("player_vouchers")
      .select("id, is_used, player_id")
      .eq("id", ticket_id)
      .eq("player_id", user.id)
      .single();

    if (!ticket) {
      return Response.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    if (ticket.is_used) {
      return Response.json({ error: "Este ticket ya fue usado" }, { status: 400 });
    }

    // Marcar como usado
    const { error } = await supabase
      .from("player_vouchers")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_on_tournament_id: tournament_id || null,
      })
      .eq("id", ticket_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Registrar transaccion
    await supabase.from("wallet_transactions").insert({
      player_id: user.id,
      type: "used",
      amount: 0,
      description: `Golden Ticket usado${tournament_id ? " para torneo" : ""}`,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/wallet/use-ticket error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
