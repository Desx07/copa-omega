import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { characterFor } from "@/lib/ascenso-character";
import { getCapabilities, capabilityGate } from "@/lib/capabilities";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: matches, error } = await supabase
      .from("matches")
      .select(
        "*, player1:players!player1_id(id,alias,stars), player2:players!player2_id(id,alias,stars), winner:players!winner_id(id,alias)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(matches);
  } catch (err) {
    console.error("GET /api/matches error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

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
    const { player1_id, player2_id, stars_bet, mode, match_kind, points_awarded } = body;

    // Validar mode (opcional): sin mode o 'copa_omega' → flujo histórico intacto
    if (mode != null && mode !== "copa_omega" && mode !== "ascenso") {
      return Response.json(
        { error: "mode debe ser 'copa_omega' o 'ascenso'" },
        { status: 400 }
      );
    }

    // Gate de capacidades: blindar la creación en el backend según el modo (la
    // UI ya oculta el botón, pero el endpoint seguía creando partidas). El gate
    // se aplica en la rama correcta: ascenso con canPlayAscenso, copa/estrellas
    // con canPlayStars. NUNCA se cruza (ascenso jamás se bloquea por la copa).
    const caps = await getCapabilities(supabase);

    // ── MODO ASCENSO: peleas sin apuesta de estrellas ──
    if (mode === "ascenso") {
      const ascensoGate = capabilityGate(
        caps.canPlayAscenso,
        "El Torneo de Ascenso está desactivado"
      );
      if (ascensoGate) return ascensoGate;

      return createAscensoMatch(supabase, user.id, {
        player1_id,
        player2_id,
        match_kind,
        points_awarded,
      });
    }

    // ── MODO COPA OMEGA (sin mode o 'copa_omega'): apuesta estrellas ──
    const starsGate = capabilityGate(
      caps.canPlayStars,
      "La Copa Omega está desactivada"
    );
    if (starsGate) return starsGate;

    // match_kind y points_awarded solo aplican al modo ascenso
    if (match_kind != null || points_awarded != null) {
      return Response.json(
        { error: "match_kind y points_awarded solo aplican con mode='ascenso'" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!player1_id || !player2_id || stars_bet == null) {
      return Response.json(
        { error: "Faltan campos: player1_id, player2_id, stars_bet" },
        { status: 400 }
      );
    }

    // Validate stars_bet range (0 = amistoso, 1-5 = con estrellas)
    if (typeof stars_bet !== "number" || stars_bet < 0 || stars_bet > 5) {
      return Response.json(
        { error: "stars_bet debe ser entre 0 y 5" },
        { status: 400 }
      );
    }

    // Validate different players
    if (player1_id === player2_id) {
      return Response.json(
        { error: "Los jugadores deben ser diferentes" },
        { status: 400 }
      );
    }

    // Verify both players are active
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, alias, stars, is_eliminated")
      .in("id", [player1_id, player2_id]);

    if (playersError) {
      return Response.json({ error: playersError.message }, { status: 500 });
    }

    if (!players || players.length !== 2) {
      return Response.json(
        { error: "Uno o ambos jugadores no existen" },
        { status: 404 }
      );
    }

    const p1 = players.find((p) => p.id === player1_id);
    const p2 = players.find((p) => p.id === player2_id);

    if (p1?.is_eliminated || p2?.is_eliminated) {
      return Response.json(
        { error: "Uno o ambos jugadores están eliminados" },
        { status: 400 }
      );
    }

    // Solo verificar estrellas suficientes cuando se apuestan estrellas
    if (stars_bet > 0) {
      if ((p1?.stars ?? 0) < stars_bet) {
        return Response.json(
          { error: `${p1?.alias} no tiene suficientes estrellas (tiene ${p1?.stars})` },
          { status: 400 }
        );
      }

      if ((p2?.stars ?? 0) < stars_bet) {
        return Response.json(
          { error: `${p2?.alias} no tiene suficientes estrellas (tiene ${p2?.stars})` },
          { status: 400 }
        );
      }
    }

    // Create match
    const { data: match, error: insertError } = await supabase
      .from("matches")
      .insert({
        player1_id,
        player2_id,
        stars_bet,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json(match, { status: 201 });
  } catch (err) {
    console.error("POST /api/matches error:", err);
    return Response.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ── Modo Ascenso ──
// Crea una pelea de ascenso (sin apuesta de estrellas).
//  - kind 'normal': el juez asigna points_awarded (1..500) que suma el ganador a su ticket.
//  - kind 'ascension': combate de ascenso entre dos jugadores del mismo rango con
//    ticket lleno (validado contra ascenso_ranks). El ganador sube de rango.
type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

interface AscensoMatchInput {
  player1_id: unknown;
  player2_id: unknown;
  match_kind: unknown;
  points_awarded: unknown;
}

async function createAscensoMatch(
  supabase: ServerSupabase,
  createdBy: string,
  input: AscensoMatchInput
): Promise<Response> {
  const { player1_id, player2_id, match_kind, points_awarded } = input;

  // match_kind: default 'normal' si no viene
  const kind = match_kind ?? "normal";
  if (kind !== "normal" && kind !== "ascension") {
    return Response.json(
      { error: "match_kind debe ser 'normal' o 'ascension'" },
      { status: 400 }
    );
  }

  if (typeof player1_id !== "string" || typeof player2_id !== "string" || !player1_id || !player2_id) {
    return Response.json(
      { error: "Faltan campos: player1_id, player2_id" },
      { status: 400 }
    );
  }

  if (player1_id === player2_id) {
    return Response.json(
      { error: "Los jugadores deben ser diferentes" },
      { status: 400 }
    );
  }

  // Validar points_awarded según el tipo de pelea
  if (kind === "normal") {
    if (
      typeof points_awarded !== "number" ||
      !Number.isInteger(points_awarded) ||
      points_awarded < 1 ||
      points_awarded > 500
    ) {
      return Response.json(
        { error: "points_awarded es requerido y debe ser un entero entre 1 y 500" },
        { status: 400 }
      );
    }
  } else if (points_awarded != null) {
    return Response.json(
      { error: "points_awarded no aplica en un combate de ascenso (los puntos los define el rango)" },
      { status: 400 }
    );
  }

  // Verificar que ambos jugadores existan y estén activos. Incluimos
  // ascenso_enabled para validar la habilitación; si la columna no existe aún
  // (migración sin aplicar) reintentamos sin ella y dejamos que el RPC valide
  // tras migrar (tolerante: no bloqueamos por habilitación en ese caso).
  let players: Array<{
    id: string;
    alias: string;
    is_eliminated: boolean;
    rank_letter: string;
    ticket_points: number | null;
    ascenso_enabled?: boolean;
  }> | null = null;
  let ascensoEnabledKnown = true;

  {
    const withFlag = await supabase
      .from("players")
      .select("id, alias, is_eliminated, rank_letter, ticket_points, ascenso_enabled")
      .in("id", [player1_id, player2_id]);

    if (withFlag.error?.code === "42703") {
      // Columna inexistente: reintento sin ella, sin bloquear por habilitación.
      ascensoEnabledKnown = false;
      const fallback = await supabase
        .from("players")
        .select("id, alias, is_eliminated, rank_letter, ticket_points")
        .in("id", [player1_id, player2_id]);
      if (fallback.error) {
        return Response.json({ error: fallback.error.message }, { status: 500 });
      }
      players = fallback.data;
    } else if (withFlag.error) {
      return Response.json({ error: withFlag.error.message }, { status: 500 });
    } else {
      players = withFlag.data;
    }
  }

  if (!players || players.length !== 2) {
    return Response.json(
      { error: "Uno o ambos jugadores no existen" },
      { status: 404 }
    );
  }

  const p1 = players.find((p) => p.id === player1_id);
  const p2 = players.find((p) => p.id === player2_id);

  if (!p1 || !p2) {
    return Response.json(
      { error: "Uno o ambos jugadores no existen" },
      { status: 404 }
    );
  }

  if (p1.is_eliminated || p2.is_eliminated) {
    return Response.json(
      { error: "Uno o ambos jugadores están eliminados" },
      { status: 400 }
    );
  }

  // Ambos jugadores deben estar habilitados por el admin para el Torneo de
  // Ascenso. Si la columna no existe todavía, no bloqueamos acá: la valida el
  // RPC resolve_ascenso_match una vez aplicada la migración.
  if (ascensoEnabledKnown) {
    const noHabilitados = [p1, p2].filter((p) => p.ascenso_enabled !== true);
    if (noHabilitados.length > 0) {
      const nombres = noHabilitados.map((p) => p.alias).join(", ");
      return Response.json(
        {
          error: `Jugador no habilitado para el torneo de ascenso: ${nombres}. Habilitalo desde el panel de administración`,
        },
        { status: 400 }
      );
    }
  }

  // Validaciones extra para el combate de ascenso
  if (kind === "ascension") {
    if (p1.rank_letter !== p2.rank_letter) {
      return Response.json(
        {
          error: `Para un combate de ascenso ambos jugadores deben tener el mismo rango (${p1.alias}: ${p1.rank_letter ?? "?"}, ${p2.alias}: ${p2.rank_letter ?? "?"})`,
        },
        { status: 400 }
      );
    }

    if (p1.rank_letter === "S") {
      return Response.json(
        { error: "Los jugadores de rango S ya están en el rango máximo, no pueden ascender" },
        { status: 400 }
      );
    }

    // Buscar el objetivo de ticket del rango en ascenso_ranks
    const { data: rankRow, error: rankError } = await supabase
      .from("ascenso_ranks")
      .select("ticket_target")
      .eq("letter", p1.rank_letter)
      .single();

    if (rankError || !rankRow) {
      return Response.json(
        { error: `No se encontró configuración del rango ${p1.rank_letter}` },
        { status: 500 }
      );
    }

    const target: number = rankRow.ticket_target;
    for (const p of [p1, p2]) {
      const points = p.ticket_points ?? 0;
      if (points < target) {
        return Response.json(
          {
            error: `${p.alias} no tiene el ticket lleno (${points}/${target} puntos). No puede pelear el combate de ascenso`,
          },
          { status: 400 }
        );
      }
    }
  }

  // Crear la pelea: sin estrellas en juego (stars_bet 0)
  const { data: match, error: insertError } = await supabase
    .from("matches")
    .insert({
      player1_id,
      player2_id,
      stars_bet: 0,
      mode: "ascenso",
      match_kind: kind,
      points_awarded: kind === "normal" ? points_awarded : null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // ── Auto-publicar el versus en el carrusel del dashboard ──
  // Solo para combates de ascenso: la gente ve la pelea que viene. Tolerante:
  // si algo falla, se loguea y NO se rompe la creación del match.
  if (kind === "ascension") {
    await publishAscensoBannerToCarousel(createdBy, p1, p2);
  }

  return Response.json(match, { status: 201 });
}

// ── Carrusel automático (combate de ascenso) ──
// Genera la URL del banner de versus (/api/ascenso/banner) con los datos de
// ambos jugadores e inserta un carousel_item target='dashboard' con el service
// role (createAdminClient) para saltar la RLS de admin. Best-effort: cualquier
// error se loguea y no afecta la creación del combate.
async function publishAscensoBannerToCarousel(
  createdBy: string,
  p1: { id: string; alias: string; rank_letter: string },
  p2: { id: string; alias: string; rank_letter: string }
): Promise<void> {
  try {
    // Rango válido para el banner (regex /^[FEDCBAS]$/), sino "F".
    const rangoValido = /^[FEDCBAS]$/;
    const r1 = rangoValido.test(p1.rank_letter) ? p1.rank_letter : "F";
    const r2 = rangoValido.test(p2.rank_letter) ? p2.rank_letter : "F";
    // Personaje determinístico por id (igual que la página de ascenso).
    const c1 = characterFor(p1.id);
    const c2 = characterFor(p2.id);

    const params = new URLSearchParams({
      p1: p1.alias,
      p2: p2.alias,
      r1,
      r2,
      c1,
      c2,
    });
    // URL relativa: el endpoint sirve el PNG on-the-fly en el mismo origen,
    // así que sirve directo como src del <img> del carrusel.
    const bannerUrl = `/api/ascenso/banner?${params.toString()}`;

    const admin = createAdminClient();

    // sort_order = max actual + 1 dentro del target 'dashboard'.
    const { data: last } = await admin
      .from("carousel_items")
      .select("sort_order")
      .eq("target", "dashboard")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (last?.sort_order ?? 0) + 1;

    const { error: carouselError } = await admin.from("carousel_items").insert({
      type: "photo",
      url: bannerUrl,
      title: `Combate de ascenso: ${p1.alias} vs ${p2.alias}`,
      target: "dashboard",
      sort_order: nextOrder,
      is_active: true,
      created_by: createdBy,
    });

    if (carouselError) {
      console.error(
        "[carrusel] No se pudo publicar el banner del combate de ascenso:",
        carouselError.message
      );
    }
  } catch (err) {
    console.error("[carrusel] Error inesperado publicando el banner de ascenso:", err);
  }
}
