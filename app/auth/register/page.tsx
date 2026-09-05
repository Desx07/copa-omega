"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, UserPlus, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !alias.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    if (alias.trim().length < 3) {
      toast.error("Tu nombre de batalla debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    try {
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
        return;
      }

      if (data.user) {
        const { error: updateError } = await supabase
          .from("players")
          .update({ alias: alias.trim(), full_name: name.trim() })
          .eq("id", data.user.id);

        if (updateError) {
          toast.error("Cuenta creada pero hubo un error guardando tu alias");
        }

        // Evento de feed en segundo plano: NO debe bloquear el ingreso al
        // dashboard. Si falla (p.ej. RLS) o tarda, el registro igual redirige.
        void supabase
          .from("activity_feed")
          .insert({
            type: "new_player",
            actor_id: data.user.id,
            target_id: null,
            reference_id: null,
            metadata: { alias: alias.trim() },
          })
          .then(undefined, () => {});
      }

      toast.success("Bienvenido a la arena, blader!");
      // Hard navigation (no router.push): fuerza al servidor a leer la cookie de
      // sesion recien creada por signUp. Con soft navigation la cookie no siempre
      // esta propagada y el layout de (app) rebota a /auth/login.
      window.location.href = "/dashboard";
    } catch {
      toast.error("Error de conexión, intentá de nuevo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="omega-card p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-1">
          <Swords className="size-6 text-omega-purple neon-purple" />
        </div>
        <h1 className="text-2xl font-black neon-gold">SUMATE A LA COPA</h1>
        <p className="text-sm text-omega-muted">Arma tu perfil de blader y empeza a competir</p>
      </div>

      {/* Divider */}
      <div className="energy-line" />

      {/* Form */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
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
            className="omega-input py-3"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="alias" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Tu nombre de batalla
          </label>
          <input
            id="alias"
            type="text"
            required
            minLength={3}
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Ej: ShadowDranzer, StarBreaker"
            maxLength={30}
            className="omega-input py-3"
          />
        </div>

        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-bold text-omega-muted uppercase tracking-wider">
            Contrasena
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimo 6 caracteres"
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
              <UserPlus className="size-5" />
              Crear mi perfil de blader
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="energy-line" />

      <p className="text-center text-sm text-omega-muted">
        Ya sos blader?{" "}
        <Link href="/auth/login" className="text-omega-blue hover:underline font-medium">
          Entra aca
        </Link>
      </p>
    </div>
  );
}
