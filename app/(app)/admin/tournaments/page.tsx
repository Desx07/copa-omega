import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Plus, ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";
import TournamentCard from "@/app/(app)/tournaments/_components/tournament-card";

export default async function AdminTournamentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verify admin + fetch tournaments in parallel
  const [profileResult, tournamentsResult] = await Promise.all([
    supabase.from("players").select("is_admin").eq("id", user.id).single(),
    supabase
      .from("tournaments")
      .select("*, participant_count:tournament_participants(count)")
      .order("created_at", { ascending: false }),
  ]);

  if (!profileResult.data?.is_admin) {
    redirect("/dashboard");
  }

  const rawTournaments = tournamentsResult.data ?? [];

  // Normalize participant_count from Supabase aggregate
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
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4"
      >
        <ArrowLeft className="size-4" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-omega-gold" />
          <h1 className="text-2xl font-black neon-gold">TORNEOS</h1>
        </div>
        <Link
          href="/admin/tournaments/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Nuevo torneo
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Users className="size-4 text-omega-blue mx-auto mb-1" />
          <p className="text-xl font-black text-omega-blue">
            {registration.length}
          </p>
          <p className="text-[11px] text-omega-muted">inscripcion</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Clock className="size-4 text-omega-gold mx-auto mb-1" />
          <p className="text-xl font-black text-omega-gold">
            {inProgress.length}
          </p>
          <p className="text-[11px] text-omega-muted">en curso</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <CheckCircle className="size-4 text-omega-green mx-auto mb-1" />
          <p className="text-xl font-black text-omega-green">
            {completed.length}
          </p>
          <p className="text-[11px] text-omega-muted">completados</p>
        </div>
      </div>

      {/* Tournament list */}
      <div className="space-y-3">
        {tournaments.length === 0 ? (
          <div className="rounded-2xl bg-omega-card border border-omega-border p-8 text-center space-y-3">
            <Trophy className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-omega-muted text-sm">
              No hay torneos creados todavia
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
          tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              href={`/admin/tournaments/${tournament.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
