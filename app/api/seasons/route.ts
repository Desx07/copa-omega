import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get active season
    const { data: active } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .single();

    // Get completed seasons with top 3
    const { data: completed } = await supabase
      .from("seasons")
      .select("*, top3:season_snapshots(player_id, final_stars, final_position, player:players!player_id(alias, avatar_url))")
      .eq("status", "completed")
      .order("number", { ascending: false });

    // Filter top3 to only position <= 3
    const completedWithTop3 = (completed ?? []).map(s => ({
      ...s,
      top3: ((s.top3 as unknown[]) ?? []).filter((snap: any) => snap.final_position <= 3),
    }));

    return Response.json({
      active,
      completed: completedWithTop3,
    });
  } catch (err) {
    console.error("GET /api/seasons error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
