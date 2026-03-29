import { createClient } from "@/lib/supabase/server";

// GET /api/tournaments — List all tournaments
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select(
        "*, created_by_player:players!created_by(id, alias), participant_count:tournament_participants(count)"
      )
      .order("sort_order", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Flatten the count from [{count: N}] to a number
    const result = (tournaments ?? []).map((t) => ({
      ...t,
      participant_count: t.participant_count?.[0]?.count ?? 0,
    }));

    return Response.json(result);
  } catch (err) {
    console.error("GET /api/tournaments error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/tournaments — Create tournament (admin only)
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

    // Check admin or judge
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin, is_judge")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin && !adminPlayer?.is_judge) {
      return Response.json({ error: "Solo administradores o jueces" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, format, category, max_participants, top_cut, swiss_rounds, logo_url } = body;

    // Validate required fields
    if (!name || !format || max_participants == null) {
      return Response.json(
        { error: "Faltan campos: name, format, max_participants" },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ["round_robin", "swiss", "single_elimination"];
    if (!validFormats.includes(format)) {
      return Response.json(
        {
          error: `Formato inválido. Debe ser uno de: ${validFormats.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ["standard", "jr"];
    if (category && !validCategories.includes(category)) {
      return Response.json(
        { error: `Categoria invalida. Debe ser: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate max_participants
    if (
      typeof max_participants !== "number" ||
      !Number.isInteger(max_participants) ||
      max_participants < 2
    ) {
      return Response.json(
        { error: "max_participants debe ser un entero >= 2" },
        { status: 400 }
      );
    }

    // Validate top_cut (optional, only for round_robin and swiss)
    if (top_cut != null) {
      const validTopCuts = [2, 4, 8, 16, 32, 64];
      if (!validTopCuts.includes(top_cut)) {
        return Response.json(
          { error: "top_cut debe ser una potencia de 2 (2, 4, 8, 16, 32, 64)" },
          { status: 400 }
        );
      }
      if (format === "single_elimination") {
        return Response.json(
          { error: "top_cut no aplica para single_elimination" },
          { status: 400 }
        );
      }
      if (top_cut >= max_participants) {
        return Response.json(
          { error: "top_cut debe ser menor que max_participants" },
          { status: 400 }
        );
      }
    }

    // Validate swiss_rounds (optional, only for swiss)
    if (swiss_rounds != null) {
      if (format !== "swiss") {
        return Response.json(
          { error: "swiss_rounds solo aplica para formato suizo" },
          { status: 400 }
        );
      }
      if (![2, 3, 4, 5, 6].includes(swiss_rounds)) {
        return Response.json(
          { error: "swiss_rounds debe ser entre 2 y 6" },
          { status: 400 }
        );
      }
    }

    // New tournaments go to the top: find the current minimum sort_order
    const { data: minRow } = await supabase
      .from("tournaments")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();
    const newSortOrder = minRow ? minRow.sort_order - 1 : 0;

    // Insert tournament (without qr_code first to get the id)
    const { data: tournament, error: insertError } = await supabase
      .from("tournaments")
      .insert({
        name,
        description: description || null,
        format,
        category: category || "standard",
        max_participants,
        top_cut: top_cut ?? null,
        swiss_rounds: format === "swiss" ? (swiss_rounds ?? null) : null,
        logo_url: logo_url || null,
        created_by: user.id,
        sort_order: newSortOrder,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Generate QR code data (URL for registration)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || "https://bladers-sf.vercel.app";
    const qrCode = `${baseUrl}/tournaments/${tournament.id}/register`;

    // Update with QR code data
    const { data: updated, error: updateError } = await supabase
      .from("tournaments")
      .update({ qr_code: qrCode })
      .eq("id", tournament.id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json(updated, { status: 201 });
  } catch (err) {
    console.error("POST /api/tournaments error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
