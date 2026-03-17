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
    .order("sort_order", { ascending: true });

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
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-b from-omega-purple/20 via-omega-surface to-omega-black rounded-b-3xl shadow-lg shadow-omega-purple/5 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative px-4 pt-6 pb-8 max-w-2xl mx-auto">
          <Link
            href={user ? "/dashboard" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            {user ? "Dashboard" : "Inicio"}
          </Link>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-omega-gold/15 ring-2 ring-omega-gold/30 mb-2">
              <Trophy className="size-7 text-omega-gold star-glow" />
            </div>
            <h1 className="text-3xl font-black tracking-tight neon-gold">
              TORNEOS
            </h1>
            <p className="text-sm text-omega-muted">
              Copa Omega Star -- Todos los torneos
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Active tournaments */}
        {active.length > 0 && (
          <section className="space-y-3">
            <div className="omega-section-header !bg-transparent !border-0 !px-1">
              <Clock className="size-4 text-omega-blue" />
              <span className="text-omega-blue">Torneos activos</span>
              <span className="omega-badge omega-badge-blue ml-auto">{active.length}</span>
            </div>
            <div className="space-y-3">
              {active.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </section>
        )}

        {/* Past tournaments */}
        {past.length > 0 && (
          <section className="space-y-3">
            <div className="omega-section-header !bg-transparent !border-0 !px-1">
              <Calendar className="size-4 text-omega-muted" />
              <span>Torneos anteriores</span>
              <span className="omega-badge omega-badge-purple ml-auto">{past.length}</span>
            </div>
            <div className="space-y-3">
              {past.map((tournament) => {
                const champion = championsMap.get(tournament.id);
                return (
                  <div key={tournament.id} className="space-y-0">
                    <TournamentCard tournament={tournament} />
                    {champion && (
                      <div className="omega-card !rounded-t-none !border-t-0 -mt-1 px-5 py-2 flex items-center gap-1.5 text-xs border-l-4 border-l-omega-green">
                        <Crown className="size-3.5 text-omega-gold" />
                        <span className="text-omega-gold font-bold">{champion}</span>
                        <span className="text-omega-muted text-[10px]">Campeón</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {tournaments.length === 0 && (
          <div className="omega-card p-12 text-center space-y-4">
            <Trophy className="size-16 text-omega-muted/30 mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-omega-muted">
                No hay torneos todavía
              </p>
              <p className="text-sm text-omega-muted/70">
                Los torneos aparecerán acá cuando un admin los cree.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
