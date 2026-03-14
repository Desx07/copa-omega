"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
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
    <div className="rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(123,47,247,0.06)] space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black neon-gold">COPA OMEGA STAR</h1>
        <p className="text-sm text-omega-muted">Tu próximo combate te está esperando</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-lg border border-omega-border bg-omega-dark/80 px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            className="w-full rounded-lg border border-omega-border bg-omega-dark/80 px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-3 font-bold text-white shadow-[0_0_20px_rgba(123,47,247,0.3)] hover:shadow-[0_0_30px_rgba(123,47,247,0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <LogIn className="size-5" />
              Entrar al estadio
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-omega-muted">
        Primera vez?{" "}
        <Link href="/auth/register" className="text-omega-blue hover:underline font-medium">
          Sumate al torneo
        </Link>
      </p>
    </div>
  );
}
