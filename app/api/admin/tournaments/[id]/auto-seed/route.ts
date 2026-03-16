import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!admin?.is_admin) {
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );
    }

    const { id: tournamentId } = await context.params;

    // Get tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, status")
      .eq("id", tournamentId)
      .single();

    if (!tournament || tournament.status !== "registration") {
      return NextResponse.json(
        { error: "Torneo no esta en fase de registro" },
        { status: 400 }
      );
    }

    // Get participants with their player stats
    const { data: participants, error: pErr } = await supabase
      .from("tournament_participants")
      .select("id, player_id, players(stars, wins, losses)")
      .eq("tournament_id", tournamentId);

    if (pErr || !participants || participants.length < 2) {
      return NextResponse.json(
        { error: "No hay suficientes participantes" },
        { status: 400 }
      );
    }

    // Fetch accumulated tournament points for each participant
    const playerIds = participants.map((p) => p.player_id);
    const { data: tpData } = await supabase
      .from("tournament_points")
      .select("player_id, points")
      .in("player_id", playerIds);

    const tpMap = new Map<string, number>();
    for (const tp of tpData ?? []) {
      tpMap.set(tp.player_id, (tpMap.get(tp.player_id) ?? 0) + tp.points);
    }

    // Calculate composite score for each participant
    // Score = stars * 2 + wins * 3 - losses + tournament_points_total
    const scored = participants
      .map((p) => {
        const player = p.players as unknown as {
          stars: number;
          wins: number;
          losses: number;
        } | null;
        const stars = player?.stars ?? 0;
        const wins = player?.wins ?? 0;
        const losses = player?.losses ?? 0;
        const tournamentPts = tpMap.get(p.player_id) ?? 0;
        const score = stars * 2 + wins * 3 - losses + tournamentPts;
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score);

    // Assign seeds (1 = best player)
    for (let i = 0; i < scored.length; i++) {
      await supabase
        .from("tournament_participants")
        .update({ seed: i + 1 })
        .eq("id", scored[i].id);
    }

    return NextResponse.json({
      success: true,
      seeds: scored.map((p, i) => ({
        player_id: p.player_id,
        seed: i + 1,
        score: p.score,
      })),
    });
  } catch (err) {
    console.error("POST /api/admin/tournaments/[id]/auto-seed error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
