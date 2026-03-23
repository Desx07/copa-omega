import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Plus, ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";
import TournamentCard from "@/app/(app)/tournaments/_components/tournament-card";
import ReorderButtons from "./_components/reorder-buttons";

export default async function AdminTournamentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profileResult, tournamentsResult] = await Promise.all([
    supabase.from("players").select("is_admin, is_judge").eq("id", user.id).single(),
    supabase
      .from("tournaments")
      .select("*, participant_count:tournament_participants(count)")
      .order("sort_order", { ascending: true }),
  ]);

  if (!profileResult.data?.is_admin && !profileResult.data?.is_judge) {
    redirect("/dashboard");
  }

  const rawTournaments = tournamentsResult.data ?? [];

  const tournaments = rawTournaments.map((t) => ({
    ...t,
    participant_count:
      Array.isArray(t.participant_count) && t.participant_count.length > 0
        ? (t.participant_count[0] as { count: number }).count
        : 0,
  }));

  const registration = tournaments.filter((t) => t.status === "registration");
  const inProgress = tournaments.filter((t) => t.status === "in_progress");
  const completed = tournaments.filter((t) => t.status === "completed");

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-gold/10 mb-6">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-purple transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-omega-gold/20 flex items-center justify-center">
                <Trophy className="size-5 text-omega-gold" />
              </div>
              <h1 className="text-2xl font-black neon-gold">TORNEOS</h1>
            </div>
            <Link
              href="/admin/tournaments/new"
              className="omega-btn omega-btn-primary px-4 py-2.5 text-sm"
            >
              <Plus className="size-4" />
              Nuevo torneo
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-omega-blue/15 to-omega-blue/5 p-4 text-center shadow-sm border border-omega-blue/20">
            <Users className="size-4 text-omega-blue mx-auto mb-1" />
            <p className="text-xl font-black text-omega-blue">
              {registration.length}
            </p>
            <p className="text-[11px] text-omega-muted">inscripcion</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-gold/15 to-omega-gold/5 p-4 text-center shadow-sm border border-omega-gold/20">
            <Clock className="size-4 text-omega-gold mx-auto mb-1" />
            <p className="text-xl font-black text-omega-gold">
              {inProgress.length}
            </p>
            <p className="text-[11px] text-omega-muted">en curso</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-green/15 to-omega-green/5 p-4 text-center shadow-sm border border-omega-green/20">
            <CheckCircle className="size-4 text-omega-green mx-auto mb-1" />
            <p className="text-xl font-black text-omega-green">
              {completed.length}
            </p>
            <p className="text-[11px] text-omega-muted">completados</p>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-omega-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-omega-text">Todos los torneos</span>
            <span className="omega-badge omega-badge-gold">{tournaments.length}</span>
          </div>
          <Link
            href="/admin/tournaments/new"
            className="text-xs text-omega-gold hover:text-omega-purple transition-colors font-medium"
          >
            + Nuevo
          </Link>
        </div>

        {/* Tournament list */}
        <div className="space-y-3">
          {tournaments.length === 0 ? (
            <div className="omega-card p-8 text-center space-y-3">
              <Trophy className="size-10 text-omega-muted/20 mx-auto" />
              <p className="text-omega-muted text-sm">
                No hay torneos creados todavía
              </p>
              <Link
                href="/admin/tournaments/new"
                className="inline-flex items-center gap-2 text-sm text-omega-blue hover:underline font-medium"
              >
                <Plus className="size-4" />
                Crear primer torneo
              </Link>
            </div>
          ) : (
            tournaments.map((tournament, index) => (
              <div key={tournament.id} className="flex items-center gap-2">
                <ReorderButtons
                  tournamentId={tournament.id}
                  isFirst={index === 0}
                  isLast={index === tournaments.length - 1}
                />
                <div className="flex-1 min-w-0">
                  <TournamentCard
                    tournament={tournament}
                    href={`/admin/tournaments/${tournament.id}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
