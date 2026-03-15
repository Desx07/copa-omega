import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import BracketView from "@/app/(app)/tournaments/_components/bracket-view";
import ParticipantsList from "@/app/(app)/tournaments/_components/participants-list";
import QrDisplay from "@/app/(app)/tournaments/_components/qr-display";
import TournamentAdminActions from "./_components/tournament-admin-actions";
import ManualRegister from "./_components/manual-register";
import EditTournament from "./_components/edit-tournament";
import TournamentMediaManager from "./_components/tournament-media-manager";

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  swiss: "Suizo",
  single_elimination: "Eliminacion directa",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  registration: {
    label: "INSCRIPCION ABIERTA",
    badgeClass: "omega-badge omega-badge-blue",
    icon: <Users className="size-3.5" />,
  },
  in_progress: {
    label: "EN CURSO",
    badgeClass: "omega-badge omega-badge-gold",
    icon: <Clock className="size-3.5" />,
  },
  completed: {
    label: "FINALIZADO",
    badgeClass: "omega-badge omega-badge-green",
    icon: <CheckCircle className="size-3.5" />,
  },
  cancelled: {
    label: "CANCELADO",
    badgeClass: "omega-badge omega-badge-red",
    icon: <XCircle className="size-3.5" />,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTournamentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profileResult, tournamentResult, participantsResult, matchesResult] =
    await Promise.all([
      supabase.from("players").select("is_admin").eq("id", user.id).single(),
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
          "id, round, match_order, player1_id, player2_id, winner_id, player1_score, player2_score, status, bracket_position, next_match_id, stage, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
        )
        .eq("tournament_id", id)
        .order("round", { ascending: true })
        .order("match_order", { ascending: true }),
    ]);

  if (!profileResult.data?.is_admin) {
    redirect("/dashboard");
  }

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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://copaomega.ar";
  const registerUrl = `${baseUrl}/tournaments/${tournament.id}/register`;

  const isRoundBased =
    tournament.format === "round_robin" || tournament.format === "swiss";

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-gold/10 mb-6">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/admin/tournaments"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Torneos
          </Link>

          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-omega-text">
                {tournament.name}
              </h1>
              <p className="text-[11px] text-omega-muted uppercase tracking-wider font-medium mt-0.5">
                {FORMAT_LABELS[tournament.format]}
              </p>
            </div>
            <span className={`${status.badgeClass} gap-1.5 shrink-0`}>
              {status.icon}
              {status.label}
            </span>
          </div>

          {tournament.description && (
            <p className="text-xs text-omega-muted/80 mb-3">
              {tournament.description}
            </p>
          )}

          {/* Stats row inside hero */}
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

      <div className="px-4 space-y-5">
        {/* Admin actions */}
        <TournamentAdminActions
          tournamentId={tournament.id}
          status={tournament.status}
          participantCount={participants.length}
          maxParticipants={tournament.max_participants}
          format={tournament.format}
        />

        {/* Edit tournament (registration phase only) */}
        <EditTournament
          tournamentId={tournament.id}
          currentName={tournament.name}
          currentDescription={tournament.description}
          currentMaxParticipants={tournament.max_participants}
          currentLogoUrl={tournament.logo_url}
          participantCount={participants.length}
          status={tournament.status}
        />

        {/* Registration tools -- QR + manual add */}
        {tournament.status === "registration" && (
          <>
            <QrDisplay
              url={registerUrl}
              tournamentName={tournament.name}
              size={220}
            />
            <ManualRegister
              tournamentId={tournament.id}
              existingPlayerIds={participants.map((p: { player: { id: string } }) => p.player.id)}
            />
          </>
        )}

        {/* Bracket / matches */}
        {matches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-omega-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
                {tournament.format === "single_elimination"
                  ? "Bracket"
                  : "Rondas"}
              </span>
              <span className="omega-badge omega-badge-gold">{matches.length}</span>
            </div>
            <BracketView
              matches={matches}
              format={tournament.format as "single_elimination" | "round_robin" | "swiss"}
              currentRound={tournament.current_round}
              isAdmin
              tournamentId={tournament.id}
              stage={tournament.stage}
              participantCount={participants.length}
            />
          </div>
        )}

        {/* Participants list */}
        <ParticipantsList
          participants={participants}
          showSeeds={tournament.format === "single_elimination"}
          showPoints={isRoundBased}
        />

        {/* Media gallery management */}
        <TournamentMediaManager tournamentId={tournament.id} />

        {/* Link to public view */}
        <div className="text-center pt-2 space-y-1">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="text-xs text-omega-muted hover:text-omega-blue transition-colors block"
          >
            Ver pagina publica del torneo &rarr;
          </Link>
          <Link
            href={`/galeria/${tournament.id}`}
            className="text-xs text-omega-muted hover:text-omega-purple transition-colors block"
          >
            Ver galeria publica &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
