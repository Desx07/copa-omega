import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardXp } from "@/lib/award-xp";

// Supabase devuelve FK joins como arrays internamente.
// Extraemos el primer elemento para acceder al objeto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRelation(val: any): Record<string, unknown> | null {
  if (Array.isArray(val)) return val[0] ?? null;
  return val ?? null;
}

/**
 * GET /api/daily-missions
 * Devuelve las 3 misiones diarias del jugador.
 * Si no tiene asignadas para hoy, asigna 3 random.
 */
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

    const today = new Date().toISOString().split("T")[0];

    // Buscar misiones ya asignadas para hoy
    const { data: existing, error: existingError } = await supabase
      .from("player_daily_missions")
      .select("id, mission_id, progress, completed, claimed, completed_at, mission:daily_missions!mission_id(id, description, type, target_value, reward_oc, reward_xp)")
      .eq("player_id", user.id)
      .eq("assigned_date", today);

    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    // Si ya tiene misiones asignadas, devolver
    if (existing && existing.length > 0) {
      const ocEarnedToday = existing
        .filter((m) => m.claimed)
        .reduce((sum, m) => {
          const mission = extractRelation(m.mission);
          return sum + (Number(mission?.reward_oc) || 0);
        }, 0);

      return Response.json({
        date: today,
        missions: existing.map(formatMission),
        oc_earned_today: ocEarnedToday,
      });
    }

    // Asignar 3 misiones random para hoy
    const { data: allMissions, error: missionsError } = await supabase
      .from("daily_missions")
      .select("id")
      .eq("is_active", true);

    if (missionsError || !allMissions || allMissions.length === 0) {
      return Response.json({
        date: today,
        missions: [],
        oc_earned_today: 0,
      });
    }

    // Seleccionar 3 misiones random (shuffle con seed del dia + user para variedad)
    const shuffled = shuffleWithSeed(allMissions, today + user.id);
    const selected = shuffled.slice(0, Math.min(3, shuffled.length));

    // Insertar asignaciones
    const inserts = selected.map((m) => ({
      player_id: user.id,
      mission_id: m.id,
      assigned_date: today,
      progress: 0,
      completed: false,
      claimed: false,
    }));

    const { error: insertError } = await supabase
      .from("player_daily_missions")
      .insert(inserts);

    if (insertError) {
      // Si falla por unique constraint, alguien mas ya inserto (race condition)
      const { data: refetched } = await supabase
        .from("player_daily_missions")
        .select("id, mission_id, progress, completed, claimed, completed_at, mission:daily_missions!mission_id(id, description, type, target_value, reward_oc, reward_xp)")
        .eq("player_id", user.id)
        .eq("assigned_date", today);

      if (refetched && refetched.length > 0) {
        return Response.json({
          date: today,
          missions: refetched.map(formatMission),
          oc_earned_today: 0,
        });
      }

      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Re-fetch con join para devolver datos completos
    const { data: assigned } = await supabase
      .from("player_daily_missions")
      .select("id, mission_id, progress, completed, claimed, completed_at, mission:daily_missions!mission_id(id, description, type, target_value, reward_oc, reward_xp)")
      .eq("player_id", user.id)
      .eq("assigned_date", today);

    return Response.json({
      date: today,
      missions: (assigned ?? []).map(formatMission),
      oc_earned_today: 0,
    });
  } catch (err) {
    console.error("GET /api/daily-missions error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/daily-missions
 * Body: { player_mission_id: string }
 * Reclama la recompensa de una mision completada.
 */
export async function POST(request: Request) {
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
    const { player_mission_id } = body;

    if (!player_mission_id || typeof player_mission_id !== "string") {
      return Response.json({ error: "Falta player_mission_id" }, { status: 400 });
    }

    // Buscar la mision del jugador
    const { data: playerMission, error: fetchError } = await supabase
      .from("player_daily_missions")
      .select("id, player_id, mission_id, progress, completed, claimed, mission:daily_missions!mission_id(id, description, type, target_value, reward_oc, reward_xp)")
      .eq("id", player_mission_id)
      .eq("player_id", user.id)
      .single();

    if (fetchError || !playerMission) {
      return Response.json({ error: "Mision no encontrada" }, { status: 404 });
    }

    if (!playerMission.completed) {
      return Response.json({ error: "La mision no esta completada" }, { status: 400 });
    }

    if (playerMission.claimed) {
      return Response.json({ error: "La recompensa ya fue reclamada" }, { status: 409 });
    }

    const mission = extractRelation(playerMission.mission);

    if (!mission) {
      return Response.json({ error: "Mision invalida" }, { status: 500 });
    }

    const rewardOc = Number(mission.reward_oc) || 0;
    const rewardXp = Number(mission.reward_xp) || 0;

    // Marcar como reclamada
    const { error: updateError } = await supabase
      .from("player_daily_missions")
      .update({ claimed: true })
      .eq("id", player_mission_id)
      .eq("player_id", user.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Dar recompensas con admin client (bypass RLS)
    const adminSupabase = createAdminClient();

    // Dar OC atomicamente (evita race conditions)
    if (rewardOc > 0) {
      const { error: ocError } = await adminSupabase
        .rpc("add_omega_coins", { p_player_id: user.id, p_amount: rewardOc });

      if (ocError) {
        console.error("Error adding OC reward:", ocError);
      }
    }

    // Dar XP
    if (rewardXp > 0) {
      try {
        await awardXp(adminSupabase, user.id, rewardXp, "daily_mission", "Mision diaria completada");
      } catch (xpErr) {
        console.error("Error awarding mission XP:", xpErr);
      }
    }

    return Response.json({
      success: true,
      reward_oc: rewardOc,
      reward_xp: rewardXp,
    });
  } catch (err) {
    console.error("POST /api/daily-missions error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMission(row: any) {
  const m = extractRelation(row.mission);
  return {
    id: row.id,
    mission_id: row.mission_id,
    description: m?.description ?? "",
    type: m?.type ?? "",
    target_value: Number(m?.target_value) || 1,
    progress: row.progress ?? 0,
    completed: row.completed ?? false,
    claimed: row.claimed ?? false,
    completed_at: row.completed_at ?? null,
    reward_oc: Number(m?.reward_oc) || 0,
    reward_xp: Number(m?.reward_xp) || 0,
  };
}

function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
