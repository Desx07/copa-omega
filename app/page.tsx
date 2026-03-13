import Link from "next/link";
import { Star, Swords, Trophy, Users, ChevronRight, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-omega-purple)_0%,_transparent_70%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-omega-blue)_0%,_transparent_50%)] opacity-10" />

        <div className="relative z-10 text-center space-y-8 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <Star className="size-20 text-omega-gold star-glow fill-omega-gold" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-omega-black font-black text-2xl">{"\u03A9"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight">
              <span className="neon-blue">COPA</span>{" "}
              <span className="neon-gold">OMEGA</span>{" "}
              <span className="neon-purple">STAR</span>
            </h1>
            <p className="text-omega-muted text-lg">
              Torneo oficial de <span className="text-omega-blue font-bold">Beyblade X</span>
            </p>
          </div>

          {/* Stats preview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-omega-card/80 border border-omega-border p-4 text-center backdrop-blur-sm">
              <Star className="size-5 text-omega-gold mx-auto mb-1" />
              <p className="text-2xl font-black text-omega-gold">25</p>
              <p className="text-[11px] text-omega-muted">estrellas iniciales</p>
            </div>
            <div className="rounded-xl bg-omega-card/80 border border-omega-border p-4 text-center backdrop-blur-sm">
              <Swords className="size-5 text-omega-blue mx-auto mb-1" />
              <p className="text-2xl font-black text-omega-blue">5</p>
              <p className="text-[11px] text-omega-muted">max por batalla</p>
            </div>
            <div className="rounded-xl bg-omega-card/80 border border-omega-border p-4 text-center backdrop-blur-sm">
              <Trophy className="size-5 text-omega-purple mx-auto mb-1" />
              <p className="text-2xl font-black text-omega-purple">1</p>
              <p className="text-[11px] text-omega-muted">campeon</p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <Link
              href="/auth/register"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-omega-purple to-omega-blue px-6 py-4 text-lg font-bold text-white shadow-lg shadow-omega-purple/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-omega-purple/40 active:scale-[0.98]"
            >
              <Zap className="size-5" />
              Registrarme
              <ChevronRight className="size-5" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-omega-border bg-omega-card/50 px-6 py-3 text-sm font-medium text-omega-muted hover:text-omega-text hover:border-omega-blue/50 transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Leaderboard teaser */}
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-xl bg-omega-card/60 border border-omega-border p-4 hover:border-omega-gold/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-omega-gold/10">
                <Users className="size-5 text-omega-gold" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-omega-text">Ver ranking</p>
                <p className="text-xs text-omega-muted">Tabla de posiciones en vivo</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-omega-muted group-hover:text-omega-gold transition-colors" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-omega-muted/50">
        Copa Omega Star &copy; 2026 — Beyblade X
      </footer>
    </div>
  );
}
