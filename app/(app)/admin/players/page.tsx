import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Users, Shield, UserCheck, EyeOff, ArrowLeft, Scale } from "lucide-react";
import { PlayerActions } from "./_components/player-actions";

export default async function AdminPlayersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profileResult, playersResult] = await Promise.all([
    supabase.from("players").select("is_admin").eq("id", user.id).single(),
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, is_admin, is_hidden, is_judge, created_at")
      .order("stars", { ascending: false }),
  ]);

  const { data: profile } = profileResult;
  const { data: players } = playersResult;

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  const allPlayers = players ?? [];
  const totalPlayers = allPlayers.length;
  const activePlayers = allPlayers.filter((p) => !p.is_eliminated && !p.is_hidden).length;
  const hiddenPlayers = allPlayers.filter((p) => p.is_hidden).length;
  const judgePlayers = allPlayers.filter((p) => p.is_judge).length;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/admin/matches" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors mb-4">
        <ArrowLeft className="size-4" />
        Partidas
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-omega-purple" />
          <h1 className="text-2xl font-black neon-blue">JUGADORES</h1>
        </div>
        <Link
          href="/admin/matches"
          className="omega-btn omega-btn-secondary px-3 py-1.5 text-xs"
        >
          Partidas
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="omega-card p-3 text-center">
          <Users className="size-4 text-omega-blue mx-auto mb-1" />
          <p className="text-xl font-black text-omega-blue">{totalPlayers}</p>
          <p className="text-[11px] text-omega-muted">total</p>
        </div>
        <div className="omega-card p-3 text-center">
          <UserCheck className="size-4 text-omega-green mx-auto mb-1" />
          <p className="text-xl font-black text-omega-green">{activePlayers}</p>
          <p className="text-[11px] text-omega-muted">visibles</p>
        </div>
        <div className="omega-card p-3 text-center">
          <EyeOff className="size-4 text-omega-gold mx-auto mb-1" />
          <p className="text-xl font-black text-omega-gold">{hiddenPlayers}</p>
          <p className="text-[11px] text-omega-muted">ocultos</p>
        </div>
        <div className="omega-card p-3 text-center">
          <Scale className="size-4 text-omega-purple mx-auto mb-1" />
          <p className="text-xl font-black text-omega-purple">{judgePlayers}</p>
          <p className="text-[11px] text-omega-muted">jueces</p>
        </div>
      </div>

      {/* Players list */}
      <div className="space-y-3">
        {allPlayers.length === 0 ? (
          <div className="omega-card p-8 text-center">
            <Users className="size-8 text-omega-muted mx-auto mb-3" />
            <p className="text-omega-muted text-sm">No hay jugadores registrados</p>
          </div>
        ) : (
          allPlayers.map((player, index) => {
            const rank = index + 1;
            const isEliminated = player.is_eliminated;
            const isCurrentUser = player.id === user.id;

            return (
              <div
                key={player.id}
                className={`omega-card p-4 transition-all ${
                  player.is_hidden
                    ? "opacity-60"
                    : isEliminated
                      ? "opacity-50"
                      : "hover:bg-omega-card-hover"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div
                    className={`flex items-center justify-center size-9 rounded-full font-black text-sm shrink-0 ${
                      rank === 1
                        ? "bg-omega-gold/20 text-omega-gold"
                        : rank === 2
                          ? "bg-omega-blue/20 text-omega-blue"
                          : rank === 3
                            ? "bg-omega-purple/20 text-omega-purple"
                            : "bg-omega-surface border border-omega-border text-omega-muted"
                    }`}
                  >
                    #{rank}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-base font-bold truncate ${
                          isEliminated
                            ? "line-through text-omega-muted"
                            : "text-omega-text"
                        }`}
                      >
                        {player.alias}
                      </p>
                      {player.is_admin && (
                        <Shield className="size-3.5 text-omega-purple shrink-0" />
                      )}
                      {player.is_judge && (
                        <Scale className="size-3.5 text-omega-gold shrink-0" />
                      )}
                      {player.is_hidden && (
                        <EyeOff className="size-3.5 text-omega-gold shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-omega-muted truncate">
                      {player.full_name}
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Star
                      className={`size-4 ${
                        isEliminated
                          ? "text-omega-muted"
                          : "text-omega-gold fill-omega-gold"
                      }`}
                    />
                    <span
                      className={`text-sm font-black ${
                        isEliminated ? "text-omega-muted" : "text-omega-gold"
                      }`}
                    >
                      {player.stars}
                    </span>
                  </div>

                  {/* W-L record */}
                  <div className="text-xs text-omega-muted shrink-0 tabular-nums">
                    <span className="text-omega-green">{player.wins}W</span>
                    {"-"}
                    <span className="text-omega-red">{player.losses}L</span>
                  </div>

                  {/* Admin actions */}
                  {!isCurrentUser && (
                    <PlayerActions
                      playerId={player.id}
                      isHidden={player.is_hidden}
                      isJudge={player.is_judge}
                      alias={player.alias}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
