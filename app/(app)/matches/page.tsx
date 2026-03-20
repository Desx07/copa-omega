import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Swords, ArrowLeft, Star, Trophy } from "lucide-react";
import MatchesClient from "@/app/(app)/admin/matches/_components/matches-client";
import type { MatchData } from "@/app/(app)/admin/matches/_components/matches-client";

export default async function PublicMatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all matches with player aliases — pending + in_progress fully, completed last 50
  const [pendingResult, completedResult] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, status, stars_bet, created_at, completed_at, tournament_id, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
      )
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select(
        "id, status, stars_bet, created_at, completed_at, tournament_id, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
      )
      .in("status", ["completed", "cancelled"])
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  const pendingMatches = (pendingResult.data ?? []) as unknown as MatchData[];
  const completedMatches = (completedResult.data ?? []) as unknown as MatchData[];
  const allMatches = [...pendingMatches, ...completedMatches];

  const pendingCount = pendingMatches.filter((m) => m.status === "pending" || m.status === "in_progress").length;
  const completedCount = completedMatches.filter((m) => m.status === "completed").length;

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
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-omega-blue/20 flex items-center justify-center">
              <Swords className="size-5 text-omega-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-black neon-blue">PARTIDAS</h1>
              <p className="text-xs text-omega-muted">Todas las batallas</p>
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
            <p className="text-xl font-black text-omega-gold">{pendingCount}</p>
            <p className="text-[11px] text-omega-muted">pendientes</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-omega-green/15 to-omega-green/5 p-4 text-center shadow-sm border border-omega-green/20">
            <Trophy className="size-4 text-omega-green mx-auto mb-1" />
            <p className="text-xl font-black text-omega-green">{completedCount}</p>
            <p className="text-[11px] text-omega-muted">completadas</p>
          </div>
        </div>

        {/* Collapsible sections with search — public mode, no links */}
        <MatchesClient
          matches={allMatches}
          mode="public"
          linkPrefix="/matches"
        />
      </div>
    </div>
  );
}
