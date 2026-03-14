import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Swords,
  Trophy,
  Users,
  Zap,
  Flame,
  Target,
  Crown,
  ArrowRight,
  Shield,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

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
  const totalMatches = matchesResult.count ?? 0;
  const topPlayers = topPlayersResult.data ?? [];
  const totalStars = totalPlayers * 25;

  return (
    <div className="min-h-screen flex flex-col bg-omega-black text-omega-text overflow-x-hidden">
      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 bg-omega-black/80 backdrop-blur-xl border-b border-omega-border/30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
          <Link href="/">
            <Image src="/copaomega-logo.png" alt="Copa Omega Stars" width={120} height={40} className="h-8 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-omega-muted hover:text-omega-text transition-colors">
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-omega-purple to-omega-blue rounded-lg shadow-[0_0_20px_rgba(123,47,247,0.3)] hover:shadow-[0_0_30px_rgba(123,47,247,0.5)] transition-all active:scale-95"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ═══ HERO ═══ */}
        <section className="relative hero-grid">
          {/* Radial glow behind illustration area */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_65%_50%,_rgba(123,47,247,0.12)_0%,_rgba(0,180,216,0.06)_40%,_transparent_70%)]" />

          <div className="relative mx-auto max-w-7xl px-6 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="grid gap-10 md:grid-cols-2 md:items-center lg:gap-16">
              {/* Illustration — FIRST on mobile */}
              <div className="relative mx-auto w-full max-w-[260px] aspect-square sm:max-w-[320px] md:max-w-[420px] md:order-last">
                {/* Glow */}
                <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-omega-purple/20 via-omega-blue/15 to-transparent blur-[60px]" />
                <div className="absolute inset-[15%] rounded-full shadow-[0_0_120px_60px_rgba(123,47,247,0.12)]" />

                {/* Logo center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/copaomega-logo.png"
                    alt=""
                    width={280}
                    height={180}
                    className="w-[75%] h-auto drop-shadow-[0_0_30px_rgba(123,47,247,0.3)] drop-shadow-[0_0_60px_rgba(0,180,216,0.15)]"
                  />
                </div>

                {/* Floating accents */}
                <div className="absolute -top-2 left-[5%] animate-float">
                  <div className="flex size-14 sm:size-16 items-center justify-center rounded-xl bg-omega-gold shadow-[0_0_25px_rgba(255,214,10,0.5)]">
                    <Star className="size-7 sm:size-8 text-omega-black fill-omega-black/20" />
                  </div>
                </div>
                <div className="absolute -bottom-2 right-[5%] animate-float-d1">
                  <div className="flex size-14 sm:size-16 items-center justify-center rounded-xl bg-gradient-to-br from-omega-purple to-omega-blue shadow-[0_0_25px_rgba(123,47,247,0.4)]">
                    <Swords className="size-7 sm:size-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-[10%] -right-3 animate-float-d2">
                  <div className="flex size-10 sm:size-11 items-center justify-center rounded-lg bg-omega-green shadow-[0_0_15px_rgba(46,213,115,0.4)] rotate-12">
                    <Trophy className="size-5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-[20%] -left-3 animate-float-d3">
                  <div className="flex size-9 sm:size-10 items-center justify-center rounded-lg bg-omega-red shadow-[0_0_15px_rgba(255,71,87,0.4)] -rotate-12">
                    <Shield className="size-4 sm:size-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Text — SECOND on mobile, FIRST on desktop */}
              <div className="space-y-6 text-center md:text-left">
                <Image src="/bladers-text.png" alt="Bladers Santa Fe" width={150} height={42} className="h-7 w-auto mx-auto md:mx-0 opacity-70" />

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                  Competi por las estrellas,{" "}
                  <span className="bg-gradient-to-r from-omega-gold via-omega-gold-glow to-omega-gold bg-clip-text text-transparent text-glow-gold">
                    conquista el torneo
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-omega-muted/90 max-w-lg mx-auto md:mx-0 leading-relaxed">
                  El torneo oficial de Beyblade X en Santa Fe. Batalla, gana estrellas y clasifica al top 16.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center md:justify-start">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-black uppercase tracking-wide text-white bg-gradient-to-r from-omega-purple via-omega-blue to-omega-purple rounded-lg border border-omega-purple/30 shadow-[0_0_30px_rgba(123,47,247,0.4)] hover:shadow-[0_0_50px_rgba(123,47,247,0.6)] transition-all active:scale-95"
                  >
                    <Zap className="size-5" />
                    Unirme al torneo
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-omega-muted border border-omega-border/50 rounded-lg hover:text-omega-text hover:border-omega-purple/50 hover:bg-omega-purple/5 transition-all"
                  >
                    Ver ranking
                    <ArrowRight className="size-4" />
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12 pt-4">
                  <HeroStat value={totalPlayers} label="bladers" color="text-omega-blue" />
                  <div className="w-px h-10 bg-gradient-to-b from-transparent via-omega-border/60 to-transparent" />
                  <HeroStat value={totalStars} label="estrellas" color="text-omega-gold" />
                  <div className="w-px h-10 bg-gradient-to-b from-transparent via-omega-border/60 to-transparent" />
                  <HeroStat value={totalMatches} label="batallas" color="text-omega-purple" />
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ═══ COMO FUNCIONA ═══ */}
        <section className="bg-omega-dark/50 py-12 md:py-16 px-6 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs uppercase tracking-[0.3em] text-omega-purple font-bold mb-3 text-center">Como funciona</p>
            <h2 className="text-2xl md:text-3xl font-black text-center">En tres pasos empezas a competir</h2>

            <div className="relative grid gap-8 md:grid-cols-3 mt-14">
              {/* Connecting line desktop */}
              <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] energy-line" />

              {[
                { icon: Star, title: "Registrate", desc: "Crea tu cuenta y arrancas con 25 estrellas para competir.", gradient: "from-omega-purple to-omega-blue", fill: true },
                { icon: Swords, title: "Batalla", desc: "Enfrenta a otros bladers apostando de 1 a 5 estrellas por combate.", gradient: "from-omega-blue to-omega-green", fill: false },
                { icon: Trophy, title: "Clasificate", desc: "Top 16 van al torneo final. Llega a 0 estrellas y quedas eliminado.", gradient: "from-omega-gold to-omega-gold-glow", fill: false },
              ].map((step, i) => (
                <div key={step.title} className="relative flex flex-col items-center text-center gap-5">
                  <div className="relative">
                    <div className={`hex-clip flex size-[104px] items-center justify-center bg-gradient-to-br ${step.gradient}`}>
                      <step.icon className={`size-10 text-white ${step.fill ? "fill-white/20" : ""}`} />
                    </div>
                    <span className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-omega-gold text-sm font-black text-omega-black shadow-[0_0_15px_rgba(255,214,10,0.5)] border-2 border-omega-dark">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-omega-muted max-w-[240px] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══ FEATURES — Bento Grid ═══ */}
        <section className="mx-auto max-w-6xl px-6 md:px-8 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.3em] text-omega-blue font-bold mb-3 text-center">Funcionalidades</p>
          <h2 className="text-2xl md:text-3xl font-black text-center">Todo en un solo lugar</h2>

          {/* Desktop: bento 4-col. Tablet: 2-col. Mobile: 1-col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
            {/* Hero card — Ranking */}
            <div className="group sm:col-span-2 relative overflow-hidden rounded-xl bg-gradient-to-br from-omega-card/60 to-omega-card/30 border border-omega-gold/20 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(255,214,10,0.1)] hover:border-omega-gold/40">
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-omega-gold/60 to-transparent" />
              <Crown className="size-10 text-omega-gold mb-4 transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,214,10,0.5)]" />
              <h3 className="text-xl font-bold mb-1">Ranking en vivo</h3>
              <p className="text-sm text-omega-muted">Posiciones actualizadas despues de cada batalla.</p>
            </div>

            {/* Perfil */}
            <div className="group sm:col-span-2 lg:col-span-2 rounded-xl bg-omega-card/30 border border-omega-border/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-omega-card/50 hover:border-omega-blue/40 hover:shadow-[0_0_25px_rgba(0,180,216,0.1)]">
              <UserCircle className="size-8 text-omega-blue mb-3 transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(0,180,216,0.5)]" />
              <h3 className="text-base font-bold mb-1">Perfil de blader</h3>
              <p className="text-sm text-omega-muted">Tu foto, alias, beys y estadisticas.</p>
            </div>

            {/* Rachas */}
            <div className="group rounded-xl bg-omega-card/30 border border-omega-border/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-omega-card/50 hover:border-omega-green/40 hover:shadow-[0_0_25px_rgba(46,213,115,0.1)]">
              <Flame className="size-8 text-omega-green mb-3 transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(46,213,115,0.5)]" />
              <h3 className="text-base font-bold mb-1">Rachas y win rate</h3>
              <p className="text-sm text-omega-muted">Segui tu rendimiento.</p>
            </div>

            {/* Historial */}
            <div className="group rounded-xl bg-omega-card/30 border border-omega-border/30 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-omega-card/50 hover:border-omega-purple/40 hover:shadow-[0_0_25px_rgba(123,47,247,0.1)]">
              <BarChart3 className="size-8 text-omega-purple mb-3 transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(123,47,247,0.5)]" />
              <h3 className="text-base font-bold mb-1">Historial completo</h3>
              <p className="text-sm text-omega-muted">Cada batalla registrada.</p>
            </div>

            {/* Hero card — Sistema estrellas */}
            <div className="group sm:col-span-2 relative overflow-hidden rounded-xl bg-gradient-to-br from-omega-card/60 to-omega-card/30 border border-omega-purple/20 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(123,47,247,0.1)] hover:border-omega-purple/40">
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-omega-purple/60 to-transparent" />
              <Target className="size-10 text-omega-gold mb-4 transition-transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,214,10,0.5)]" />
              <h3 className="text-xl font-bold mb-1">Sistema de estrellas</h3>
              <p className="text-sm text-omega-muted">Aposta de 1 a 5 estrellas por batalla. El ganador se las lleva.</p>
            </div>
          </div>
        </section>


        {/* ═══ LEADERBOARD ═══ */}
        <section className="bg-omega-dark/80 py-12 md:py-16 px-6 md:px-8">
          <div className="energy-line max-w-6xl mx-auto mb-10" />

          <div className="mx-auto max-w-6xl">
            <p className="text-xs uppercase tracking-[0.3em] text-omega-gold font-bold mb-3 text-center">Torneo activo</p>
            <h2 className="text-2xl md:text-3xl font-black text-center">El torneo ya empezo</h2>
            <p className="text-omega-muted mt-2 text-center">{totalPlayers} bladers compitiendo por {totalStars} estrellas</p>

            {/* Podium */}
            {topPlayers.length >= 3 && (
              <>
                <div className="flex items-end justify-center gap-3 md:gap-5 max-w-lg mx-auto mt-14">
                  {/* #2 */}
                  <div className="flex flex-col items-center">
                    <div className="size-14 md:size-16 rounded-full border-2 border-omega-muted/40 overflow-hidden bg-omega-dark">
                      {topPlayers[1].avatar_url ? (
                        <img src={topPlayers[1].avatar_url} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">{topPlayers[1].alias.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <p className="text-sm font-bold mt-2 truncate max-w-[100px]">{topPlayers[1].alias}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="size-3.5 text-omega-muted" />
                      <span className="text-base font-black text-omega-muted">{topPlayers[1].stars}</span>
                    </div>
                    {/* Bar */}
                    <div className="w-24 md:w-28 h-20 md:h-24 mt-3 rounded-t-lg bg-gradient-to-t from-omega-card/80 to-omega-card/40 border border-omega-border/30 flex items-center justify-center">
                      <span className="text-2xl font-black text-omega-muted/40">2</span>
                    </div>
                  </div>

                  {/* #1 */}
                  <div className="flex flex-col items-center">
                    <Crown className="size-6 text-omega-gold star-glow mb-1" />
                    <div className="size-18 md:size-20 rounded-full border-2 border-omega-gold overflow-hidden bg-omega-dark shadow-[0_0_20px_rgba(255,214,10,0.3)]">
                      {topPlayers[0].avatar_url ? (
                        <img src={topPlayers[0].avatar_url} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-xl font-black text-omega-purple">{topPlayers[0].alias.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <p className="text-base font-bold mt-2">{topPlayers[0].alias}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="size-4 text-omega-gold fill-omega-gold star-glow" />
                      <span className="text-xl font-black neon-gold">{topPlayers[0].stars}</span>
                    </div>
                    {/* Bar */}
                    <div className="w-28 md:w-32 h-28 md:h-36 mt-3 rounded-t-lg bg-gradient-to-t from-omega-gold/20 to-omega-gold/5 border border-omega-gold/30 flex items-center justify-center">
                      <span className="text-3xl font-black text-omega-gold/30">1</span>
                    </div>
                  </div>

                  {/* #3 */}
                  <div className="flex flex-col items-center">
                    <div className="size-14 md:size-16 rounded-full border-2 border-orange-500/40 overflow-hidden bg-omega-dark">
                      {topPlayers[2].avatar_url ? (
                        <img src={topPlayers[2].avatar_url} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-lg font-black text-omega-purple">{topPlayers[2].alias.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <p className="text-sm font-bold mt-2 truncate max-w-[100px]">{topPlayers[2].alias}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="size-3.5 text-orange-500" />
                      <span className="text-base font-black text-orange-500">{topPlayers[2].stars}</span>
                    </div>
                    {/* Bar */}
                    <div className="w-24 md:w-28 h-16 md:h-20 mt-3 rounded-t-lg bg-gradient-to-t from-orange-500/15 to-orange-500/5 border border-orange-700/30 flex items-center justify-center">
                      <span className="text-2xl font-black text-orange-500/30">3</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-10">
                  <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-omega-purple hover:text-omega-blue transition-colors group">
                    Ver ranking completo
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-omega-border/20 py-8 px-6 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Image src="/copaomega-logo.png" alt="" width={100} height={32} className="h-7 w-auto opacity-50" />
          <p className="text-xs text-omega-muted/50">&copy; {new Date().getFullYear()} Bladers Santa Fe — Beyblade X</p>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-3xl md:text-4xl font-black ${color}`}>{value}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-omega-muted mt-1">{label}</p>
    </div>
  );
}
