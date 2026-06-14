import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

// ── PATCH /api/admin/players/[id]/ascenso ──
// Habilita o deshabilita a un jugador para el Torneo de Ascenso.
// Solo los jugadores habilitados (porque pagaron / van a jugar) pueden sumar
// puntos de ticket, pelear combates de ascenso y aparecer en el ranking.
//
// Body: { enabled: boolean }
// Respuesta: { id, ascenso_enabled }
//
// Usa el cliente de servicio (service role) para el UPDATE porque
// players.ascenso_enabled es una columna protegida por la RLS players_update_own
// (el jugador no puede auto-editarla). El permiso real ya se valida acá (is_admin).

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const enabled = (body as { enabled?: unknown } | null)?.enabled;

    if (typeof enabled !== "boolean") {
      return Response.json(
        { error: "El campo 'enabled' es requerido y debe ser booleano" },
        { status: 400 }
      );
    }

    // UPDATE con el cliente de servicio (columna protegida por RLS).
    const adminClient = createAdminClient();
    const { data: updated, error } = await adminClient
      .from("players")
      .update({ ascenso_enabled: enabled })
      .eq("id", id)
      .select("id, ascenso_enabled")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!updated) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    return Response.json({
      id: updated.id,
      ascenso_enabled: updated.ascenso_enabled,
    });
  } catch (err) {
    console.error("PATCH /api/admin/players/[id]/ascenso error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
