import Link from "next/link";
import { Trophy, Users, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  format: "round_robin" | "swiss" | "single_elimination";
  max_participants: number;
  status: "registration" | "in_progress" | "completed" | "cancelled";
  current_round: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  participant_count?: number;
}

interface TournamentCardProps {
  tournament: Tournament;
  href?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  swiss: "Suizo",
  single_elimination: "Eliminación directa",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  registration: {
    label: "INSCRIPCIÓN",
    className: "bg-omega-blue/10 border-omega-blue/30 text-omega-blue",
    icon: <Users className="size-3" />,
  },
  in_progress: {
    label: "EN CURSO",
    className: "bg-omega-gold/10 border-omega-gold/30 text-omega-gold",
    icon: <Clock className="size-3" />,
  },
  completed: {
    label: "FINALIZADO",
    className: "bg-omega-green/10 border-omega-green/30 text-omega-green",
    icon: <CheckCircle className="size-3" />,
  },
  cancelled: {
    label: "CANCELADO",
    className: "bg-omega-red/10 border-omega-red/30 text-omega-red",
    icon: <XCircle className="size-3" />,
  },
};

export default function TournamentCard({ tournament, href }: TournamentCardProps) {
  const status = STATUS_CONFIG[tournament.status];
  const participantCount = tournament.participant_count ?? 0;
  const isFull = participantCount >= tournament.max_participants;
  const linkHref = href ?? `/tournaments/${tournament.id}`;

  return (
    <Link
      href={linkHref}
      className={`block rounded-2xl border bg-omega-card/40 backdrop-blur-sm p-5 transition-all hover:border-omega-blue/30 hover:shadow-md hover:shadow-omega-blue/5 active:scale-[0.99] ${
        tournament.status === "cancelled"
          ? "opacity-50 border-omega-border/30"
          : "border-omega-border/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Title + format */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-omega-text truncate">
            {tournament.name}
          </h3>
          <p className="text-[11px] text-omega-muted uppercase tracking-wider font-medium mt-0.5">
            {FORMAT_LABELS[tournament.format]}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${status.className}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Description */}
      {tournament.description && (
        <p className="text-xs text-omega-muted/80 line-clamp-2 mb-3">
          {tournament.description}
        </p>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-omega-border/30">
        {/* Participants */}
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="size-3.5 text-omega-purple" />
          <span className="font-bold text-omega-text">
            {participantCount}
          </span>
          <span className="text-omega-muted">
            / {tournament.max_participants}
          </span>
          {isFull && tournament.status === "registration" && (
            <span className="text-[9px] font-bold text-omega-red ml-1">LLENO</span>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-omega-muted">
          <Calendar className="size-3.5" />
          <span>
            {new Date(tournament.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Round info */}
        {tournament.status === "in_progress" && (
          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <Trophy className="size-3.5 text-omega-gold" />
            <span className="font-bold text-omega-gold">
              Ronda {tournament.current_round}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
