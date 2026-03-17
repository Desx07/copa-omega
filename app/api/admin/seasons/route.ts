import { createClient } from "@/lib/supabase/server";

// GET: List all seasons
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .order("number", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  } catch (err) {
    console.error("GET /api/admin/seasons error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Create a new season
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, starts_at, ends_at, initial_stars } = body;

    if (!name || !starts_at || !ends_at) {
      return Response.json({ error: "Faltan campos: name, starts_at, ends_at" }, { status: 400 });
    }

    // Get next season number
    const { data: lastSeason } = await supabase
      .from("seasons")
      .select("number")
      .order("number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastSeason?.number ?? 0) + 1;

    const { data: season, error } = await supabase
      .from("seasons")
      .insert({
        name,
        number: nextNumber,
        starts_at,
        ends_at,
        initial_stars: initial_stars ?? 25,
        status: "upcoming",
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(season, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/seasons error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
