import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST: Start or complete a season
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!admin?.is_admin) return Response.json({ error: "Solo administradores" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "start" or "complete"

    const { data: season, error: sErr } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", id)
      .single();

    if (sErr || !season) return Response.json({ error: "Temporada no encontrada" }, { status: 404 });

    const adminSupabase = createAdminClient();

    if (action === "start") {
      if (season.status !== "upcoming") {
        return Response.json({ error: "La temporada ya fue iniciada" }, { status: 400 });
      }

      // Mark any active season as completed first
      await adminSupabase
        .from("seasons")
        .update({ status: "completed" })
        .eq("status", "active");

      await adminSupabase
        .from("seasons")
        .update({ status: "active", starts_at: new Date().toISOString() })
        .eq("id", id);

      return Response.json({ success: true, status: "active" });

    } else if (action === "complete") {
      if (season.status !== "active") {
        return Response.json({ error: "La temporada no esta activa" }, { status: 400 });
      }

      // Snapshot all player rankings
      const { data: players } = await adminSupabase
        .from("players")
        .select("id, stars, wins, losses")
        .eq("is_hidden", false)
        .order("stars", { ascending: false });

      if (players && players.length > 0) {
        const snapshots = players.map((p, i) => ({
          season_id: id,
          player_id: p.id,
          final_stars: p.stars,
          final_wins: p.wins,
          final_losses: p.losses,
          final_position: i + 1,
        }));

        await adminSupabase.from("season_snapshots").insert(snapshots);
      }

      // Reset all player stats
      await adminSupabase
        .from("players")
        .update({
          stars: season.initial_stars,
          wins: 0,
          losses: 0,
          current_streak: 0,
          is_eliminated: false,
        })
        .neq("is_hidden", true);

      // Mark season as completed
      await adminSupabase
        .from("seasons")
        .update({ status: "completed", ends_at: new Date().toISOString() })
        .eq("id", id);

      return Response.json({
        success: true,
        status: "completed",
        players_snapshotted: players?.length ?? 0,
      });

    } else {
      return Response.json({ error: "action debe ser 'start' o 'complete'" }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/admin/seasons/[id] error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
