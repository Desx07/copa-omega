import { createClient } from "@/lib/supabase/server";

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
    const { feed_item_id, reaction } = body;

    if (!feed_item_id || !reaction) {
      return Response.json(
        { error: "Faltan campos: feed_item_id, reaction" },
        { status: 400 }
      );
    }

    const validReactions = ["fire", "star", "skull", "lightning", "laugh"];
    if (!validReactions.includes(reaction)) {
      return Response.json(
        { error: `reaction debe ser uno de: ${validReactions.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if user already reacted to this feed item
    const { data: existing } = await supabase
      .from("feed_reactions")
      .select("id, reaction")
      .eq("feed_item_id", feed_item_id)
      .eq("player_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.reaction === reaction) {
        // Toggle off — remove reaction
        await supabase
          .from("feed_reactions")
          .delete()
          .eq("id", existing.id);
        return Response.json({ action: "removed" });
      } else {
        // Change reaction
        await supabase
          .from("feed_reactions")
          .delete()
          .eq("id", existing.id);
      }
    }

    // Insert new reaction
    const { error: insertError } = await supabase
      .from("feed_reactions")
      .insert({
        feed_item_id,
        player_id: user.id,
        reaction,
      });

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({ action: "added", reaction });
  } catch (err) {
    console.error("POST /api/feed/reactions error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
