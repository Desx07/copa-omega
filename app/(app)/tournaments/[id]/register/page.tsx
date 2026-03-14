"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Loader2,
  UserPlus,
  CheckCircle,
  XCircle,
  Star,
  Users,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  format: string;
  max_participants: number;
  status: string;
}

interface PlayerProfile {
  id: string;
  alias: string;
  full_name: string;
  avatar_url: string | null;
  stars: number;
}

const FORMAT_LABELS: Record<string, string> = {
  round_robin: "Round Robin",
  swiss: "Suizo",
  single_elimination: "Eliminacion directa",
};

export default function TournamentRegisterPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tournamentId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Quick register form state (for anonymous users)
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Fetch tournament
    const { data: t, error: tErr } = await supabase
      .from("tournaments")
      .select("id, name, description, format, max_participants, status")
      .eq("id", tournamentId)
      .single();

    if (tErr || !t) {
      toast.error("Torneo no encontrado");
      router.push("/tournaments");
      return;
    }

    setTournament(t);

    // Count participants
    const { count } = await supabase
      .from("tournament_participants")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    const pCount = count ?? 0;
    setParticipantCount(pCount);
    setIsFull(pCount >= t.max_participants);

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Fetch player profile
      const { data: profile } = await supabase
        .from("players")
        .select("id, alias, full_name, avatar_url, stars")
        .eq("id", user.id)
        .single();

      if (profile) {
        setPlayer(profile);
      }

      // Check if already registered
      const { data: existing } = await supabase
        .from("tournament_participants")
        .select("id")
        .eq("tournament_id", tournamentId)
        .eq("player_id", user.id)
        .maybeSingle();

      if (existing) {
        setIsAlreadyRegistered(true);
      }
    }

    setLoading(false);
  }, [tournamentId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Confirm registration (logged-in user)
  async function handleConfirmRegistration() {
    if (!player || !tournament) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("tournament_participants").insert({
        tournament_id: tournament.id,
        player_id: player.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya estas inscripto en este torneo");
        } else {
          toast.error(error.message);
        }
        setSubmitting(false);
        return;
      }

      toast.success("Inscripcion confirmada! Nos vemos en la arena.");
      router.push(`/tournaments/${tournament.id}`);
    } catch {
      toast.error("Error de conexion");
      setSubmitting(false);
    }
  }

  // Quick register (anonymous user) — create account + register in one step
  async function handleQuickRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !alias.trim() || !email.trim() || !password.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (!tournament) return;
    setSubmitting(true);

    try {
      const supabase = createClient();

      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim(), alias: alias.trim() },
        },
      });

      if (authError) {
        toast.error(authError.message);
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        toast.error("Error al crear la cuenta");
        setSubmitting(false);
        return;
      }

      // 2. Update player profile (trigger creates the row, we update alias)
      await supabase
        .from("players")
        .update({ alias: alias.trim(), full_name: name.trim() })
        .eq("id", authData.user.id);

      // 3. Register in tournament
      const { error: regError } = await supabase
        .from("tournament_participants")
        .insert({
          tournament_id: tournament.id,
          player_id: authData.user.id,
        });

      if (regError) {
        // Account created but registration failed
        toast.error(
          "Cuenta creada pero hubo un error al inscribirte. Intenta desde la pagina del torneo."
        );
        router.push(`/tournaments/${tournament.id}`);
        return;
      }

      toast.success("Bienvenido a la arena, blader! Ya estas inscripto.");
      router.push(`/tournaments/${tournament.id}`);
    } catch {
      toast.error("Error de conexion");
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 text-omega-blue animate-spin" />
      </div>
    );
  }

  // Tournament not in registration
  if (!tournament || tournament.status !== "registration") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al torneo
        </Link>
        <div className="rounded-2xl border border-omega-border bg-omega-card/50 p-8 text-center space-y-3 backdrop-blur-sm">
          <XCircle className="size-10 text-omega-red/40 mx-auto" />
          <p className="text-omega-muted font-bold">
            La inscripcion para este torneo no esta abierta
          </p>
          <Link
            href={`/tournaments/${tournamentId}`}
            className="inline-flex text-sm text-omega-blue hover:underline"
          >
            Ver detalles del torneo
          </Link>
        </div>
      </div>
    );
  }

  // Already registered
  if (isAlreadyRegistered) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al torneo
        </Link>
        <div className="rounded-2xl border border-omega-green/30 bg-omega-green/5 p-8 text-center space-y-3 backdrop-blur-sm">
          <CheckCircle className="size-10 text-omega-green mx-auto" />
          <p className="text-omega-green font-bold text-lg">
            Ya estas inscripto!
          </p>
          <p className="text-sm text-omega-muted">
            Preparate para la batalla. Te veremos en el torneo.
          </p>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-6 py-3 font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trophy className="size-4" />
            Ver torneo
          </Link>
        </div>
      </div>
    );
  }

  // Full tournament
  if (isFull) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        <Link
          href={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al torneo
        </Link>
        <div className="rounded-2xl border border-omega-red/30 bg-omega-red/5 p-8 text-center space-y-3 backdrop-blur-sm">
          <Users className="size-10 text-omega-red/40 mx-auto" />
          <p className="text-omega-red font-bold text-lg">Torneo lleno</p>
          <p className="text-sm text-omega-muted">
            Se alcanzo el maximo de {tournament.max_participants} participantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Back */}
      <Link
        href={`/tournaments/${tournament.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al torneo
      </Link>

      {/* Tournament info card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-omega-gold/20 via-omega-card/60 to-omega-purple/10 p-5 shadow-lg shadow-omega-gold/10">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-omega-gold via-omega-purple to-omega-blue" />
        <div className="text-center space-y-1.5">
          <Trophy className="size-8 text-omega-gold mx-auto" />
          <h1 className="text-lg font-black text-omega-text">
            {tournament.name}
          </h1>
          <p className="text-[11px] text-omega-muted uppercase tracking-wider">
            {FORMAT_LABELS[tournament.format]} — Max{" "}
            {tournament.max_participants} jugadores
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <Users className="size-3.5 text-omega-purple" />
            <span className="font-bold text-omega-text">
              {participantCount}
            </span>
            <span className="text-omega-muted">
              / {tournament.max_participants} inscriptos
            </span>
          </div>
        </div>
      </div>

      {/* === LOGGED IN USER: Confirm registration === */}
      {player ? (
        <div className="rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black neon-blue">CONFIRMAR INSCRIPCION</h2>
            <p className="text-sm text-omega-muted">
              Tu perfil de blader esta listo
            </p>
          </div>

          {/* Player preview */}
          <div className="flex items-center gap-4 rounded-xl bg-omega-dark/60 border border-omega-border/30 p-4">
            <div className="size-14 rounded-full border-2 border-omega-purple overflow-hidden bg-omega-dark shrink-0">
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.alias}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-xl font-black text-omega-purple">
                  {player.alias.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-omega-text truncate">
                {player.alias}
              </p>
              <p className="text-xs text-omega-muted truncate">
                {player.full_name}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="size-4 text-omega-gold fill-omega-gold" />
              <span className="text-lg font-black text-omega-gold">
                {player.stars}
              </span>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirmRegistration}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-3 font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="size-5" />
                Confirmar inscripcion
              </>
            )}
          </button>
        </div>
      ) : (
        /* === ANONYMOUS USER: Quick register form === */
        <div className="rounded-2xl border border-omega-border/50 bg-omega-card/40 backdrop-blur-xl p-6 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black neon-gold">SUMATE AL TORNEO</h2>
            <p className="text-sm text-omega-muted">
              Crea tu cuenta y quedate inscripto de una
            </p>
          </div>

          {/* Login link for existing users */}
          <div className="rounded-lg bg-omega-blue/5 border border-omega-blue/20 px-4 py-3 text-center">
            <p className="text-xs text-omega-muted">
              Ya tenes cuenta?{" "}
              <Link
                href={`/auth/login?redirect=/tournaments/${tournament.id}/register`}
                className="text-omega-blue font-bold hover:underline inline-flex items-center gap-1"
              >
                <LogIn className="size-3" />
                Inicia sesion
              </Link>
            </p>
          </div>

          {/* Quick register form */}
          <form onSubmit={handleQuickRegister} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs font-bold text-omega-muted uppercase tracking-wider"
              >
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
                className="w-full rounded-lg border border-omega-border bg-omega-dark/80 px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="alias"
                className="text-xs font-bold text-omega-muted uppercase tracking-wider"
              >
                Tu nombre de batalla
              </label>
              <input
                id="alias"
                type="text"
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej: ShadowDranzer, StarBreaker"
                maxLength={30}
                className="w-full rounded-lg border border-omega-border bg-omega-dark/80 px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-bold text-omega-muted uppercase tracking-wider"
              >
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
              <label
                htmlFor="password"
                className="text-xs font-bold text-omega-muted uppercase tracking-wider"
              >
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
                className="w-full rounded-lg border border-omega-border bg-omega-dark/80 px-4 py-3 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none focus:border-omega-purple focus:ring-2 focus:ring-omega-purple/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-3 font-bold text-white shadow-[0_0_20px_rgba(123,47,247,0.3)] hover:shadow-[0_0_30px_rgba(123,47,247,0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="size-5" />
                  Crear cuenta e inscribirme
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
