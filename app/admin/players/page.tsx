import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Users, Shield, ArrowLeft, UserX, UserCheck } from "lucide-react";

export default async function AdminPlayersPage() {
  const supabase = await createClient();

  // Verificar autenticacion
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Verificar que es admin
  const { data: profile } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/dashboard");
  }

  // Obtener todos los jugadores ordenados por estrellas
  const { data: players } = await supabase
    .from("players")
    .select("id, full_name, alias, stars, wins, losses, is_eliminated, is_admin, created_at")
    .order("stars", { ascending: false });

  const allPlayers = players ?? [];
  const totalPlayers = allPlayers.length;
  const activePlayers = allPlayers.filter((p) => !p.is_eliminated).length;
  const eliminatedPlayers = allPlayers.filter((p) => p.is_eliminated).length;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/matches"
          className="flex items-center justify-center size-10 rounded-xl bg-omega-card border border-omega-border text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
          aria-label="Volver a partidas"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-omega-purple" />
          <h1 className="text-2xl font-black neon-blue">JUGADORES</h1>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Users className="size-4 text-omega-blue mx-auto mb-1" />
          <p className="text-xl font-black text-omega-blue">{totalPlayers}</p>
          <p className="text-[11px] text-omega-muted">total</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <UserCheck className="size-4 text-omega-green mx-auto mb-1" />
          <p className="text-xl font-black text-omega-green">{activePlayers}</p>
          <p className="text-[11px] text-omega-muted">activos</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <UserX className="size-4 text-omega-red mx-auto mb-1" />
          <p className="text-xl font-black text-omega-red">{eliminatedPlayers}</p>
          <p className="text-[11px] text-omega-muted">eliminados</p>
        </div>
      </div>

      {/* Players list */}
      <div className="space-y-3">
        {allPlayers.length === 0 ? (
          <div className="rounded-xl bg-omega-card border border-omega-border p-8 text-center">
            <Users className="size-8 text-omega-muted mx-auto mb-3" />
            <p className="text-omega-muted text-sm">No hay jugadores registrados</p>
          </div>
        ) : (
          allPlayers.map((player, index) => {
            const rank = index + 1;
            const isEliminated = player.is_eliminated;

            return (
              <div
                key={player.id}
                className={`rounded-xl bg-omega-card border border-omega-border p-4 transition-all ${
                  isEliminated ? "opacity-50" : "hover:border-omega-blue/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div
                    className={`flex items-center justify-center size-9 rounded-full font-black text-sm shrink-0 ${
                      rank === 1
                        ? "bg-omega-gold/20 text-omega-gold"
                        : rank === 2
                          ? "bg-omega-blue/20 text-omega-blue"
                          : rank === 3
                            ? "bg-omega-purple/20 text-omega-purple"
                            : "bg-omega-card border border-omega-border text-omega-muted"
                    }`}
                  >
                    #{rank}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-base font-bold truncate ${
                          isEliminated
                            ? "line-through text-omega-muted"
                            : "text-omega-text"
                        }`}
                      >
                        {player.alias}
                      </p>
                      {player.is_admin && (
                        <Shield className="size-3.5 text-omega-purple shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-omega-muted truncate">
                      {player.full_name}
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Star
                      className={`size-4 ${
                        isEliminated
                          ? "text-omega-muted"
                          : "text-omega-gold fill-omega-gold"
                      }`}
                    />
                    <span
                      className={`text-sm font-black ${
                        isEliminated ? "text-omega-muted" : "text-omega-gold"
                      }`}
                    >
                      {player.stars}
                    </span>
                  </div>

                  {/* W-L record */}
                  <div className="text-xs text-omega-muted shrink-0 tabular-nums">
                    <span className="text-omega-green">{player.wins}W</span>
                    {"-"}
                    <span className="text-omega-red">{player.losses}L</span>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    {isEliminated ? (
                      <span className="inline-flex items-center rounded-full bg-omega-red/10 border border-omega-red/30 px-2 py-0.5 text-[10px] font-bold text-omega-red">
                        ELIMINADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-omega-green/10 border border-omega-green/30 px-2 py-0.5 text-[10px] font-bold text-omega-green">
                        ACTIVO
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
