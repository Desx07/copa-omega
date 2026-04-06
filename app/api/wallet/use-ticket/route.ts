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

    // Usar RPC atomico si hay tournament_id
    if (tournament_id) {
      const { data, error } = await supabase.rpc("use_golden_ticket", {
        p_player_id: user.id,
        p_tournament_id: tournament_id,
      });

      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }

      return Response.json({ success: true, data });
    }

    // Sin tournament_id: marcar manualmente
    // Verificar ticket
    const { data: ticket } = await supabase
      .from("player_vouchers")
      .select("id, is_used, player_id, type")
      .eq("id", ticket_id)
      .eq("player_id", user.id)
      .eq("type", "golden_ticket")
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
      })
      .eq("id", ticket_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /api/wallet/use-ticket error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
