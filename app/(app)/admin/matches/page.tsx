import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Swords, Trophy, Plus, ArrowLeft } from "lucide-react";
import MatchesClient from "./_components/matches-client";
import type { MatchData } from "./_components/matches-client";

export default async function AdminMatchesPage() {
  const supabase = await createClient();

  // Verificar autenticacion
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verificar admin/juez + obtener partidas en paralelo (queries independientes)
  const [profileResult, matchesResult] = await Promise.all([
    supabase.from("players").select("is_admin, is_judge").eq("id", user.id).single(),
    supabase
      .from("matches")
      .select(
        "*, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
      )
      .order("created_at", { ascending: false }),
  ]);

  const { data: profile } = profileResult;
  const { data: matches } = matchesResult;

  if (!profile?.is_admin && !profile?.is_judge) {
    redirect("/dashboard");
  }

  const allMatches = (matches ?? []) as MatchData[];
  const pendingMatches = allMatches.filter((m) => m.status === "pending");
  const completedMatches = allMatches.filter((m) => m.status === "completed");

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Hero banner */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-blue/20 via-omega-purple/10 to-omega-dark shadow-lg shadow-omega-blue/10 mb-6">
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
              <div className="size-10 rounded-xl bg-omega-blue/20 flex items-center justify-center">
                <Swords className="size-5 text-omega-blue" />
              </div>
              <h1 className="text-2xl font-black neon-blue">PARTIDAS</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/players"
                className="omega-btn omega-btn-secondary px-3 py-1.5 text-xs"
              >
                Jugadores
              </Link>
              <Link
                href="/admin/matches/new"
                className="omega-btn omega-btn-primary px-4 py-2.5 text-sm"
              >
                <Plus className="size-4" />
                Nueva
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-omega-blue/15 to-omega-blue/5 p-4 text-center shadow-sm border border-omega-blue/20">
            <Swords className="size-4 text-omega-blue mx-auto mb-1" />
            <p className="text-xl font-black text-omega-blue">{allMatches.length}</p>
            <p className="text-[11px] text-omega-muted">total</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-gold/15 to-omega-gold/5 p-4 text-center shadow-sm border border-omega-gold/20">
            <Star className="size-4 text-omega-gold mx-auto mb-1" />
            <p className="text-xl font-black text-omega-gold">{pendingMatches.length}</p>
            <p className="text-[11px] text-omega-muted">pendientes</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-green/15 to-omega-green/5 p-4 text-center shadow-sm border border-omega-green/20">
            <Trophy className="size-4 text-omega-green mx-auto mb-1" />
            <p className="text-xl font-black text-omega-green">{completedMatches.length}</p>
            <p className="text-[11px] text-omega-muted">completadas</p>
          </div>
        </div>

        {/* Collapsible sections with search */}
        <MatchesClient
          matches={allMatches}
          mode="admin"
          linkPrefix="/admin/matches"
          isAdmin
        />
      </div>
    </div>
  );
}
