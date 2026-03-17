import Link from "next/link";
import {
  Star,
  Swords,
  Flame,
  Trophy,
  User,
  Shield,
  Package,
  ClipboardList,
  MessageSquare,
  Image,
  Zap,
  Activity,
  Target,
  BarChart3,
  Calendar,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BADGE_EMOJIS, ACCENT_COLORS } from "@/lib/titles";
import { computeTitleFromMatches } from "@/lib/dynamic-titles";
import { StoreToggle } from "@/app/_components/store-toggle";
import { StoreButton } from "@/app/_components/store-button";
import { QrScannerButton } from "@/app/_components/qr-scanner";
import { LogoutButtonFull } from "@/app/_components/logout-button-full";
import NotificationBell from "@/app/_components/notification-bell";
import ChatUnread from "@/app/_components/chat-unread";
import OnboardingChecklist from "@/app/_components/onboarding-checklist";
import SeasonBanner from "@/app/_components/season-banner";
import TournamentCountdown from "@/app/_components/tournament-countdown";
import DashboardCarousel from "@/app/_components/dashboard-carousel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [playerResult, matchesResult, allPlayersResult, last10Result, beysResult, predictionsResult, challengesResult, activeSeasonResult, nextTournamentResult, liveTournamentResult, carouselSettingResult, carouselItemsResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, full_name, alias, stars, wins, losses, is_eliminated, avatar_url, tagline, badge, accent_color, is_admin, created_at, current_login_streak, max_login_streak, onboarding_completed")
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
    // Last 10 matches for dynamic title
    supabase
      .from("matches")
      .select("winner_id")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10),
    // Onboarding: beys count
    supabase
      .from("beys")
      .select("id", { count: "exact", head: true })
      .eq("player_id", user.id),
    // Onboarding: predictions count
    supabase
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .eq("predictor_id", user.id),
    // Onboarding: challenges sent count
    supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("challenger_id", user.id),
    // Active season
    supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .maybeSingle(),
    // Next upcoming tournament (registration with event_date in the future)
    supabase
      .from("tournaments")
      .select("id, name, event_date, status, format, max_participants, participant_count:tournament_participants(count)")
      .eq("status", "registration")
      .not("event_date", "is", null)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Active in-progress tournament
    supabase
      .from("tournaments")
      .select("id, name, event_date, status, format, max_participants, participant_count:tournament_participants(count)")
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Dashboard carousel setting (separate from landing)
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "dashboard_carousel_enabled")
      .maybeSingle(),
    // Dashboard carousel items only
    supabase
      .from("carousel_items")
      .select("id, type, url, thumbnail_url, title, sort_order")
      .eq("is_active", true)
      .eq("target", "dashboard")
      .order("sort_order", { ascending: true }),
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

  // Dynamic title from last 10 matches
  const last10Matches = last10Result.data ?? [];
  const dynamicTitle = computeTitleFromMatches(last10Matches, user.id, 10);

  // Login streak
  const loginStreak = (player as unknown as { current_login_streak: number }).current_login_streak ?? 0;

  // Active season
  const activeSeason = activeSeasonResult.data;

  // Carousel
  const carouselEnabled = carouselSettingResult.data?.value === "true";
  const carouselItems = carouselItemsResult.data ?? [];

  // Next tournament: in_progress takes priority over registration
  const rawLive = liveTournamentResult.data;
  const rawNext = nextTournamentResult.data;
  const rawTournament = rawLive ?? rawNext;
  const nextTournament = rawTournament && rawTournament.event_date
    ? {
        ...rawTournament,
        participant_count:
          Array.isArray(rawTournament.participant_count) && rawTournament.participant_count.length > 0
            ? (rawTournament.participant_count[0] as { count: number }).count
            : 0,
      }
    : null;

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* ═══ HERO BANNER ═══ */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-purple/30 via-omega-surface to-omega-blue/15 px-6 pt-8 pb-10 shadow-lg shadow-omega-purple/40">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-omega-purple/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-omega-blue/15 rounded-full blur-[60px] pointer-events-none" />

        {/* Notification bell — top right */}
        <div className="relative flex justify-end mb-2">
          <NotificationBell userId={user.id} />
        </div>

        {/* Player identity row */}
        <div className="relative flex items-center gap-4">
          <Link href="/profile" className={`size-16 rounded-full border-2 ${accentConfig.border} overflow-hidden bg-omega-dark shrink-0 ring-4 ring-omega-card shadow-lg`}>
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.alias} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-2xl font-black text-omega-purple">
                {player.alias.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black text-omega-text truncate">
              {player.badge && <span className="mr-1">{BADGE_EMOJIS[player.badge]}</span>}
              {player.alias}
            </p>
            {player.tagline && (
              <p className="text-xs text-omega-muted/80 italic truncate">&ldquo;{player.tagline}&rdquo;</p>
            )}
          </div>
          <div className="text-center shrink-0">
            <Star className="size-6 text-omega-gold fill-omega-gold star-glow mx-auto" />
            <span className="text-3xl font-black neon-gold block -mt-1">{player.stars}</span>
          </div>
        </div>

        {/* Dynamic title + login streak badges */}
        <div className="relative flex items-center justify-center gap-2 mt-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${dynamicTitle.bg} ${dynamicTitle.color}`}>
            <Flame className="size-3.5" />
            {dynamicTitle.label}
          </span>
          {loginStreak >= 1 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-orange-400/15 border-orange-400/40 text-xs font-bold text-orange-400">
              <Calendar className="size-3.5" />
              {loginStreak} {loginStreak === 1 ? "dia" : "dias"}
            </span>
          )}
        </div>

        {/* Stats strip inside hero */}
        <div className="relative flex items-center justify-around rounded-xl bg-omega-dark/60 border border-white/[0.06] py-2.5 px-2 mt-4">
          {rank > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy className="size-3.5 text-omega-gold" />
                <span className="font-bold text-omega-gold">#{rank}</span>
                <span className="text-omega-muted text-xs">puesto</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
            </>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-omega-green">{player.wins}W</span>
            <span className="text-omega-muted/50">/</span>
            <span className="font-bold text-omega-red">{player.losses}L</span>
          </div>
          {winRate > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-omega-blue">{winRate}%</span>
              </div>
            </>
          )}
          {currentStreak >= 2 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1 text-sm">
                <Flame className="size-3.5 text-omega-green" />
                <span className="font-bold text-omega-green">{currentStreak}</span>
              </div>
            </>
          )}
        </div>

        {/* Progress bar inside hero */}
        <div className="relative mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-omega-muted font-bold uppercase tracking-wider">Clasificacion</span>
            <span className="text-omega-gold font-bold">Top 16</span>
          </div>
          <div className="h-2 rounded-full bg-omega-dark overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-omega-purple to-omega-blue"
              style={{ width: `${allPlayers.length > 0 ? Math.max(5, Math.min(100, ((allPlayers.length - rank + 1) / allPlayers.length) * 100)) : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-omega-muted">
            <span>Posicion <span className="text-omega-gold font-bold">#{rank}</span> de {allPlayers.length}</span>
            <span>{rank > 0 && rank <= 16 ? <span className="text-omega-green font-bold">Clasificado</span> : <span className="text-omega-red">Fuera del top 16</span>}</span>
          </div>
        </div>
      </div>

      {/* ═══ SEARCH BAR — find bladers ═══ */}
      <div className="px-4">
        <Link href="/search" className="omega-card flex items-center gap-3 px-4 py-3 hover:border-omega-purple/30 transition-all">
          <Search className="size-5 text-omega-muted" />
          <span className="text-sm text-omega-muted">Buscar bladers...</span>
        </Link>
      </div>

      {/* ═══ DASHBOARD CAROUSEL ═══ */}
      {carouselEnabled && carouselItems.length > 0 && (
        <div className="px-4">
          <DashboardCarousel items={carouselItems} />
        </div>
      )}

      {/* ═══ SEASON BANNER ═══ */}
      {activeSeason && (
        <div className="px-4">
          <SeasonBanner
            name={activeSeason.name}
            number={activeSeason.number}
            endsAt={activeSeason.ends_at}
          />
        </div>
      )}

      {/* ═══ NEXT TOURNAMENT — compact card ═══ */}
      {nextTournament && (
        <div className="px-4">
          <TournamentCountdown tournament={nextTournament} />
        </div>
      )}

      {/* ═══ ENGAGEMENT QUICK LINKS — compact row ═══ */}
      <div className="grid grid-cols-3 gap-2 px-4">
        <Link href="/predictions" className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-purple/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center group-hover:bg-omega-purple/30 transition-colors">
            <Target className="size-5 text-omega-purple" />
          </div>
          <p className="text-xs font-bold text-omega-text">Predicciones</p>
          <p className="text-[10px] text-omega-muted leading-tight">Adiviná quién gana</p>
        </Link>
        <Link href="/combos" className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-green/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-10 rounded-xl bg-omega-green/20 flex items-center justify-center group-hover:bg-omega-green/30 transition-colors">
            <Swords className="size-5 text-omega-green" />
          </div>
          <p className="text-xs font-bold text-omega-text">Combos</p>
          <p className="text-[10px] text-omega-muted leading-tight">Compartí tu combo</p>
        </Link>
        <Link href="/polls" className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-blue/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-10 rounded-xl bg-omega-blue/20 flex items-center justify-center group-hover:bg-omega-blue/30 transition-colors">
            <BarChart3 className="size-5 text-omega-blue" />
          </div>
          <p className="text-xs font-bold text-omega-text">Encuestas</p>
          <p className="text-[10px] text-omega-muted leading-tight">Votá y opiná</p>
        </Link>
      </div>

      {/* ═══ ONBOARDING CHECKLIST ═══ */}
      {!player.onboarding_completed && (
        <div className="px-4">
          <OnboardingChecklist
            playerId={player.id}
            hasAvatar={!!player.avatar_url}
            hasBeys={(beysResult.count ?? 0) > 0}
            hasPredictions={(predictionsResult.count ?? 0) > 0}
            hasChallenges={(challengesResult.count ?? 0) > 0}
          />
        </div>
      )}

      {/* ═══ QUICK ACTIONS — grid ═══ */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <QrScannerButton />
        <Link href="/feed" className="group rounded-2xl bg-gradient-to-br from-omega-purple to-omega-purple-glow/70 p-5 shadow-md shadow-omega-purple/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-12 rounded-2xl bg-white/20 mb-3 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Activity className="size-5 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Feed</p>
          <p className="text-xs text-white/70 mt-0.5">Qué está pasando</p>
        </Link>
        <Link href="/challenges" className="group rounded-2xl bg-gradient-to-br from-omega-red to-omega-red/60 p-5 shadow-md shadow-omega-red/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-12 rounded-2xl bg-white/20 mb-3 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Zap className="size-5 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Retar blader</p>
          <p className="text-xs text-white/70 mt-0.5">Buscá y desafiá a un rival</p>
        </Link>
        <Link href="/ranking" className="group rounded-2xl bg-gradient-to-br from-omega-gold/80 to-omega-gold-glow/60 p-5 shadow-md shadow-omega-gold/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-12 rounded-2xl bg-white/20 mb-3 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Trophy className="size-5 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Ranking</p>
          <p className="text-xs text-white/70 mt-0.5">Tabla de estrellas y posiciones</p>
        </Link>
        <Link href="/profile" className="group rounded-2xl bg-gradient-to-br from-omega-purple to-omega-purple-glow/70 p-5 shadow-md shadow-omega-purple/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-12 rounded-2xl bg-white/20 mb-3 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <User className="size-5 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Mi Perfil</p>
          <p className="text-xs text-white/70 mt-0.5">Avatar, beys, ficha y medallas</p>
        </Link>
        <Link href="/tournaments" className="group rounded-2xl bg-gradient-to-br from-omega-green to-omega-green/60 p-5 shadow-md shadow-omega-green/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <div className="size-12 rounded-2xl bg-white/20 mb-3 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <Trophy className="size-5 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Torneos</p>
          <p className="text-xs text-white/70 mt-0.5">Inscribite y competí en copa</p>
        </Link>
        <Link href="/galeria" className="group rounded-2xl bg-gradient-to-br from-omega-card-hover to-omega-surface p-5 shadow-md shadow-omega-purple/20 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border border-omega-border/30">
          <div className="size-12 rounded-2xl bg-omega-purple/20 mb-3 flex items-center justify-center group-hover:bg-omega-purple/30 transition-colors">
            <Image className="size-5 text-omega-purple" />
          </div>
          <p className="font-bold text-omega-text text-sm">Galería</p>
          <p className="text-xs text-omega-muted mt-0.5">Fotos y videos de torneos</p>
        </Link>
        <Link href="/chat" className="relative group rounded-2xl bg-gradient-to-br from-omega-blue to-omega-blue-glow/60 p-5 shadow-md shadow-omega-blue/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
          <ChatUnread userId={user.id} />
          <div className="size-12 rounded-2xl bg-white/20 mb-3 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <MessageSquare className="size-5 text-white" />
          </div>
          <p className="font-bold text-white text-sm">Chat</p>
          <p className="text-xs text-white/70 mt-0.5">Hablá con la comunidad</p>
        </Link>
      </div>

      {/* ═══ STORE BUTTON — dynamic, outside the grid ═══ */}
      <div className="px-4">
        <StoreButton />
      </div>

      {/* ═══ MATCH HISTORY — section header + list rows ═══ */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="size-4 text-omega-blue" />
            <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Mis ultimas batallas</h2>
          </div>
          <span className="omega-badge omega-badge-blue">{matches.length}</span>
        </div>

        {matches.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <Swords className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">Todavia no tenes batallas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const won = match.winner_id === user.id;
              const isPlayer1 = match.player1_id === user.id;
              const opponent = isPlayer1 ? match.player2 : match.player1;
              const opponentAlias = (opponent as unknown as { alias: string })?.alias ?? "???";
              return (
                <div
                  key={match.id}
                  className={`rounded-xl border-l-4 ${won ? "border-l-omega-green" : "border-l-omega-red"} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3`}
                >
                  <div className={`size-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${won ? "bg-omega-green/20 border border-omega-green/40 text-omega-green" : "bg-omega-red/20 border border-omega-red/40 text-omega-red"}`}>
                    {won ? "W" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-omega-text truncate">vs {opponentAlias}</p>
                    <p className="text-xs text-omega-muted/70">
                      {match.completed_at ? new Date(match.completed_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}
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

      {/* ═══ ADMIN ZONE — visually separated ═══ */}
      {player.is_admin && (
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-omega-blue" />
            <h2 className="text-xs font-bold text-omega-muted uppercase tracking-wider">Administracion</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin/matches" className="group rounded-2xl bg-gradient-to-br from-omega-blue to-omega-blue-glow p-4 shadow-md shadow-omega-blue/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center">
              <div className="size-10 rounded-xl bg-white/20 mb-2 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Swords className="size-5 text-white" />
              </div>
              <p className="text-xs font-bold text-white">Partidas</p>
            </Link>
            <Link href="/admin/tournaments" className="group rounded-2xl bg-gradient-to-br from-omega-blue to-omega-blue-glow p-4 shadow-md shadow-omega-blue/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center">
              <div className="size-10 rounded-xl bg-white/20 mb-2 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Shield className="size-5 text-white" />
              </div>
              <p className="text-xs font-bold text-white">Torneos</p>
            </Link>
            <Link href="/admin/products" className="group rounded-2xl bg-gradient-to-br from-omega-blue to-omega-blue-glow p-4 shadow-md shadow-omega-blue/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center">
              <div className="size-10 rounded-xl bg-white/20 mb-2 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Package className="size-5 text-white" />
              </div>
              <p className="text-xs font-bold text-white">Productos</p>
            </Link>
            <Link href="/admin/orders" className="group rounded-2xl bg-gradient-to-br from-omega-blue to-omega-blue-glow p-4 shadow-md shadow-omega-blue/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center">
              <div className="size-10 rounded-xl bg-white/20 mb-2 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ClipboardList className="size-5 text-white" />
              </div>
              <p className="text-xs font-bold text-white">Pedidos</p>
            </Link>
            <Link href="/admin/carousel" className="group rounded-2xl bg-gradient-to-br from-omega-blue to-omega-blue-glow p-4 shadow-md shadow-omega-blue/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center">
              <div className="size-10 rounded-xl bg-white/20 mb-2 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Image className="size-5 text-white" />
              </div>
              <p className="text-xs font-bold text-white">Carousel</p>
            </Link>
          </div>
          <StoreToggle />
        </div>
      )}

      <div className="px-4">
        <LogoutButtonFull />
      </div>
    </div>
  );
}
