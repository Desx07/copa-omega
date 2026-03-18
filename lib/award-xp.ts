import { SupabaseClient } from "@supabase/supabase-js";

export async function awardXp(
  supabase: SupabaseClient,
  playerId: string,
  amount: number,
  source: string,
  description?: string
) {
  // Atomic XP update to avoid race conditions
  await supabase.rpc("increment_xp", { p_player_id: playerId, p_amount: amount });

  // Log transaction
  await supabase
    .from("xp_transactions")
    .insert({ player_id: playerId, amount, source, description });
}
