import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Trophy, ArrowLeft, Calendar, Clock, Crown } from "lucide-react";
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

  // For completed tournaments, find the champion
  const championsMap = new Map<string, string>();
  for (const t of past) {
    if (t.status !== "completed") continue;

    if (t.format === "single_elimination") {
      const { data: finalMatch } = await supabase
        .from("tournament_matches")
        .select("winner:players!winner_id(alias)")
        .eq("tournament_id", t.id)
        .eq("bracket_position", "F")
        .single();

      if (finalMatch?.winner) {
        championsMap.set(
          t.id,
          (finalMatch.winner as unknown as { alias: string }).alias
        );
      }
    } else {
      const { data: topParticipant } = await supabase
        .from("tournament_participants")
        .select("player:players!player_id(alias)")
        .eq("tournament_id", t.id)
        .order("points", { ascending: false })
        .limit(1)
        .single();

      if (topParticipant?.player) {
        championsMap.set(
          t.id,
          (topParticipant.player as unknown as { alias: string }).alias
        );
      }
    }
  }

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
      <div className="omega-card-elevated p-5 relative">
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
          <div className="omega-section-header">
            <Clock className="size-4 text-omega-blue" />
            Torneos activos
          </div>
          {active.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      {/* Past tournaments */}
      {past.length > 0 && (
        <div className="space-y-3">
          <div className="omega-section-header">
            <Calendar className="size-4 text-omega-muted" />
            Torneos anteriores
          </div>
          {past.map((tournament) => {
            const champion = championsMap.get(tournament.id);
            return (
              <div key={tournament.id} className="relative">
                <TournamentCard tournament={tournament} />
                {champion && (
                  <div className="absolute top-3.5 right-20 flex items-center gap-1 text-[10px] text-omega-gold font-bold">
                    <Crown className="size-3 text-omega-gold" />
                    {champion}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {tournaments.length === 0 && (
        <div className="omega-card p-12 text-center space-y-4">
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
