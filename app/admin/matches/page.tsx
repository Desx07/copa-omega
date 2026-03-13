import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Swords, Trophy, ArrowLeft, Plus, Crown } from "lucide-react";

export default async function AdminMatchesPage() {
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

  // Obtener todas las partidas con datos de jugadores
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "*, player1:players!player1_id(alias), player2:players!player2_id(alias), winner:players!winner_id(alias)"
    )
    .order("created_at", { ascending: false });

  const allMatches = matches ?? [];
  const pendingMatches = allMatches.filter((m) => m.status === "pending");
  const completedMatches = allMatches.filter((m) => m.status === "completed");

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/players"
            className="flex items-center justify-center size-10 rounded-xl bg-omega-card border border-omega-border text-omega-muted hover:text-omega-blue hover:border-omega-blue/50 transition-all"
            aria-label="Ver jugadores"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Swords className="size-5 text-omega-blue" />
            <h1 className="text-2xl font-black neon-blue">PARTIDAS</h1>
          </div>
        </div>
        <Link
          href="/admin/matches/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-omega-purple to-omega-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-omega-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Nueva
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Swords className="size-4 text-omega-blue mx-auto mb-1" />
          <p className="text-xl font-black text-omega-blue">{allMatches.length}</p>
          <p className="text-[11px] text-omega-muted">total</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Star className="size-4 text-omega-gold mx-auto mb-1" />
          <p className="text-xl font-black text-omega-gold">{pendingMatches.length}</p>
          <p className="text-[11px] text-omega-muted">pendientes</p>
        </div>
        <div className="rounded-xl bg-omega-card border border-omega-border p-3 text-center">
          <Trophy className="size-4 text-omega-green mx-auto mb-1" />
          <p className="text-xl font-black text-omega-green">{completedMatches.length}</p>
          <p className="text-[11px] text-omega-muted">completadas</p>
        </div>
      </div>

      {/* Matches list */}
      <div className="space-y-3">
        {allMatches.length === 0 ? (
          <div className="rounded-xl bg-omega-card border border-omega-border p-8 text-center">
            <Swords className="size-8 text-omega-muted mx-auto mb-3" />
            <p className="text-omega-muted text-sm">No hay partidas registradas</p>
            <Link
              href="/admin/matches/new"
              className="inline-flex items-center gap-2 mt-4 text-sm text-omega-blue hover:underline font-medium"
            >
              <Plus className="size-4" />
              Crear primera partida
            </Link>
          </div>
        ) : (
          allMatches.map((match) => {
            const isPending = match.status === "pending";
            const isCompleted = match.status === "completed";
            const isCancelled = match.status === "cancelled";

            return (
              <Link
                key={match.id}
                href={`/admin/matches/${match.id}`}
                className={`block rounded-xl bg-omega-card border border-omega-border p-4 transition-all hover:border-omega-blue/30 ${
                  isCancelled ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  {/* Status badge */}
                  {isPending && (
                    <span className="inline-flex items-center rounded-full bg-omega-gold/10 border border-omega-gold/30 px-2.5 py-0.5 text-[10px] font-bold text-omega-gold">
                      PENDIENTE
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center rounded-full bg-omega-green/10 border border-omega-green/30 px-2.5 py-0.5 text-[10px] font-bold text-omega-green">
                      COMPLETADA
                    </span>
                  )}
                  {isCancelled && (
                    <span className="inline-flex items-center rounded-full bg-omega-red/10 border border-omega-red/30 px-2.5 py-0.5 text-[10px] font-bold text-omega-red">
                      CANCELADA
                    </span>
                  )}

                  {/* Stars bet */}
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                    <span className="text-sm font-black text-omega-gold">
                      {match.stars_bet}
                    </span>
                  </div>
                </div>

                {/* Players */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p
                      className={`text-sm font-bold ${
                        isCompleted && match.winner?.alias === match.player1?.alias
                          ? "text-omega-gold"
                          : "text-omega-text"
                      }`}
                    >
                      {isCompleted && match.winner?.alias === match.player1?.alias && (
                        <Crown className="size-3.5 text-omega-gold inline mr-1 -mt-0.5" />
                      )}
                      {match.player1?.alias ?? "???"}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="text-xs font-bold text-omega-muted">VS</span>
                  </div>

                  <div className="flex-1 text-center">
                    <p
                      className={`text-sm font-bold ${
                        isCompleted && match.winner?.alias === match.player2?.alias
                          ? "text-omega-gold"
                          : "text-omega-text"
                      }`}
                    >
                      {match.player2?.alias ?? "???"}
                      {isCompleted && match.winner?.alias === match.player2?.alias && (
                        <Crown className="size-3.5 text-omega-gold inline ml-1 -mt-0.5" />
                      )}
                    </p>
                  </div>
                </div>

                {/* Footer: date + resolve button for pending */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-omega-border/50">
                  <p className="text-[11px] text-omega-muted">
                    {new Date(match.created_at).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {isPending && (
                    <span className="text-xs font-bold text-omega-blue">
                      Resolver &rarr;
                    </span>
                  )}
                  {isCompleted && match.winner && (
                    <p className="text-[11px] text-omega-green">
                      Ganador: <span className="font-bold">{match.winner.alias}</span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
