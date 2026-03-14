import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Trophy, ArrowLeft, Calendar, Clock } from "lucide-react";
import TournamentCard from "./_components/tournament-card";

export default async function TournamentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawTournaments } = await supabase
    .from("tournaments")
    .select("*, participant_count:tournament_participants(count)")
    .order("created_at", { ascending: false });

  const tournaments = (rawTournaments ?? []).map((t) => ({
    ...t,
    participant_count:
      Array.isArray(t.participant_count) && t.participant_count.length > 0
        ? (t.participant_count[0] as { count: number }).count
        : 0,
  }));

  const active = tournaments.filter(
    (t) => t.status === "registration" || t.status === "in_progress"
  );
  const past = tournaments.filter(
    (t) => t.status === "completed" || t.status === "cancelled"
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={user ? "/dashboard" : "/"}
        className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
      >
        <ArrowLeft className="size-4" />
        {user ? "Dashboard" : "Inicio"}
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-omega-gold/20 via-omega-card/60 to-omega-purple/10 p-5 shadow-lg shadow-omega-gold/10">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-omega-gold via-omega-purple to-omega-blue" />
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight neon-gold">
            TORNEOS
          </h1>
          <p className="text-sm text-omega-muted">
            Copa Omega Star -- Todos los torneos
          </p>
        </div>
      </div>

      {/* Active tournaments */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
            <Clock className="size-4 text-omega-blue" />
            Torneos activos
          </h2>
          {active.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      {/* Past tournaments */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="size-4 text-omega-muted" />
            Torneos anteriores
          </h2>
          {past.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {tournaments.length === 0 && (
        <div className="rounded-2xl border border-omega-border bg-omega-card/50 p-12 text-center space-y-4 backdrop-blur-sm">
          <Trophy className="size-16 text-omega-muted/30 mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-bold text-omega-muted">
              No hay torneos todavia
            </p>
            <p className="text-sm text-omega-muted/70">
              Los torneos apareceran aca cuando un admin los cree.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
