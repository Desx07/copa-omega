"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error("Email o contraseña incorrectos");
        return;
      }

      router.push("/dashboard");
    } catch {
      toast.error("Error de conexión, intentá de nuevo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Star className="size-12 text-omega-gold star-glow fill-omega-gold" />
          </div>
          <h1 className="text-2xl font-black">
            <span className="neon-gold">OMEGA STAR</span>
          </h1>
          <p className="text-sm text-omega-muted">Ingresá a tu cuenta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-omega-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-omega-border bg-omega-card px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-blue focus:ring-2 focus:ring-omega-blue/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-omega-muted">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full rounded-xl border border-omega-border bg-omega-card px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-blue focus:ring-2 focus:ring-omega-blue/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-omega-blue to-omega-purple px-4 py-3 font-bold text-white shadow-lg shadow-omega-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <LogIn className="size-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-omega-muted">
          No tenés cuenta?{" "}
          <Link href="/auth/register" className="text-omega-blue hover:underline font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
