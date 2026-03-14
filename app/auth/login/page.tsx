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
        toast.error("Email o contrasena incorrectos");
        return;
      }

      router.push("/dashboard");
    } catch {
      toast.error("Error de conexion, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="omega-card p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black neon-gold">COPA OMEGA STAR</h1>
        <p className="text-sm text-omega-muted">Tu proximo combate te esta esperando</p>
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
            className="omega-input py-3"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Contrasena
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contrasena"
            className="omega-input py-3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="omega-btn omega-btn-primary w-full py-3 text-sm"
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
