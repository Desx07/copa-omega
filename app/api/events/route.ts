import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data ?? []);
  } catch (err) {
    console.error("GET /api/events error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

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
    const { title, description, type, starts_at, ends_at } = body;

    if (!title || !starts_at || !ends_at) {
      return Response.json({ error: "Faltan campos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        description: description || null,
        type: type || "general",
        starts_at,
        ends_at,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/events error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
