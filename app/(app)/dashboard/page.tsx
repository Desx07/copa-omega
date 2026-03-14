import Link from "next/link";
import {
  Star,
  Swords,
  Flame,
  Trophy,
  User,
  Shield,
  ShoppingBag,
  Package,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [playerResult, matchesResult, allPlayersResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url, tagline, badge, accent_color, is_admin, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("matches")
      .select("id, player1_id, player2_id, winner_id, stars_bet, completed_at, player1:players!player1_id(alias), player2:players!player2_id(alias)")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("players")
      .select("id")
      .eq("is_hidden", false)
      .order("stars", { ascending: false })
      .order("wins", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const player = playerResult.data;
  if (!player) return null;

  const matches = matchesResult.data ?? [];
  const allPlayers = allPlayersResult.data ?? [];
  const rank = allPlayers.findIndex((p) => p.id === user.id) + 1;

  let currentStreak = 0;
  for (const m of matches) {
    if (m.winner_id === user.id) currentStreak++;
    else break;
  }

  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  const accentConfig = ACCENT_COLORS[player.accent_color] || ACCENT_COLORS.purple;

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 space-y-5">
      {/* Player hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-omega-purple/30 via-omega-card/80 to-omega-blue/20 p-5 shadow-lg shadow-omega-purple/10 backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-omega-blue via-omega-purple to-omega-gold" />

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href="/profile" className={`size-16 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark shrink-0 ring-4 ring-omega-card shadow-lg shadow-omega-purple/20`}>
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-2xl font-black text-omega-purple">
                {player.alias.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black text-omega-text truncate">
              {player.badge && <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>}
              {player.alias}
            </p>
            {player.tagline && (
              <p className="text-xs text-omega-muted/80 italic truncate">&ldquo;{player.tagline}&rdquo;</p>
            )}
          </div>

          {/* Stars */}
          <div className="text-center shrink-0">
            <div className="flex items-center gap-1">
              <Star className="size-6 text-omega-gold fill-omega-gold star-glow" />
              <span className="text-3xl font-black neon-gold">{player.stars}</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center justify-around rounded-xl bg-omega-dark/60 border border-omega-border/30 py-2.5 px-2 mt-4">
          {rank > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy className="size-3.5 text-omega-gold" />
                <span className="font-bold text-omega-gold">#{rank}</span>
                <span className="text-omega-muted text-xs">puesto</span>
              </div>
              <div className="w-px h-4 bg-omega-border/50" />
            </>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-omega-green">{player.wins}W</span>
            <span className="text-omega-muted/50">/</span>
            <span className="font-bold text-omega-red">{player.losses}L</span>
          </div>
          {winRate > 0 && (
            <>
              <div className="w-px h-4 bg-omega-border/50" />
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-omega-blue">{winRate}%</span>
                <span className="text-omega-muted text-xs">win</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Streak */}
      {currentStreak >= 2 && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-omega-green/15 to-omega-green/5 border border-omega-green/30 py-3 px-5 shadow-sm shadow-omega-green/10">
          <Flame className="size-5 text-omega-green" />
          <span className="text-sm font-bold text-omega-green">Racha de {currentStreak} victorias!</span>
        </div>
      )}

      {/* Tournament progress */}
      <div className="rounded-2xl border border-omega-border/40 bg-omega-card/40 backdrop-blur-sm p-5 space-y-2 shadow-md shadow-omega-purple/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-omega-text/80 uppercase tracking-wider font-bold">Clasificación</span>
          <span className="text-omega-gold font-bold">Top 16</span>
        </div>
        <div className="h-2.5 rounded-full bg-omega-dark overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-omega-purple to-omega-blue transition-all"
            style={{ width: `${allPlayers.length > 0 ? Math.max(5, Math.min(100, ((allPlayers.length - rank + 1) / allPlayers.length) * 100)) : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-omega-muted">
          <span>Posición <span className="text-omega-gold font-bold">#{rank}</span> de {allPlayers.length}</span>
          <span>{rank > 0 && rank <= 16 ? <span className="text-omega-green font-bold">Clasificado</span> : <span className="text-omega-red">Fuera del top 16</span>}</span>
        </div>
      </div>

      {/* Quick actions — PawGo style vertical cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/ranking"
          className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-gold/25 to-omega-gold/5 p-5 shadow-md shadow-omega-gold/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
            <Trophy className="size-6 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Ranking</p>
          <p className="text-xs text-white/60 mt-0.5">Ver tabla de posiciones</p>
        </Link>

        <Link
          href="/profile"
          className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-purple/25 to-omega-purple/5 p-5 shadow-md shadow-omega-purple/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
            <User className="size-6 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Mi Perfil</p>
          <p className="text-xs text-white/60 mt-0.5">Editar y personalizar</p>
        </Link>

        <Link
          href="/tournaments"
          className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-green/25 to-omega-green/5 p-5 shadow-md shadow-omega-green/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
            <Trophy className="size-6 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Torneos</p>
          <p className="text-xs text-white/60 mt-0.5">Inscripción e historial</p>
        </Link>

        <Link
          href="/store"
          className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-red/25 to-omega-red/5 p-5 shadow-md shadow-omega-red/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
            <ShoppingBag className="size-6 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Tienda</p>
          <p className="text-xs text-white/60 mt-0.5">Productos y pedidos</p>
        </Link>

        {player.is_admin && (
          <>
            <Link
              href="/admin/matches"
              className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-blue/25 to-omega-blue/5 p-5 shadow-md shadow-omega-blue/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
                <Swords className="size-6 text-white" />
              </div>
              <p className="font-bold text-white text-sm">Partidas</p>
              <p className="text-xs text-white/60 mt-0.5">Crear y resolver</p>
            </Link>

            <Link
              href="/admin/tournaments"
              className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-blue/25 to-omega-blue/5 p-5 shadow-md shadow-omega-blue/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
                <Shield className="size-6 text-white" />
              </div>
              <p className="font-bold text-white text-sm">Admin Torneos</p>
              <p className="text-xs text-white/60 mt-0.5">Gestionar torneos</p>
            </Link>

            <Link
              href="/admin/products"
              className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-blue/25 to-omega-blue/5 p-5 shadow-md shadow-omega-blue/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
                <Package className="size-6 text-white" />
              </div>
              <p className="font-bold text-white text-sm">Productos</p>
              <p className="text-xs text-white/60 mt-0.5">Stock y catálogo</p>
            </Link>

            <Link
              href="/admin/orders"
              className="group flex flex-col rounded-2xl bg-gradient-to-br from-omega-blue/25 to-omega-blue/5 p-5 shadow-md shadow-omega-blue/10 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 mb-3 group-hover:bg-white/25 transition-colors">
                <ClipboardList className="size-6 text-white" />
              </div>
              <p className="font-bold text-white text-sm">Pedidos</p>
              <p className="text-xs text-white/60 mt-0.5">Ver y gestionar</p>
            </Link>
          </>
        )}
      </div>

      {/* Recent matches */}
      <div className="rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-sm overflow-hidden shadow-lg shadow-omega-dark/30">
        <div className="px-5 py-3.5 border-b border-omega-border/50 bg-omega-card/60">
          <h2 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
            <Swords className="size-4 text-omega-blue" />
            Mis últimas batallas
          </h2>
        </div>

        {matches.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Swords className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">Todavía no tenés batallas</p>
          </div>
        ) : (
          <div className="divide-y divide-omega-border/20">
            {matches.map((match) => {
              const won = match.winner_id === user.id;
              const isPlayer1 = match.player1_id === user.id;
              const opponent = isPlayer1 ? match.player2 : match.player1;
              const opponentAlias = (opponent as unknown as { alias: string })?.alias ?? "???";

              return (
                <div key={match.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-omega-card/40 transition-all">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      won
                        ? "bg-omega-green/10 border border-omega-green/30 text-omega-green"
                        : "bg-omega-red/10 border border-omega-red/30 text-omega-red"
                    }`}
                  >
                    {won ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-omega-text truncate">vs {opponentAlias}</p>
                    <p className="text-xs text-omega-muted/70">
                      {match.completed_at
                        ? new Date(match.completed_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        : ""}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 shrink-0 ${won ? "text-omega-green" : "text-omega-red"}`}>
                    <span className="text-sm font-black">{won ? "+" : "-"}{match.stars_bet}</span>
                    <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
