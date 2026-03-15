import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/polls
 * Body: { question: string, options: string[], expires_at?: string }
 * Admin-only: creates a new poll.
 */
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
    const { question, options, expires_at } = body;

    if (!question || typeof question !== "string") {
      return Response.json(
        { error: "Falta campo: question" },
        { status: 400 }
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return Response.json(
        { error: "Se necesitan al menos 2 opciones" },
        { status: 400 }
      );
    }

    if (options.length > 6) {
      return Response.json(
        { error: "Maximo 6 opciones" },
        { status: 400 }
      );
    }

    // Validate all options are non-empty strings
    for (const opt of options) {
      if (typeof opt !== "string" || opt.trim().length === 0) {
        return Response.json(
          { error: "Todas las opciones deben ser texto no vacio" },
          { status: 400 }
        );
      }
    }

    const { data: poll, error } = await supabase
      .from("polls")
      .insert({
        question,
        options,
        created_by: user.id,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(poll, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/polls error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
