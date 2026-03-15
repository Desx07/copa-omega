import { createClient } from "@/lib/supabase/server";

// GET /api/carousel — public, returns active carousel items ordered by sort_order
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: items, error } = await supabase
      .from("carousel_items")
      .select("id, type, url, thumbnail_url, title, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Also check if carousel is enabled
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "carousel_enabled")
      .single();

    const enabled = setting?.value === "true";

    return Response.json({ items: items ?? [], enabled });
  } catch (err) {
    console.error("GET /api/carousel error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
