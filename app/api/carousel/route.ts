import { createClient } from "@/lib/supabase/server";

// GET /api/carousel?target=landing|dashboard — returns active carousel items
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("target") || "landing";

    const { data: items, error } = await supabase
      .from("carousel_items")
      .select("id, type, url, thumbnail_url, title, sort_order, is_active")
      .eq("target", target)
      .order("sort_order", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Check if this carousel is enabled
    const settingKey = target === "dashboard" ? "dashboard_carousel_enabled" : "carousel_enabled";
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", settingKey)
      .single();

    const enabled = setting?.value === "true";

    return Response.json({ items: items ?? [], enabled });
  } catch (err) {
    console.error("GET /api/carousel error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
