import Link from "next/link";
import { Star, Trophy, Crown, Shield, Swords, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch current user (may be null for public access)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current user is admin
  let isAdmin = false;
  if (user) {
    const { data: currentPlayer } = await supabase
      .from("players")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = currentPlayer?.is_admin ?? false;
  }

  // Fetch all players ordered by stars DESC, then wins DESC
  const { data: players } = await supabase
    .from("players")
    .select("id, alias, full_name, stars, wins, losses, is_eliminated, avatar_url")
    .order("stars", { ascending: false })
    .order("wins", { ascending: false });

  const leaderboard = players ?? [];

  return (
    <div className="min-h-screen bg-omega-black">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-omega-purple)_0%,_transparent_60%)] opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--color-omega-blue)_0%,_transparent_50%)] opacity-5 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Star className="size-8 text-omega-gold star-glow fill-omega-gold" />
            <h1 className="text-3xl font-black tracking-tight neon-gold">
              RANKING
            </h1>
            <Star className="size-8 text-omega-gold star-glow fill-omega-gold" />
          </div>
          <p className="text-sm text-omega-muted">
            Copa Omega Star — Tabla de posiciones
          </p>
        </div>

        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-omega-muted hover:text-omega-text transition-colors"
          >
            &larr; Inicio
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <Link
                  href="/admin/matches"
                  className="flex items-center gap-1.5 rounded-lg border border-omega-border bg-omega-card/60 px-3 py-1.5 text-xs font-medium text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
                >
                  <Shield className="size-3.5" />
                  Admin
                </Link>
                <Link
                  href="/admin/matches/new"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-omega-purple to-omega-blue px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Swords className="size-3.5" />
                  Nuevo Partido
                </Link>
              </>
            )}
            {!user && (
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 rounded-lg border border-omega-border bg-omega-card/60 px-3 py-1.5 text-xs font-medium text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
              >
                <LogIn className="size-3.5" />
                Iniciar sesion
              </Link>
            )}
          </div>
        </div>

        {/* Empty state */}
        {leaderboard.length === 0 && (
          <div className="rounded-2xl border border-omega-border bg-omega-card/50 p-12 text-center space-y-4 backdrop-blur-sm">
            <Trophy className="size-16 text-omega-muted/30 mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-bold text-omega-muted">
                No hay jugadores todavia
              </p>
              <p className="text-sm text-omega-muted/70">
                Registrate para ser el primero en la tabla
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-6 py-3 font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Star className="size-4" />
              Registrarme
            </Link>
          </div>
        )}

        {/* Top 3 podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {/* 2nd place */}
            <PodiumCard player={leaderboard[1]} rank={2} />
            {/* 1st place */}
            <PodiumCard player={leaderboard[0]} rank={1} />
            {/* 3rd place */}
            <PodiumCard player={leaderboard[2]} rank={3} />
          </div>
        )}

        {/* If only 1 or 2 players, show them inline */}
        {leaderboard.length > 0 && leaderboard.length < 3 && (
          <div className="flex justify-center gap-4">
            {leaderboard.slice(0, 3).map((player, i) => (
              <div key={player.id} className="w-48">
                <PodiumCard player={player} rank={(i + 1) as 1 | 2 | 3} />
              </div>
            ))}
          </div>
        )}

        {/* Full leaderboard table */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl border border-omega-border bg-omega-card/40 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
              <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
                <Trophy className="size-4 text-omega-purple" />
                Tabla completa
              </h2>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5.5rem] gap-1 px-4 py-2.5 text-[11px] font-bold text-omega-muted uppercase tracking-wider border-b border-omega-border/50">
              <span>#</span>
              <span>Jugador</span>
              <span className="text-center">Estrellas</span>
              <span className="text-center">W/L</span>
              <span className="text-center">Estado</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-omega-border/30">
              {leaderboard.map((player, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-[3rem_1fr_5rem_5rem_5.5rem] gap-1 px-4 py-3 items-center transition-colors hover:bg-omega-card/60 ${
                      rank <= 3 ? "bg-omega-card/30" : ""
                    } ${player.is_eliminated ? "opacity-60" : ""}`}
                  >
                    {/* Rank */}
                    <span className={`text-sm font-black ${getRankColor(rank)}`}>
                      {rank <= 3 ? (
                        <span className="flex items-center gap-1">
                          {getRankIcon(rank)}
                          {rank}
                        </span>
                      ) : (
                        rank
                      )}
                    </span>

                    {/* Player alias */}
                    <span
                      className={`text-sm font-bold truncate ${
                        player.is_eliminated
                          ? "text-omega-muted line-through"
                          : "text-omega-text"
                      }`}
                    >
                      {player.alias}
                    </span>

                    {/* Stars */}
                    <span className="flex items-center justify-center gap-1">
                      <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                      <span className="text-sm font-black text-omega-gold">
                        {player.stars}
                      </span>
                    </span>

                    {/* W/L */}
                    <span className="text-center text-sm text-omega-muted">
                      <span className="text-omega-green font-bold">{player.wins}</span>
                      <span className="text-omega-muted/50">/</span>
                      <span className="text-omega-red font-bold">{player.losses}</span>
                    </span>

                    {/* Status */}
                    <span className="flex justify-center">
                      {player.is_eliminated ? (
                        <span className="inline-flex items-center rounded-full bg-omega-red/10 border border-omega-red/30 px-2 py-0.5 text-[10px] font-bold text-omega-red uppercase tracking-wider">
                          Eliminado
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-omega-green/10 border border-omega-green/30 px-2 py-0.5 text-[10px] font-bold text-omega-green uppercase tracking-wider">
                          Activo
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-omega-muted/50">
          Copa Omega Star &copy; 2026 — Beyblade X
        </footer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper components & functions                                              */
/* -------------------------------------------------------------------------- */

interface PodiumPlayer {
  id: string;
  alias: string;
  stars: number;
  wins: number;
  losses: number;
  is_eliminated: boolean;
}

interface PodiumCardProps {
  player: PodiumPlayer;
  rank: 1 | 2 | 3;
}

const podiumConfig = {
  1: {
    border: "border-omega-gold/50",
    bg: "bg-gradient-to-b from-omega-gold/10 to-omega-card/80",
    shadow: "shadow-lg shadow-omega-gold/10",
    starClass: "text-omega-gold",
    label: "neon-gold",
    height: "pt-2",
    icon: <Crown className="size-6 text-omega-gold fill-omega-gold/30" />,
  },
  2: {
    border: "border-omega-muted/30",
    bg: "bg-gradient-to-b from-omega-muted/10 to-omega-card/80",
    shadow: "",
    starClass: "text-omega-muted",
    label: "text-omega-muted",
    height: "pt-6",
    icon: <Crown className="size-5 text-omega-muted/70" />,
  },
  3: {
    border: "border-orange-700/30",
    bg: "bg-gradient-to-b from-orange-900/10 to-omega-card/80",
    shadow: "",
    starClass: "text-orange-500",
    label: "text-orange-500",
    height: "pt-8",
    icon: <Crown className="size-5 text-orange-500/70" />,
  },
} as const;

function PodiumCard({ player, rank }: PodiumCardProps) {
  const config = podiumConfig[rank];

  return (
    <div
      className={`${config.height} ${rank === 1 ? "order-2 -mt-2" : rank === 2 ? "order-1 mt-2" : "order-3 mt-2"}`}
    >
      <div
        className={`rounded-2xl border ${config.border} ${config.bg} ${config.shadow} p-4 text-center space-y-2 backdrop-blur-sm`}
      >
        {/* Crown */}
        <div className="flex justify-center">{config.icon}</div>

        {/* Alias */}
        <p
          className={`text-sm font-black truncate ${
            player.is_eliminated ? "text-omega-muted line-through" : "text-omega-text"
          }`}
        >
          {player.alias}
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-1">
          <Star
            className={`size-4 ${config.starClass} ${rank === 1 ? "star-glow fill-omega-gold" : ""}`}
          />
          <span className={`text-xl font-black ${config.label}`}>
            {player.stars}
          </span>
        </div>

        {/* W/L */}
        <p className="text-[11px] text-omega-muted">
          <span className="text-omega-green font-bold">{player.wins}W</span>
          {" "}
          <span className="text-omega-red font-bold">{player.losses}L</span>
        </p>
      </div>
    </div>
  );
}

function getRankColor(rank: number): string {
  if (rank === 1) return "text-omega-gold";
  if (rank === 2) return "text-omega-muted";
  if (rank === 3) return "text-orange-500";
  return "text-omega-muted/70";
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="size-3.5 text-omega-gold inline" />;
  if (rank === 2) return <Crown className="size-3 text-omega-muted/70 inline" />;
  if (rank === 3) return <Crown className="size-3 text-orange-500/70 inline" />;
  return null;
}
