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
import { ImageIcon } from "lucide-react";
import BracketView from "@/app/(app)/tournaments/_components/bracket-view";
import ParticipantsList from "@/app/(app)/tournaments/_components/participants-list";

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  swiss: "Suizo",
  single_elimination: "Eliminacion directa",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode; gradient: string }
> = {
  registration: {
    label: "INSCRIPCION ABIERTA",
    badgeClass: "omega-badge omega-badge-blue",
    icon: <Users className="size-3.5" />,
    gradient: "from-omega-blue/20 via-omega-surface to-omega-black",
  },
  in_progress: {
    label: "EN CURSO",
    badgeClass: "omega-badge omega-badge-gold",
    icon: <Clock className="size-3.5" />,
    gradient: "from-omega-gold/15 via-omega-surface to-omega-black",
  },
  completed: {
    label: "FINALIZADO",
    badgeClass: "omega-badge omega-badge-green",
    icon: <CheckCircle className="size-3.5" />,
    gradient: "from-omega-green/15 via-omega-surface to-omega-black",
  },
  cancelled: {
    label: "CANCELADO",
    badgeClass: "omega-badge omega-badge-red",
    icon: <XCircle className="size-3.5" />,
    gradient: "from-omega-red/15 via-omega-surface to-omega-black",
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

  // Check if current user is a judge
  let isJudge = false;
  if (user) {
    const { data: profile } = await supabase
      .from("players")
      .select("is_judge")
      .eq("id", user.id)
      .single();
    isJudge = profile?.is_judge === true;
  }

  // Fetch tournament + participants + matches + points + media count in parallel
  const [tournamentResult, participantsResult, matchesResult, pointsResult, mediaCountResult] =
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
          "id, round, match_order, player1_id, player2_id, winner_id, player1_score, player2_score, status, bracket_position, next_match_id, judge_id, stage, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias), judge:players!judge_id(alias)"
        )
        .eq("tournament_id", id)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true }),
      supabase
        .from("tournament_points")
        .select("player_id, points, position, player:players!player_id(alias, avatar_url)")
        .eq("tournament_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("tournament_media")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", id),
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

  const mediaCount = mediaCountResult.count ?? 0;
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

        // 3rd place: use 3P match winner if exists, otherwise skip (no shared 3rd)
        const thirdPlaceMatch = matches.find((m) => m.bracket_position === "3P");
        if (thirdPlaceMatch?.winner_id) {
          const thirdP = participants.find((p) => p.player.id === thirdPlaceMatch.winner_id);
          if (thirdP) {
            podium.push({ position: 3, alias: thirdP.player.alias, avatar_url: thirdP.player.avatar_url, playerId: thirdP.player.id });
          }
        }
      }
    } else {
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
      aura: "aura-gold",
      text: "neon-gold",
      label: "1er Lugar",
      avatarBorder: "border-omega-gold",
      icon: <Crown className="size-6 text-omega-gold fill-omega-gold/30" />,
    },
    2: {
      aura: "aura-silver",
      text: "text-omega-muted",
      label: "2do Lugar",
      avatarBorder: "border-omega-muted/50",
      icon: <Medal className="size-5 text-omega-muted/70" />,
    },
    3: {
      aura: "aura-bronze",
      text: "text-orange-500",
      label: "3er Lugar",
      avatarBorder: "border-orange-500/50",
      icon: <Medal className="size-5 text-orange-500/70" />,
    },
  } as const;

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className={`relative bg-gradient-to-b ${status.gradient} rounded-b-3xl shadow-lg overflow-hidden`}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative px-4 pt-6 pb-8 max-w-2xl mx-auto">
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors mb-5"
          >
            <ArrowLeft className="size-4" />
            Torneos
          </Link>

          {/* Tournament header info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                {tournament.logo_url && (
                  <img
                    src={tournament.logo_url}
                    alt=""
                    className="size-12 rounded-xl object-cover border border-omega-border shadow-sm shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl font-black text-omega-text">
                    {tournament.name}
                  </h1>
                  <p className="text-[11px] text-omega-muted uppercase tracking-wider font-medium mt-0.5">
                    {FORMAT_LABELS[tournament.format]}
                  </p>
                </div>
              </div>
              <span className={`${status.badgeClass} gap-1.5 shrink-0`}>
                {status.icon}
                {status.label}
              </span>
            </div>

            {tournament.description && (
              <p className="text-xs text-omega-muted/80">
                {tournament.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 pt-3 border-t border-white/10">
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
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
        {/* Podium -- completed tournaments */}
        {tournament.status === "completed" && podium.length > 0 && (
          <section className="omega-card-elevated overflow-hidden">
            <div className="omega-section-header justify-center">
              <Trophy className="size-4 text-omega-gold" />
              Resultados Finales
            </div>

            <div className="grid grid-cols-3 gap-3 p-5">
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
                    } block omega-card ${config.aura} p-4 text-center space-y-2 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
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
              <div className="flex items-center justify-center gap-2 text-xs text-omega-muted pb-4">
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
          </section>
        )}

        {/* Points awarded -- from tournament_points table */}
        {tournament.status === "completed" && tournamentPoints.length > 0 && (
          <section className="omega-card shadow-sm">
            <div className="omega-section-header">
              <Star className="size-4 text-omega-gold fill-omega-gold" />
              Puntos Otorgados
            </div>
            <div>
              {tournamentPoints.map((tp, index) => (
                <div
                  key={tp.player_id}
                  className="omega-row border-l-4 border-l-transparent hover:border-l-omega-gold/50"
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
          </section>
        )}

        {/* Register button -- only for registration phase */}
        {tournament.status === "registration" && (
          <div className="space-y-2">
            {isRegistered ? (
              <div className="omega-card shadow-sm p-3 text-center border-l-4 border-l-omega-green">
                <p className="text-sm font-bold text-omega-green flex items-center justify-center gap-2">
                  <CheckCircle className="size-4" />
                  Ya estas inscripto en este torneo
                </p>
              </div>
            ) : isFull ? (
              <div className="omega-card shadow-sm p-3 text-center border-l-4 border-l-omega-red">
                <p className="text-sm font-bold text-omega-red">
                  El torneo está lleno
                </p>
              </div>
            ) : (
              <Link
                href={`/tournaments/${tournament.id}/register`}
                className="omega-btn omega-btn-primary w-full px-4 py-3 text-base shadow-lg shadow-omega-purple/20"
              >
                <UserPlus className="size-5" />
                {user ? "Inscribirme" : "Registrarme e inscribirme"}
              </Link>
            )}
          </div>
        )}

        {/* Bracket / matches */}
        {matches.length > 0 && (
          <section className="space-y-3">
            <div className="omega-section-header !bg-transparent !border-0 !px-1">
              <Trophy className="size-4 text-omega-gold" />
              {tournament.format === "single_elimination"
                ? "Bracket"
                : "Rondas"}
            </div>
            <BracketView
              matches={matches}
              format={
                tournament.format as
                  | "single_elimination"
                  | "round_robin"
                  | "swiss"
              }
              currentRound={tournament.current_round}
              isJudge={isJudge}
              currentUserId={user?.id}
              tournamentId={tournament.id}
              stage={tournament.stage}
              participantCount={participants.length}
            />
          </section>
        )}

        {/* Gallery link */}
        {mediaCount > 0 && (
          <Link
            href={`/galeria/${tournament.id}`}
            className="omega-btn omega-btn-secondary w-full px-4 py-3 text-sm shadow-sm hover:shadow-md"
          >
            <ImageIcon className="size-4" />
            Ver galeria ({mediaCount} {mediaCount === 1 ? "archivo" : "archivos"})
          </Link>
        )}

        {/* Participants */}
        <ParticipantsList
          participants={participants}
          showSeeds={tournament.format === "single_elimination"}
          showPoints={isRoundBased}
        />
      </div>
    </div>
  );
}
