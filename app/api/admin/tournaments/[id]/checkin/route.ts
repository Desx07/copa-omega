import { createClient } from "@/lib/supabase/server";

// POST: Open/close check-in window
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return Response.json({ error: "No autorizado" }, { status: 401 });

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!admin?.is_admin)
      return Response.json(
        { error: "Solo administradores" },
        { status: 403 }
      );

    const { id } = await params;
    const body = await request.json();
    const { open, deadline_minutes } = body;

    const updates: Record<string, unknown> = { checkin_open: !!open };

    if (open && deadline_minutes) {
      updates.checkin_deadline = new Date(
        Date.now() + deadline_minutes * 60 * 1000
      ).toISOString();
    }

    if (!open) {
      updates.checkin_deadline = null;
    }

    const { error } = await supabase
      .from("tournaments")
      .update(updates)
      .eq("id", id)
      .eq("status", "registration");

    if (error)
      return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true, checkin_open: !!open });
  } catch (err) {
    console.error("POST /api/admin/tournaments/[id]/checkin error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
