"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !alias.trim()) {
      toast.error("Completá todos los campos");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim(), alias: alias.trim() },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Update player profile with alias
      await supabase
        .from("players")
        .update({ alias: alias.trim(), full_name: name.trim() })
        .eq("id", data.user.id);
    }

    toast.success("Cuenta creada! Bienvenido a la Copa Omega Star");
    router.push("/dashboard");
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
            <span className="neon-gold">REGISTRO</span>
          </h1>
          <p className="text-sm text-omega-muted">Unite al torneo Beyblade X</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-omega-muted">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={60}
              className="w-full rounded-xl border border-omega-border bg-omega-card px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="alias" className="text-sm font-medium text-omega-muted">
              Alias de blader
            </label>
            <input
              id="alias"
              type="text"
              required
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: OmegaKing, BladeX77"
              maxLength={30}
              className="w-full rounded-xl border border-omega-border bg-omega-card px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-omega-border bg-omega-card px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-blue focus:ring-2 focus:ring-omega-blue/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-3 font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="size-5" />
                Registrarme
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-omega-muted">
          Ya tenés cuenta?{" "}
          <Link href="/auth/login" className="text-omega-blue hover:underline font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
