import Link from "next/link";
import { Star, Trophy, Swords, ArrowLeft, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RankingTabs } from "./_components/ranking-tabs";
import TournamentCountdown from "@/app/_components/tournament-countdown";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [playersResult, matchesResult, standardPointsResult, jrPointsResult, nextTournamentResult, liveTournamentResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, alias, full_name, stars, wins, losses, is_eliminated, avatar_url")
      .eq("is_hidden", false)
      .or("wins.gt.0,losses.gt.0")
      .order("stars", { ascending: false })
      .order("wins", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("matches")
      .select("id, player1_id, player2_id, winner_id, stars_bet, completed_at, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(50),
    // Puntos de torneos standard
    supabase
      .from("tournament_points")
      .select("player_id, points, player:players!player_id(alias, avatar_url), tournaments!inner(category)")
      .eq("tournaments.category", "standard"),
    // Puntos de torneos JR
    supabase
      .from("tournament_points")
      .select("player_id, points, player:players!player_id(alias, avatar_url), tournaments!inner(category)")
      .eq("tournaments.category", "jr"),
    // Next upcoming tournament (registration with future event_date)
    supabase
      .from("tournaments")
      .select("id, name, event_date, status, format, max_participants, participant_count:tournament_participants(count)")
      .eq("status", "registration")
      .not("event_date", "is", null)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Active in-progress tournament
    supabase
      .from("tournaments")
      .select("id, name, event_date, status, format, max_participants, participant_count:tournament_participants(count)")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const players = playersResult.data;
  const { data: recentMatches } = matchesResult;
  const rawStandardPoints = standardPointsResult.data ?? [];
  const rawJrPoints = jrPointsResult.data ?? [];

  const leaderboard = players ?? [];
  const matches = recentMatches ?? [];

  // Función para agregar puntos por jugador
  function aggregatePoints(rawPoints: typeof rawStandardPoints) {
    const pointsMap = new Map<string, { alias: string; avatar_url: string | null; total: number }>();
    for (const tp of rawPoints) {
      const player = tp.player as unknown as { alias: string; avatar_url: string | null };
      if (!player) continue;
      const existing = pointsMap.get(tp.player_id);
      if (existing) {
        existing.total += tp.points;
      } else {
        pointsMap.set(tp.player_id, {
          alias: player.alias,
          avatar_url: player.avatar_url,
          total: tp.points,
        });
      }
    }
    return [...pointsMap.entries()]
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }

  const standardRanking = aggregatePoints(rawStandardPoints);
  const jrRanking = aggregatePoints(rawJrPoints);
  // Para el stat counter del hero, usamos el total combinado
  const totalTournamentPlayers = new Set([
    ...standardRanking.map((e) => e.id),
    ...jrRanking.map((e) => e.id),
  ]).size;

  // Calculate current win streaks for all players
  const streaks: Record<string, number> = {};
  if (matches.length > 0) {
    const { data: allCompleted } = await supabase
      .from("matches")
      .select("player1_id, player2_id, winner_id, completed_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (allCompleted) {
      for (const player of leaderboard) {
        let streak = 0;
        for (const m of allCompleted) {
          if (m.player1_id !== player.id && m.player2_id !== player.id) continue;
          if (m.winner_id === player.id) {
            streak++;
          } else {
            break;
          }
        }
        if (streak >= 2) streaks[player.id] = streak;
      }
    }
  }

  // Next tournament: in_progress takes priority over registration
  const rawLive = liveTournamentResult.data;
  const rawNext = nextTournamentResult.data;
  const rawTournament = rawLive ?? rawNext;
  const nextTournament = rawTournament && rawTournament.event_date
    ? {
        ...rawTournament,
        participant_count:
          Array.isArray(rawTournament.participant_count) && rawTournament.participant_count.length > 0
            ? (rawTournament.participant_count[0] as { count: number }).count
            : 0,
      }
    : null;

  // Serialize matches for client component (strip Supabase relation wrappers)
  const serializedMatches = matches.map((m) => ({
    id: m.id,
    player1_id: m.player1_id,
    player2_id: m.player2_id,
    winner_id: m.winner_id,
    stars_bet: m.stars_bet,
    completed_at: m.completed_at,
    player1: m.player1 as unknown as { alias: string } | null,
    player2: m.player2 as unknown as { alias: string } | null,
    winner: m.winner as unknown as { alias: string } | null,
  }));

  return (
    <div className="mx-auto max-w-3xl pb-10 space-y-5">
      {/* ═══ HERO BANNER ═══ */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-surface to-omega-purple/15 px-6 pt-8 pb-10 shadow-lg shadow-omega-gold/40">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-omega-gold/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-omega-purple/15 rounded-full blur-[60px] pointer-events-none" />

        {/* Back button */}
        <div className="relative mb-5">
          {user ? (
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
          ) : (
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors">
              <ArrowLeft className="size-4" />
              Inicio
            </Link>
          )}
        </div>

        {/* Title */}
        <div className="relative text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight neon-gold">RANKING</h1>
          <p className="text-sm text-omega-muted">Copa Omega Star — Bladers Santa Fe</p>
        </div>

        {/* Stats strip inside hero */}
        <div className="relative flex items-center justify-around rounded-xl bg-omega-dark/60 border border-white/[0.06] py-2.5 px-2 mt-6">
          <div className="flex items-center gap-1.5 text-sm">
            <Trophy className="size-3.5 text-omega-gold" />
            <span className="font-bold text-omega-gold">{leaderboard.length}</span>
            <span className="text-omega-muted text-xs">bladers</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-sm">
            <Swords className="size-3.5 text-omega-blue" />
            <span className="font-bold text-omega-blue">{matches.length}</span>
            <span className="text-omega-muted text-xs">partidas recientes</span>
          </div>
          {totalTournamentPlayers > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5 text-sm">
                <Medal className="size-3.5 text-omega-purple" />
                <span className="font-bold text-omega-purple">{totalTournamentPlayers}</span>
                <span className="text-omega-muted text-xs">en torneos</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ NEXT TOURNAMENT COUNTDOWN ═══ */}
      {nextTournament && (
        <div className="px-4">
          <TournamentCountdown tournament={nextTournament} />
        </div>
      )}

      {/* ═══ TABS + CONTENT (client component) ═══ */}
      <RankingTabs
        leaderboard={leaderboard}
        streaks={streaks}
        standardRanking={standardRanking}
        jrRanking={jrRanking}
        matches={serializedMatches}
      />
    </div>
  );
}
