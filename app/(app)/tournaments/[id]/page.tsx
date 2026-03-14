import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  UserPlus,
  Medal,
  Star,
} from "lucide-react";
import BracketView from "@/app/(app)/tournaments/_components/bracket-view";
import ParticipantsList from "@/app/(app)/tournaments/_components/participants-list";

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  swiss: "Suizo",
  single_elimination: "Eliminacion directa",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  registration: {
    label: "INSCRIPCION ABIERTA",
    className: "bg-omega-blue/10 border-omega-blue/30 text-omega-blue",
    icon: <Users className="size-3.5" />,
  },
  in_progress: {
    label: "EN CURSO",
    className: "bg-omega-gold/10 border-omega-gold/30 text-omega-gold",
    icon: <Clock className="size-3.5" />,
  },
  completed: {
    label: "FINALIZADO",
    className: "bg-omega-green/10 border-omega-green/30 text-omega-green",
    icon: <CheckCircle className="size-3.5" />,
  },
  cancelled: {
    label: "CANCELADO",
    className: "bg-omega-red/10 border-omega-red/30 text-omega-red",
    icon: <XCircle className="size-3.5" />,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch tournament + participants + matches + points in parallel
  const [tournamentResult, participantsResult, matchesResult, pointsResult] =
    await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase
        .from("tournament_participants")
        .select(
          "id, seed, points, tournament_wins, tournament_losses, is_eliminated, player:players!player_id(id, alias, avatar_url, stars)"
        )
        .eq("tournament_id", id)
        .order("seed", { ascending: true }),
      supabase
        .from("tournament_matches")
        .select(
          "id, round, match_order, player1_id, player2_id, winner_id, player1_score, player2_score, status, bracket_position, next_match_id, judge_id, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias), judge:players!judge_id(alias)"
        )
        .eq("tournament_id", id)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true }),
      supabase
        .from("tournament_points")
        .select("player_id, points, position, player:players!player_id(alias, avatar_url)")
        .eq("tournament_id", id)
        .order("position", { ascending: true }),
    ]);

  const tournament = tournamentResult.data;
  if (!tournament) {
    notFound();
  }

  const participants = (participantsResult.data ?? []).map((p) => ({
    ...p,
    player: p.player as unknown as {
      id: string;
      alias: string;
      avatar_url: string | null;
      stars: number;
    },
  }));

  const matches = (matchesResult.data ?? []).map((m) => ({
    ...m,
    player1: m.player1 as unknown as { alias: string } | null,
    player2: m.player2 as unknown as { alias: string } | null,
    winner: m.winner as unknown as { alias: string } | null,
    judge: m.judge as unknown as { alias: string } | null,
  }));

  const tournamentPoints = (pointsResult.data ?? []).map((tp) => ({
    ...tp,
    player: tp.player as unknown as {
      alias: string;
      avatar_url: string | null;
    },
  }));

  const status = STATUS_CONFIG[tournament.status];
  const isRoundBased =
    tournament.format === "round_robin" || tournament.format === "swiss";

  // Check if current user is already registered
  const isRegistered = user
    ? participants.some((p) => p.player.id === user.id)
    : false;

  // Determine podium (1st, 2nd, 3rd) for completed tournaments
  let podium: { position: number; alias: string; avatar_url: string | null; playerId: string }[] = [];
  if (tournament.status === "completed") {
    if (tournament.format === "single_elimination") {
      // 1st: winner of final, 2nd: loser of final, 3rd: losers of semis
      const finalMatch = matches.find((m) => m.bracket_position === "F");
      if (finalMatch?.winner_id) {
        const winnerId = finalMatch.winner_id;
        const loserId = finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id;

        const winnerP = participants.find((p) => p.player.id === winnerId);
        if (winnerP) {
          podium.push({ position: 1, alias: winnerP.player.alias, avatar_url: winnerP.player.avatar_url, playerId: winnerP.player.id });
        }

        if (loserId) {
          const loserP = participants.find((p) => p.player.id === loserId);
          if (loserP) {
            podium.push({ position: 2, alias: loserP.player.alias, avatar_url: loserP.player.avatar_url, playerId: loserP.player.id });
          }
        }

        // Semi-final losers = 3rd place
        const semiMatches = matches.filter((m) => m.bracket_position?.startsWith("SF"));
        for (const sm of semiMatches) {
          if (sm.winner_id && sm.status === "completed") {
            const semiLoserId = sm.player1_id === sm.winner_id ? sm.player2_id : sm.player1_id;
            if (semiLoserId && semiLoserId !== winnerId && semiLoserId !== loserId) {
              const semiLoserP = participants.find((p) => p.player.id === semiLoserId);
              if (semiLoserP) {
                podium.push({ position: 3, alias: semiLoserP.player.alias, avatar_url: semiLoserP.player.avatar_url, playerId: semiLoserP.player.id });
              }
            }
          }
        }
      }
    } else {
      // Round robin / Swiss: sorted by points
      const sorted = [...participants].sort((a, b) => b.points - a.points);
      for (let i = 0; i < Math.min(3, sorted.length); i++) {
        podium.push({
          position: i + 1,
          alias: sorted[i].player.alias,
          avatar_url: sorted[i].player.avatar_url,
          playerId: sorted[i].player.id,
        });
      }
    }
  }

  const isFull = participants.length >= tournament.max_participants;

  const podiumColors = {
    1: {
      border: "border-omega-gold/50",
      bg: "bg-gradient-to-b from-omega-gold/15 to-omega-card/60",
      text: "neon-gold",
      label: "1er Lugar",
      avatarBorder: "border-omega-gold",
      icon: <Crown className="size-6 text-omega-gold fill-omega-gold/30" />,
    },
    2: {
      border: "border-omega-muted/40",
      bg: "bg-gradient-to-b from-omega-muted/10 to-omega-card/60",
      text: "text-omega-muted",
      label: "2do Lugar",
      avatarBorder: "border-omega-muted/50",
      icon: <Medal className="size-5 text-omega-muted/70" />,
    },
    3: {
      border: "border-orange-700/40",
      bg: "bg-gradient-to-b from-orange-900/10 to-omega-card/60",
      text: "text-orange-500",
      label: "3er Lugar",
      avatarBorder: "border-orange-500/50",
      icon: <Medal className="size-5 text-orange-500/70" />,
    },
  } as const;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
      >
        <ArrowLeft className="size-4" />
        Torneos
      </Link>

      {/* Tournament header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-omega-gold/20 via-omega-card/60 to-omega-purple/10 p-5 shadow-lg shadow-omega-gold/10">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-omega-gold via-omega-purple to-omega-blue" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-omega-text">
              {tournament.name}
            </h1>
            <p className="text-[11px] text-omega-muted uppercase tracking-wider font-medium mt-0.5">
              {FORMAT_LABELS[tournament.format]}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold shrink-0 ${status.className}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {tournament.description && (
          <p className="text-xs text-omega-muted/80 mb-3">
            {tournament.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-omega-border/30">
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="size-3.5 text-omega-purple" />
            <span className="font-bold text-omega-text">
              {participants.length}
            </span>
            <span className="text-omega-muted">
              / {tournament.max_participants}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-omega-muted">
            <Calendar className="size-3.5" />
            {new Date(tournament.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
          {tournament.status === "in_progress" && (
            <div className="flex items-center gap-1.5 text-xs ml-auto">
              <Trophy className="size-3.5 text-omega-gold" />
              <span className="font-bold text-omega-gold">
                Ronda {tournament.current_round}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Podium — completed tournaments */}
      {tournament.status === "completed" && podium.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-omega-gold/10 via-omega-card/40 to-omega-gold/10 border border-omega-gold/20 p-5 space-y-4 shadow-lg shadow-omega-gold/5">
          <h2 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center justify-center gap-2">
            <Trophy className="size-4 text-omega-gold" />
            Resultados Finales
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {/* Show 2nd, 1st, 3rd for visual podium */}
            {[
              podium.find((p) => p.position === 2),
              podium.find((p) => p.position === 1),
              podium.filter((p) => p.position === 3)[0],
            ].map((entry, visualIndex) => {
              if (!entry) return <div key={visualIndex} />;
              const config = podiumColors[entry.position as 1 | 2 | 3];
              return (
                <Link
                  key={entry.playerId}
                  href={`/player/${entry.playerId}`}
                  className={`${
                    visualIndex === 1 ? "-mt-2" : "mt-4"
                  } block rounded-2xl border ${config.border} ${config.bg} p-4 text-center space-y-2 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex justify-center">{config.icon}</div>
                  <div
                    className={`size-12 rounded-full border-2 ${config.avatarBorder} overflow-hidden bg-omega-dark mx-auto`}
                  >
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">
                        {entry.alias.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-sm font-black truncate ${config.text}`}
                  >
                    {entry.alias}
                  </p>
                  <p className="text-[10px] text-omega-muted font-bold">
                    {config.label}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* 3rd place ties (if multiple) */}
          {podium.filter((p) => p.position === 3).length > 1 && (
            <div className="flex items-center justify-center gap-2 text-xs text-omega-muted">
              <Medal className="size-3.5 text-orange-500" />
              <span>
                3er lugar compartido:{" "}
                {podium
                  .filter((p) => p.position === 3)
                  .map((p) => p.alias)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Points awarded — from tournament_points table */}
      {tournament.status === "completed" && tournamentPoints.length > 0 && (
        <div className="rounded-2xl border border-omega-border/40 bg-omega-card/40 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-omega-border/40 bg-omega-card/60">
            <h3 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
              <Star className="size-4 text-omega-gold fill-omega-gold" />
              Puntos Otorgados
            </h3>
          </div>
          <div className="divide-y divide-omega-border/20">
            {tournamentPoints.map((tp, index) => (
              <div
                key={tp.player_id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="text-sm font-black text-omega-muted/60 w-6 text-center shrink-0">
                  {tp.position ? `#${tp.position}` : index + 1}
                </span>
                <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                  {tp.player.avatar_url ? (
                    <img
                      src={tp.player.avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                      {tp.player.alias.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-omega-text flex-1 truncate">
                  {tp.player.alias}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-black text-omega-gold">
                    {tp.points}
                  </span>
                  <span className="text-[10px] text-omega-muted">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register button — only for registration phase */}
      {tournament.status === "registration" && (
        <div className="space-y-2">
          {isRegistered ? (
            <div className="rounded-xl bg-omega-green/10 border border-omega-green/30 px-4 py-3 text-center">
              <p className="text-sm font-bold text-omega-green flex items-center justify-center gap-2">
                <CheckCircle className="size-4" />
                Ya estas inscripto en este torneo
              </p>
            </div>
          ) : isFull ? (
            <div className="rounded-xl bg-omega-red/10 border border-omega-red/30 px-4 py-3 text-center">
              <p className="text-sm font-bold text-omega-red">
                El torneo esta lleno
              </p>
            </div>
          ) : (
            <Link
              href={`/tournaments/${tournament.id}/register`}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-3 font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="size-5" />
              {user ? "Inscribirme" : "Registrarme e inscribirme"}
            </Link>
          )}
        </div>
      )}

      {/* Bracket / matches */}
      {matches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="size-4 text-omega-gold" />
            {tournament.format === "single_elimination"
              ? "Bracket"
              : "Rondas"}
          </h2>
          <BracketView
            matches={matches}
            format={
              tournament.format as
                | "single_elimination"
                | "round_robin"
                | "swiss"
            }
            currentRound={tournament.current_round}
          />
        </div>
      )}

      {/* Participants */}
      <ParticipantsList
        participants={participants}
        showSeeds={tournament.format === "single_elimination"}
        showPoints={isRoundBased}
      />
    </div>
  );
}
