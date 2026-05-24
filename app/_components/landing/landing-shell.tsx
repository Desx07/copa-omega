import Link from "next/link";
import Image from "next/image";

// Shell común de la landing: fondo animado, nav y footer.
// El contenido (hero, secciones) lo provee cada modalidad via children.
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-omega-black text-omega-text overflow-x-hidden">
      {/* ═══ ANIMATED BG — covers entire page ═══ */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="orb-1 absolute top-[10%] right-[15%] w-[600px] h-[600px] rounded-full bg-omega-purple/[0.15] blur-[120px]" />
        <div className="orb-2 absolute top-[45%] left-[5%] w-[500px] h-[500px] rounded-full bg-omega-blue/[0.12] blur-[100px]" />
        <div className="orb-3 absolute bottom-[5%] right-[25%] w-[450px] h-[450px] rounded-full bg-omega-gold/[0.08] blur-[110px]" />
      </div>

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 bg-omega-black/80 backdrop-blur-xl border-b border-omega-border/30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/">
            <Image src="/bladers-text.png" alt="Bladers Santa Fe" width={150} height={42} className="h-7 w-auto" priority />
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

      <main className="flex-1">{children}</main>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 px-4 md:px-8">
        <p className="text-center text-xs text-omega-muted/50">&copy; {new Date().getFullYear()} Bladers Santa Fe — Beyblade X</p>
      </footer>
    </div>
  );
}
