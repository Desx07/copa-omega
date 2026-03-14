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
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-omega-black text-omega-text overflow-hidden">
      {/* Ambient bg */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-omega-purple/[0.10] blur-[120px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-omega-blue/[0.07] blur-[100px]" />
      </div>
      <div className="fixed inset-0 -z-10 pointer-events-none hero-grid opacity-50" />

      {/* Logo */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-3">
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
      <div className="w-full max-w-sm">
        {children}
      </div>

      <p className="mt-8 text-center text-xs text-omega-muted/50">
        &copy; {new Date().getFullYear()} Bladers Santa Fe — Beyblade X
      </p>
    </div>
  );
}
