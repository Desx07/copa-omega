import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/players/quick-create — Create a player without email/password (admin only)
// Used for tournament participants who don't have an account
export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { alias, full_name, tournament_id } = body;

    if (!alias || !alias.trim()) {
      return Response.json({ error: "El alias es obligatorio" }, { status: 400 });
    }

    const trimmedAlias = alias.trim();
    const trimmedName = full_name?.trim() || trimmedAlias;

    // Check if alias already exists
    const { data: existing } = await supabase
      .from("players")
      .select("id")
      .ilike("alias", trimmedAlias)
      .limit(1);

    if (existing && existing.length > 0) {
      // Player already exists — if tournament_id provided, register them
      if (tournament_id) {
        const { error: regError } = await supabase
          .from("tournament_participants")
          .insert({ tournament_id, player_id: existing[0].id });
        if (regError && regError.code !== "23505") {
          return Response.json({ error: regError.message }, { status: 500 });
        }
      }
      return Response.json({ id: existing[0].id, alias: trimmedAlias, already_existed: true });
    }

    // Create a dummy auth user with a random email (required by Supabase Auth)
    const adminClient = createAdminClient();
    const dummyEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@copaomega.local`;
    const dummyPassword = `Guest_${Math.random().toString(36).slice(2, 14)}!`;

    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: dummyEmail,
      password: dummyPassword,
      email_confirm: true,
      user_metadata: { full_name: trimmedName, alias: trimmedAlias },
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 500 });
    }

    // The trigger auto-creates the player row, but update alias/name to be safe
    await adminClient
      .from("players")
      .update({ alias: trimmedAlias, full_name: trimmedName })
      .eq("id", authUser.user.id);

    // If tournament_id provided, register to tournament
    if (tournament_id) {
      await adminClient
        .from("tournament_participants")
        .insert({ tournament_id, player_id: authUser.user.id });
    }

    return Response.json({
      id: authUser.user.id,
      alias: trimmedAlias,
      already_existed: false,
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/players/quick-create error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
