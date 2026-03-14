import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-noise">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Animated orbs */}
      <div className="fixed top-[15%] left-[10%] w-64 h-64 rounded-full bg-omega-purple/15 blur-[100px] orb-1 pointer-events-none" />
      <div className="fixed bottom-[20%] right-[10%] w-56 h-56 rounded-full bg-omega-blue/12 blur-[90px] orb-2 pointer-events-none" />
      <div className="fixed top-[60%] left-[60%] w-40 h-40 rounded-full bg-omega-gold/8 blur-[80px] orb-3 pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="relative z-10 mb-8 flex flex-col items-center gap-3">
        <Image
          src="/copaomega-logo.png"
          alt="Copa Omega Star"
          width={180}
          height={116}
          className="h-16 w-auto drop-shadow-[0_0_20px_rgba(123,47,247,0.25)]"
          priority
        />
      </Link>

      {/* Auth form */}
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>

      <p className="relative z-10 mt-8 text-center text-xs text-omega-muted/50">
        &copy; {new Date().getFullYear()} Bladers Santa Fe — Beyblade X
      </p>
    </div>
  );
}
