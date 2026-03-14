"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  format: string;
  max_participants: number;
  status: string;
}

export default function TournamentRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const supabase = createClient();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [player, setPlayer] = useState<{ id: string; alias: string; avatar_url: string | null; stars: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) {
        toast.error("Torneo no encontrado");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTournament(data);
      setParticipantCount(data.participants?.length ?? 0);

      if (user) {
        setIsLoggedIn(true);
        const { data: playerData } = await supabase
          .from("players")
          .select("id, alias, avatar_url, stars")
          .eq("id", user.id)
          .single();
        setPlayer(playerData);

        const already = data.participants?.some((p: { player_id: string }) => p.player_id === user.id);
        setAlreadyRegistered(!!already);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRegister() {
    if (!player) return;
    setRegistering(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al inscribirse");
        return;
      }
      toast.success("Te inscribiste al torneo!");
      setAlreadyRegistered(true);
      setParticipantCount((c) => c + 1);
    } catch {
      toast.error("Error de conexion");
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <XCircle className="size-12 text-omega-red mx-auto" />
        <p className="text-lg font-bold">Torneo no encontrado</p>
        <Link href="/tournaments" className="text-sm text-omega-blue hover:underline">
          Ver torneos disponibles
        </Link>
      </div>
    );
  }

  if (tournament.status !== "registration") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <Trophy className="size-12 text-omega-muted mx-auto" />
        <p className="text-lg font-bold">Las inscripciones cerraron</p>
        <p className="text-sm text-omega-muted">Este torneo ya no acepta nuevos participantes.</p>
        <Link href={`/tournaments/${tournamentId}`} className="text-sm text-omega-blue hover:underline">
          Ver torneo
        </Link>
      </div>
    );
  }

  const isFull = participantCount >= tournament.max_participants;

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-purple transition-colors">
        <ArrowLeft className="size-4" />
        Torneos
      </Link>

      {/* Tournament info */}
      <div className="omega-card p-5 text-center space-y-3">
        <Trophy className="size-10 text-omega-gold mx-auto" />
        <h1 className="text-xl font-black text-omega-text">{tournament.name}</h1>
        <p className="text-sm text-omega-muted">
          {tournament.format === "single_elimination" ? "Eliminacion directa" :
           tournament.format === "round_robin" ? "Round Robin" : "Suizo"}
          {" · "}
          {participantCount}/{tournament.max_participants} inscriptos
        </p>
      </div>

      {/* Not logged in */}
      {!isLoggedIn && (
        <div className="omega-card p-6 text-center space-y-4">
          <LogIn className="size-8 text-omega-blue mx-auto" />
          <p className="text-sm font-bold text-omega-text">Necesitas una cuenta para inscribirte</p>
          <p className="text-xs text-omega-muted">Inicia sesion o crea tu cuenta de blader para participar.</p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/auth/login?redirect=/tournaments/${tournamentId}/register`}
              className="omega-btn omega-btn-primary w-full px-4 py-3"
            >
              Iniciar sesion
            </Link>
            <Link
              href={`/auth/register?redirect=/tournaments/${tournamentId}/register`}
              className="omega-btn omega-btn-secondary w-full px-4 py-3 text-sm"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      )}

      {/* Logged in -- show profile + register button */}
      {isLoggedIn && player && (
        <div className="omega-card p-6 space-y-4">
          {/* Player preview */}
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full border-2 border-omega-purple overflow-hidden bg-omega-dark">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-xl font-black text-omega-purple">
                  {player.alias.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-black text-omega-text">{player.alias}</p>
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                <span className="text-sm font-bold text-omega-gold">{player.stars}</span>
              </div>
            </div>
          </div>

          {/* Action */}
          {alreadyRegistered ? (
            <div className="flex items-center justify-center gap-2 omega-badge omega-badge-green px-4 py-3 text-sm">
              <CheckCircle className="size-5" />
              <span className="font-bold">Ya estas inscripto!</span>
            </div>
          ) : isFull ? (
            <div className="flex items-center justify-center gap-2 omega-badge omega-badge-red px-4 py-3 text-sm">
              <XCircle className="size-5" />
              <span className="font-bold">Torneo completo</span>
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="omega-btn omega-btn-primary w-full px-4 py-3 text-base"
            >
              {registering ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Trophy className="size-5" />
                  Inscribirme al torneo
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
