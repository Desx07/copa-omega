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

  // Fetch tournament + participants + matches in parallel
  const [tournamentResult, participantsResult, matchesResult] =
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
          "id, round, match_order, player1_id, player2_id, winner_id, player1_score, player2_score, status, bracket_position, next_match_id, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
        )
        .eq("tournament_id", id)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true }),
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
  }));

  const status = STATUS_CONFIG[tournament.status];
  const isRoundBased =
    tournament.format === "round_robin" || tournament.format === "swiss";

  // Check if current user is already registered
  const isRegistered = user
    ? participants.some((p) => p.player.id === user.id)
    : false;

  // Find the champion (winner of final match for elimination, or top points for others)
  let champion: { alias: string } | null = null;
  if (tournament.status === "completed") {
    if (tournament.format === "single_elimination") {
      // Winner of the final match
      const finalMatch = matches.find((m) => m.bracket_position === "F");
      if (finalMatch?.winner) {
        champion = finalMatch.winner;
      }
    } else {
      // Player with most points
      const topParticipant = [...participants].sort(
        (a, b) => b.points - a.points
      )[0];
      if (topParticipant) {
        champion = { alias: topParticipant.player.alias };
      }
    }
  }

  const isFull = participants.length >= tournament.max_participants;

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

      {/* Champion banner */}
      {champion && (
        <div className="rounded-2xl bg-gradient-to-r from-omega-gold/20 via-omega-gold/10 to-omega-gold/20 border border-omega-gold/30 p-5 text-center space-y-2 shadow-lg shadow-omega-gold/10">
          <Crown className="size-8 text-omega-gold mx-auto star-glow" />
          <p className="text-xs text-omega-muted uppercase tracking-widest font-bold">
            Campeon
          </p>
          <p className="text-2xl font-black neon-gold">{champion.alias}</p>
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
