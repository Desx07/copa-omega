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
      .order("created_at", { ascending: false });

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

    // Check admin
    const { data: adminPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminPlayer?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, format, max_participants } = body;

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

    // Insert tournament (without qr_code first to get the id)
    const { data: tournament, error: insertError } = await supabase
      .from("tournaments")
      .insert({
        name,
        description: description || null,
        format,
        max_participants,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    // Generate QR code data (URL for registration)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
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
