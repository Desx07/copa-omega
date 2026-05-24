import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTournamentMode, isTournamentMode, type TournamentMode } from "@/lib/tournament-mode";
import { LandingShell } from "@/app/_components/landing/landing-shell";
import { LandingCopaOmega, type TopPlayer } from "@/app/_components/landing/landing-copa-omega";
import { LandingAscenso } from "@/app/_components/landing/landing-ascenso";
import { LandingLiga, type TopTeam } from "@/app/_components/landing/landing-liga";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 4000)
      ),
    ]);
    user = data?.user;
  } catch {
    // Supabase unavailable, show landing page
  }

  // En desarrollo, ?modo=ascenso|liga|copa_omega permite previsualizar la landing
  // sin tocar la DB (y sin que el redirect a /dashboard te saque si estás logueado).
  let previewMode: TournamentMode | null = null;
  if (process.env.NODE_ENV !== "production") {
    const preview = (await searchParams).modo;
    if (preview && isTournamentMode(preview)) {
      previewMode = preview;
    }
  }

  if (user && !previewMode) {
    redirect("/dashboard");
  }

  // Modalidad activa define qué landing se muestra.
  const mode: TournamentMode = previewMode ?? (await getTournamentMode(supabase));

  if (mode === "ascenso") {
    const [playersResult, matchesResult] = await Promise.all([
      supabase.from("players").select("id", { count: "exact", head: true }).eq("is_hidden", false),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "completed"),
    ]);
    return (
      <LandingShell>
        <LandingAscenso totalPlayers={playersResult.count ?? 0} totalMatches={matchesResult.count ?? 0} />
      </LandingShell>
    );
  }

  if (mode === "liga") {
    const [teamsResult, playersResult, topTeamsResult] = await Promise.all([
      supabase.from("teams").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("players").select("id", { count: "exact", head: true }).eq("is_hidden", false),
      supabase
        .from("teams")
        .select("name, stars, wins, losses, logo_url")
        .eq("is_active", true)
        .order("stars", { ascending: false })
        .order("wins", { ascending: false })
        .limit(8),
    ]);
    return (
      <LandingShell>
        <LandingLiga
          totalTeams={teamsResult.count ?? 0}
          totalPlayers={playersResult.count ?? 0}
          topTeams={(topTeamsResult.data ?? []) as TopTeam[]}
        />
      </LandingShell>
    );
  }

  // Default: Copa Omega (sistema de estrellas)
  const [playersResult, matchesResult, topPlayersResult] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }).eq("is_hidden", false),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase
      .from("players")
      .select("alias, stars, wins, losses, avatar_url")
      .eq("is_hidden", false)
      .order("stars", { ascending: false })
      .order("wins", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(3),
  ]);

  const totalPlayers = playersResult.count ?? 0;

  return (
    <LandingShell>
      <LandingCopaOmega
        totalPlayers={totalPlayers}
        totalStars={totalPlayers * 25}
        totalMatches={matchesResult.count ?? 0}
        topPlayers={(topPlayersResult.data ?? []) as TopPlayer[]}
      />
    </LandingShell>
  );
}
