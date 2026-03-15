import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/tournaments/[id] — Tournament detail with participants and matches
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*, created_by_player:players!created_by(id, alias)")
      .eq("id", id)
      .single();

    if (tournamentError) {
      if (tournamentError.code === "PGRST116") {
        return Response.json(
          { error: "Torneo no encontrado" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: tournamentError.message },
        { status: 500 }
      );
    }

    // Fetch participants
    const { data: participants, error: participantsError } = await supabase
      .from("tournament_participants")
      .select("*, player:players!player_id(id, alias, stars)")
      .eq("tournament_id", id)
      .order("seed", { ascending: true, nullsFirst: false });

    if (participantsError) {
      return Response.json(
        { error: participantsError.message },
        { status: 500 }
      );
    }

    // Fetch matches
    const { data: matches, error: matchesError } = await supabase
      .from("tournament_matches")
      .select(
        "*, player1:players!player1_id(id, alias), player2:players!player2_id(id, alias), winner:players!winner_id(id, alias), judge:players!judge_id(id, alias)"
      )
      .eq("tournament_id", id)
      .order("round", { ascending: true })
      .order("match_order", { ascending: true });

    if (matchesError) {
      return Response.json({ error: matchesError.message }, { status: 500 });
    }

    return Response.json({
      ...tournament,
      participants: participants ?? [],
      matches: matches ?? [],
    });
  } catch (err) {
    console.error("GET /api/tournaments/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id] — Update tournament fields (admin only, registration phase)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Fetch tournament to check status
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id, status")
      .eq("id", id)
      .single();

    if (tournamentError) {
      if (tournamentError.code === "PGRST116") {
        return Response.json(
          { error: "Torneo no encontrado" },
          { status: 404 }
        );
      }
      return Response.json(
        { error: tournamentError.message },
        { status: 500 }
      );
    }

    if (tournament.status !== "registration") {
      return Response.json(
        { error: "Solo se puede editar un torneo en fase de inscripción" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const allowedFields: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return Response.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 }
        );
      }
      allowedFields.name = body.name.trim();
    }

    if (body.description !== undefined) {
      allowedFields.description = body.description;
    }

    if (body.logo_url !== undefined) {
      if (body.logo_url !== null && typeof body.logo_url !== "string") {
        return Response.json(
          { error: "logo_url debe ser un string o null" },
          { status: 400 }
        );
      }
      allowedFields.logo_url = body.logo_url;
    }

    if (body.max_participants !== undefined) {
      const max = Number(body.max_participants);
      if (!Number.isInteger(max) || max < 2 || max > 256) {
        return Response.json(
          { error: "max_participants debe ser un entero entre 2 y 256" },
          { status: 400 }
        );
      }

      // Check current participant count
      const { count } = await supabase
        .from("tournament_participants")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", id);

      if (count != null && max < count) {
        return Response.json(
          {
            error: `No se puede reducir a ${max} porque ya hay ${count} inscriptos`,
          },
          { status: 400 }
        );
      }

      allowedFields.max_participants = max;
    }

    if (Object.keys(allowedFields).length === 0) {
      return Response.json(
        { error: "No se enviaron campos para actualizar" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("tournaments")
      .update(allowedFields)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json(updated);
  } catch (err) {
    console.error("PATCH /api/tournaments/[id] error:", err);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] — Delete tournament (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return Response.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Use admin client to bypass RLS for cascade delete
    const adminClient = createAdminClient();

    // Delete tournament (cascades to participants, matches, points)
    const { error } = await adminClient
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tournaments/[id] error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
