"use client";

import { useState } from "react";
import {
  Users,
  Star,
  Crown,
  Swords,
  Loader2,
  Check,
  Minus,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id: string;
  alias: string;
  avatar_url: string | null;
}

interface Fight {
  id: string;
  position: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner_player_id: string | null;
  status: string;
  player1: Player | null;
  player2: Player | null;
}

interface TeamInMatch {
  id: string;
  name: string;
  logo_url: string | null;
  stars: number;
}

interface TeamMatch {
  id: string;
  status: string;
  stars_bet: number;
  team1_score: number | null;
  team2_score: number | null;
  winner_team_id: string | null;
  team1: TeamInMatch | null;
  team2: TeamInMatch | null;
  team_match_fights: Fight[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TeamMatchView({
  match,
  isAdmin,
  onUpdate,
}: {
  match: TeamMatch;
  isAdmin: boolean;
  onUpdate?: () => void;
}) {
  const [localFights, setLocalFights] = useState<Fight[]>(
    [...(match.team_match_fights ?? [])].sort((a, b) => a.position - b.position)
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const team1 = match.team1;
  const team2 = match.team2;
  const isCompleted = match.status === "completed";

  // Count wins per team from fights
  const team1FightWins = localFights.filter((f) => f.status === "completed" && f.winner_player_id && team1MemberIds().includes(f.winner_player_id)).length;
  const team2FightWins = localFights.filter((f) => f.status === "completed" && f.winner_player_id && team2MemberIds()).length;

  // Simplified - use scores from match
  const t1Score = match.team1_score ?? 0;
  const t2Score = match.team2_score ?? 0;

  function team1MemberIds(): string[] {
    return localFights.filter((f) => f.player1_id).map((f) => f.player1_id!);
  }

  function team2MemberIds(): string[] {
    return localFights.filter((f) => f.player2_id).map((f) => f.player2_id!);
  }

  async function saveFight(fight: Fight, winnerId: string | null) {
    setSaving(fight.id);
    try {
      const res = await fetch(`/api/team-matches/${match.id}/fights`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fight_id: fight.id,
          winner_player_id: winnerId,
          player1_score: winnerId === fight.player1_id ? 1 : 0,
          player2_score: winnerId === fight.player2_id ? 1 : 0,
          status: winnerId ? "completed" : fight.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Error al guardar");
        return;
      }

      // Update local state
      setLocalFights((prev) =>
        prev.map((f) =>
          f.id === fight.id
            ? {
                ...f,
                winner_player_id: winnerId,
                player1_score: winnerId === f.player1_id ? 1 : 0,
                player2_score: winnerId === f.player2_id ? 1 : 0,
                status: winnerId ? "completed" : f.status,
              }
            : f
        )
      );

      toast.success("Pelea actualizada");
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSaving(null);
    }
  }

  async function handleResolve() {
    const completedFights = localFights.filter((f) => f.status === "completed");
    if (completedFights.length < 2) {
      toast.error("Necesitas resolver al menos 2 peleas");
      return;
    }

    // Count fight wins (simplified by checking p1_score vs p2_score)
    let t1w = 0;
    let t2w = 0;
    for (const f of completedFights) {
      if ((f.player1_score ?? 0) > (f.player2_score ?? 0)) t1w++;
      else if ((f.player2_score ?? 0) > (f.player1_score ?? 0)) t2w++;
    }

    setResolving(true);
    try {
      const res = await fetch(`/api/team-matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1_score: t1w,
          team2_score: t2w,
          winner_team_id: t1w > t2w ? team1?.id : team2?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Error al resolver");
        return;
      }

      toast.success("Partida resuelta");
      onUpdate?.();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setResolving(false);
    }
  }

  // Check if match is decided (2-0)
  const completedCount = localFights.filter((f) => f.status === "completed").length;

  return (
    <div className="space-y-4">
      {/* Teams header */}
      <div className="flex items-center gap-3 py-4">
        {/* Team 1 */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className={`size-16 rounded-xl flex items-center justify-center overflow-hidden border-2 ${
            isCompleted && match.winner_team_id === team1?.id ? "border-omega-gold shadow-lg shadow-omega-gold/20" : "border-omega-purple/30"
          } bg-omega-dark`}>
            {team1?.logo_url ? (
              <img src={team1.logo_url} alt={team1.name} className="size-full object-cover" />
            ) : (
              <Users className="size-7 text-omega-purple" />
            )}
          </div>
          <p className="text-sm font-black text-omega-text text-center">
            {isCompleted && match.winner_team_id === team1?.id && (
              <Crown className="size-3.5 text-omega-gold inline mr-1" />
            )}
            {team1?.name ?? "???"}
          </p>
        </div>

        {/* Score */}
        <div className="text-center shrink-0 px-4">
          <p className="text-3xl font-black">
            <span className={t1Score > t2Score ? "text-omega-gold" : "text-omega-text"}>
              {isCompleted ? t1Score : "-"}
            </span>
            <span className="text-omega-muted mx-2">:</span>
            <span className={t2Score > t1Score ? "text-omega-gold" : "text-omega-text"}>
              {isCompleted ? t2Score : "-"}
            </span>
          </p>
          {match.stars_bet > 0 ? (
            <div className="flex items-center gap-1 justify-center mt-1">
              <Star className="size-3 text-omega-gold fill-omega-gold" />
              <span className="text-xs font-bold text-omega-gold">{match.stars_bet}</span>
            </div>
          ) : (
            <span className="omega-badge omega-badge-green text-[8px]">Amistoso</span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className={`size-16 rounded-xl flex items-center justify-center overflow-hidden border-2 ${
            isCompleted && match.winner_team_id === team2?.id ? "border-omega-gold shadow-lg shadow-omega-gold/20" : "border-omega-blue/30"
          } bg-omega-dark`}>
            {team2?.logo_url ? (
              <img src={team2.logo_url} alt={team2.name} className="size-full object-cover" />
            ) : (
              <Users className="size-7 text-omega-blue" />
            )}
          </div>
          <p className="text-sm font-black text-omega-text text-center">
            {team2?.name ?? "???"}
            {isCompleted && match.winner_team_id === team2?.id && (
              <Crown className="size-3.5 text-omega-gold inline ml-1" />
            )}
          </p>
        </div>
      </div>

      {/* Fight cards */}
      <div className="space-y-3">
        {localFights.map((fight) => {
          const fightCompleted = fight.status === "completed";
          const p1Won = fight.winner_player_id === fight.player1_id;
          const p2Won = fight.winner_player_id === fight.player2_id;

          // Check if this fight is unnecessary (2-0 already decided)
          const decidedBefore = (() => {
            const prevFights = localFights.filter(
              (f) => f.position < fight.position && f.status === "completed"
            );
            let w1 = 0, w2 = 0;
            for (const pf of prevFights) {
              if ((pf.player1_score ?? 0) > (pf.player2_score ?? 0)) w1++;
              else if ((pf.player2_score ?? 0) > (pf.player1_score ?? 0)) w2++;
            }
            return w1 >= 2 || w2 >= 2;
          })();

          if (decidedBefore && !fightCompleted) {
            return (
              <div key={fight.id} className="omega-card px-4 py-3 opacity-40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-omega-muted uppercase">
                    Posicion {fight.position}
                  </span>
                  <span className="omega-badge omega-badge-blue text-[8px]">No necesario</span>
                </div>
                <div className="flex items-center justify-center py-3">
                  <Minus className="size-5 text-omega-muted/30" />
                </div>
              </div>
            );
          }

          return (
            <div
              key={fight.id}
              className={`omega-card overflow-hidden ${
                fightCompleted ? "border-l-4 border-l-omega-green" : "border-l-4 border-l-omega-gold"
              }`}
            >
              <div className="px-4 py-2 bg-omega-dark/40 border-b border-omega-border/20 flex items-center justify-between">
                <span className="text-[10px] font-bold text-omega-muted uppercase tracking-wider">
                  Posicion {fight.position}
                </span>
                {fightCompleted ? (
                  <span className="omega-badge omega-badge-green text-[8px]">Resuelta</span>
                ) : (
                  <span className="omega-badge omega-badge-gold text-[8px]">Pendiente</span>
                )}
              </div>

              <div className="flex items-center px-4 py-3 gap-3">
                {/* Player 1 */}
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`size-10 rounded-full overflow-hidden border-2 bg-omega-dark ${
                    p1Won ? "border-omega-gold" : "border-omega-border/30"
                  }`}>
                    {fight.player1?.avatar_url ? (
                      <img src={fight.player1.avatar_url} alt={fight.player1.alias} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                        {fight.player1?.alias?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-bold text-center truncate max-w-[80px] ${
                    p1Won ? "text-omega-gold" : "text-omega-text"
                  }`}>
                    {p1Won && <Crown className="size-2.5 text-omega-gold inline mr-0.5" />}
                    {fight.player1?.alias ?? "TBD"}
                  </p>
                  {isAdmin && !fightCompleted && fight.player1_id && (
                    <button
                      onClick={() => saveFight(fight, fight.player1_id)}
                      disabled={saving === fight.id}
                      className="omega-btn omega-btn-green px-2 py-1 text-[9px] gap-0.5"
                    >
                      {saving === fight.id ? <Loader2 className="size-2.5 animate-spin" /> : <Check className="size-2.5" />}
                      Gana
                    </button>
                  )}
                </div>

                {/* VS */}
                <div className="shrink-0">
                  <Swords className="size-4 text-omega-muted" />
                </div>

                {/* Player 2 */}
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`size-10 rounded-full overflow-hidden border-2 bg-omega-dark ${
                    p2Won ? "border-omega-gold" : "border-omega-border/30"
                  }`}>
                    {fight.player2?.avatar_url ? (
                      <img src={fight.player2.avatar_url} alt={fight.player2.alias} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-xs font-black text-omega-blue">
                        {fight.player2?.alias?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-bold text-center truncate max-w-[80px] ${
                    p2Won ? "text-omega-gold" : "text-omega-text"
                  }`}>
                    {fight.player2?.alias ?? "TBD"}
                    {p2Won && <Crown className="size-2.5 text-omega-gold inline ml-0.5" />}
                  </p>
                  {isAdmin && !fightCompleted && fight.player2_id && (
                    <button
                      onClick={() => saveFight(fight, fight.player2_id)}
                      disabled={saving === fight.id}
                      className="omega-btn omega-btn-green px-2 py-1 text-[9px] gap-0.5"
                    >
                      {saving === fight.id ? <Loader2 className="size-2.5 animate-spin" /> : <Check className="size-2.5" />}
                      Gana
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolve button */}
      {isAdmin && !isCompleted && completedCount >= 2 && (
        <button
          onClick={handleResolve}
          disabled={resolving}
          className="omega-btn omega-btn-gold w-full py-3 text-sm"
          data-testid="resolve-team-match"
        >
          {resolving ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Crown className="size-5" />
              Resolver partida
            </>
          )}
        </button>
      )}
    </div>
  );
}
