import { SupabaseClient } from "@supabase/supabase-js";

export async function awardXp(
  supabase: SupabaseClient,
  playerId: string,
  amount: number,
  source: string,
  description?: string
) {
  // Get current XP
  const { data: player } = await supabase
    .from("players")
    .select("xp")
    .eq("id", playerId)
    .single();

  if (!player) return;

  // Update XP
  await supabase
    .from("players")
    .update({ xp: player.xp + amount })
    .eq("id", playerId);

  // Log transaction
  await supabase
    .from("xp_transactions")
    .insert({ player_id: playerId, amount, source, description });
}
