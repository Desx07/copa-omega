import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tournament_id, direction } = body;

    if (!tournament_id || !["up", "down"].includes(direction)) {
      return NextResponse.json(
        { error: "Se requiere tournament_id y direction (up/down)" },
        { status: 400 }
      );
    }

    // Get current tournament's sort_order
    const { data: current } = await supabase
      .from("tournaments")
      .select("id, sort_order")
      .eq("id", tournament_id)
      .single();

    if (!current) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    // Find the adjacent tournament to swap with
    let adjacent;
    if (direction === "up") {
      // Find the tournament just above (lower sort_order)
      const { data } = await supabase
        .from("tournaments")
        .select("id, sort_order")
        .lt("sort_order", current.sort_order)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();
      adjacent = data;
    } else {
      // Find the tournament just below (higher sort_order)
      const { data } = await supabase
        .from("tournaments")
        .select("id, sort_order")
        .gt("sort_order", current.sort_order)
        .order("sort_order", { ascending: true })
        .limit(1)
        .single();
      adjacent = data;
    }

    if (!adjacent) {
      return NextResponse.json({ message: "Ya esta en el limite" });
    }

    // Swap sort_orders
    const { error: err1 } = await supabase
      .from("tournaments")
      .update({ sort_order: adjacent.sort_order })
      .eq("id", current.id);

    if (err1) {
      return NextResponse.json({ error: err1.message }, { status: 500 });
    }

    const { error: err2 } = await supabase
      .from("tournaments")
      .update({ sort_order: current.sort_order })
      .eq("id", adjacent.id);

    if (err2) {
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/tournaments/reorder error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
