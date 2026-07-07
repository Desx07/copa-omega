import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RANKS, type RankLetter } from "@/lib/ascenso";
import { NextRequest } from "next/server";

// ── PATCH /api/admin/players/[id]/rank ──
// Cambia manualmente el rango de un jugador (acción de admin).
// Caso de uso: cuando quedan 2 jugadores atascados en un rango y el admin
// quiere hacerlos ascender a mano, sin pasar por el combate de ascenso.
//
// Body: { rank_letter: "F" | "E" | "D" | "C" | "B" | "A" | "S" }
// Respuesta: { id, rank_letter }
//
// Usa el cliente de servicio (service role) para el UPDATE porque
// players.rank_letter es una columna protegida por la RLS players_update_own
// (el jugador no puede auto-editarla). El permiso real se valida acá (is_admin).
//
// Al cambiar de rango se resetea el ticket (ticket_points = 0 y, si existe,
// ticket_filled_at = NULL): el progreso del rango anterior no aplica al nuevo.

/** Letras de rango válidas, derivadas de la fuente única RANKS (lib/ascenso). */
const VALID_RANKS = RANKS.map((r) => r.letter);

/** Type guard: valida que un string sea una RankLetter conocida. */
function isRankLetter(value: unknown): value is RankLetter {
  return typeof value === "string" && VALID_RANKS.includes(value as RankLetter);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Autorización: solo admins
    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // 3. Validación del input
    const body = await request.json().catch(() => null);
    const rankLetter = (body as { rank_letter?: unknown } | null)?.rank_letter;

    if (!isRankLetter(rankLetter)) {
      return Response.json({ error: "Rango inválido" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 4. Traer el rango actual (para el metadata del feed y verificar existencia)
    const { data: current, error: fetchError } = await adminClient
      .from("players")
      .select("id, rank_letter")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }
    if (!current) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    const fromRank = current.rank_letter as RankLetter | null;

    // 5. UPDATE del rango + reset del ticket (columnas protegidas por RLS).
    // ticket_filled_at se resetea aparte de forma tolerante (ver más abajo)
    // porque la columna puede no existir todavía (migración pendiente).
    const { data: updated, error } = await adminClient
      .from("players")
      .update({ rank_letter: rankLetter, ticket_points: 0 })
      .eq("id", id)
      .select("id, rank_letter");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!updated || updated.length === 0) {
      return Response.json({ error: "Jugador no encontrado" }, { status: 404 });
    }

    // 5b. Reset tolerante de ticket_filled_at. Si la columna aún no existe
    // (otra migración pendiente), ignoramos el error para no romper el cambio
    // de rango, que es lo prioritario. Se loguea pero no aborta.
    const { error: filledErr } = await adminClient
      .from("players")
      .update({ ticket_filled_at: null })
      .eq("id", id);
    if (filledErr) {
      console.warn(
        "PATCH /api/admin/players/[id]/rank: no se pudo resetear ticket_filled_at (columna ausente?):",
        filledErr.message
      );
    }

    // 6. Registrar el cambio manual en el feed de actividad.
    // 'rank_change' ya está permitido por el CHECK de activity_feed.type.
    // No bloquea la respuesta si falla el insert del feed.
    const { error: feedError } = await adminClient.from("activity_feed").insert({
      type: "rank_change",
      actor_id: user.id, // admin que hizo el cambio
      target_id: id, // jugador afectado
      metadata: {
        event: "manual_rank_change",
        manual: true,
        by_admin: true,
        from_rank: fromRank,
        to_rank: rankLetter,
      },
    });
    if (feedError) {
      console.warn(
        "PATCH /api/admin/players/[id]/rank: no se pudo registrar en activity_feed:",
        feedError.message
      );
    }

    return Response.json({
      id: updated[0].id,
      rank_letter: updated[0].rank_letter,
    });
  } catch (err) {
    console.error("PATCH /api/admin/players/[id]/rank error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
