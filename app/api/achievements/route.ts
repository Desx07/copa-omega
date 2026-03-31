import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/achievements
 * Devuelve todos los logros con el estado de desbloqueo del jugador actual.
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

    // Traer todos los logros
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("id, name, description, icon, category, requirement_type, requirement_value, reward_oc, reward_xp, reward_badge, rarity")
      .order("category")
      .order("rarity");

    if (achievementsError) {
      return Response.json({ error: achievementsError.message }, { status: 500 });
    }

    // Traer logros desbloqueados del jugador
    const { data: unlocked, error: unlockedError } = await supabase
      .from("player_achievements")
      .select("achievement_id, unlocked_at")
      .eq("player_id", user.id);

    if (unlockedError) {
      return Response.json({ error: unlockedError.message }, { status: 500 });
    }

    // Armar un mapa de desbloqueos
    const unlockedMap = new Map<string, string>();
    for (const u of unlocked ?? []) {
      unlockedMap.set(u.achievement_id, u.unlocked_at);
    }

    // Traer stats del jugador para calcular progreso
    const { data: player } = await supabase
      .from("players")
      .select("wins, losses, current_login_streak, max_login_streak, predictions_correct, xp, omega_coins")
      .eq("id", user.id)
      .single();

    // Traer conteos adicionales para progreso
    const [challengesReceived, beysCount, decksCount, gachaSCount] = await Promise.all([
      supabase
        .from("challenges")
        .select("id", { count: "exact", head: true })
        .eq("challenged_id", user.id),
      supabase
        .from("beys")
        .select("id", { count: "exact", head: true })
        .eq("player_id", user.id),
      supabase
        .from("player_decks")
        .select("id", { count: "exact", head: true })
        .eq("player_id", user.id),
      supabase
        .from("gacha_pulls")
        .select("id", { count: "exact", head: true })
        .eq("player_id", user.id)
        .eq("tier_result", "S"),
    ]);

    // Mapa de progreso calculado por requirement_type
    const progressMap: Record<string, number> = {
      total_wins: player?.wins ?? 0,
      win_streak: 0, // requiere calculo mas complejo, se deja en 0
      wins_in_day: 0, // requiere calculo contextual
      beat_rank_1: 0,
      challenges_received: challengesReceived.count ?? 0,
      help_new_players: 0, // no trackeado aun
      correct_predictions: player?.predictions_correct ?? 0,
      owned_beys: beysCount.count ?? 0,
      gacha_s_tier: gachaSCount.count ?? 0,
      has_deck: (decksCount.count ?? 0) > 0 ? 1 : 0,
      tournament_wins: 0, // requiere query mas compleja
      tournaments_played: 0,
      top_3_count: 0,
      registered_first_month: 0,
      reach_omega_level: (player?.xp ?? 0) >= 2000 ? 1 : 0,
      login_streak_7: player?.max_login_streak ?? 0,
      total_oc_earned: player?.omega_coins ?? 0,
      wins_with_defense: 0,
      wins_with_attack: 0,
    };

    const totalAchievements = (achievements ?? []).length;
    const totalUnlocked = unlockedMap.size;

    // Combinar logros con estado de desbloqueo
    const result = (achievements ?? []).map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id) ?? null,
      current_progress: progressMap[a.requirement_type] ?? 0,
    }));

    return Response.json({
      achievements: result,
      total: totalAchievements,
      unlocked: totalUnlocked,
    });
  } catch (err) {
    console.error("GET /api/achievements error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
