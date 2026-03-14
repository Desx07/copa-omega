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

export default async function AdminTournamentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verify admin + fetch tournament data in parallel
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
          "id, round, match_order, player1_id, player2_id, winner_id, player1_score, player2_score, status, bracket_position, next_match_id, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
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

  // Build QR URL for registration
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://copaomega.ar";
  const registerUrl = `${baseUrl}/tournaments/${tournament.id}/register`;

  const isRoundBased =
    tournament.format === "round_robin" || tournament.format === "swiss";

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/admin/tournaments"
        className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
      >
        <ArrowLeft className="size-4" />
        Torneos
      </Link>

      {/* Tournament header card */}
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

      {/* Admin actions */}
      <TournamentAdminActions
        tournamentId={tournament.id}
        status={tournament.status}
        participantCount={participants.length}
        maxParticipants={tournament.max_participants}
        format={tournament.format}
      />

      {/* QR Code — show during registration */}
      {tournament.status === "registration" && (
        <QrDisplay
          url={registerUrl}
          tournamentName={tournament.name}
          size={220}
        />
      )}

      {/* Bracket / matches — show when tournament has started */}
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
            format={tournament.format as "single_elimination" | "round_robin" | "swiss"}
            currentRound={tournament.current_round}
          />
        </div>
      )}

      {/* Participants list */}
      <ParticipantsList
        participants={participants}
        showSeeds={tournament.format === "single_elimination"}
        showPoints={isRoundBased}
      />

      {/* Link to public view */}
      <div className="text-center pt-2">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="text-xs text-omega-muted hover:text-omega-blue transition-colors"
        >
          Ver pagina publica del torneo &rarr;
        </Link>
      </div>
    </div>
  );
}
