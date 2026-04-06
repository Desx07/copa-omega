"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
  Star,
  Trophy,
  Shield,
  Crown,
  Medal,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  player_id: string;
  role: string;
  player: { id: string; alias: string; avatar_url: string | null; stars: number };
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  stars: number;
  wins: number;
  losses: number;
  team_members: TeamMember[];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TeamRankingPage() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsEnabled, setTeamsEnabled] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Check feature flag
      try {
        const configRes = await fetch("/api/app-config");
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.teams_enabled === "false") {
            setTeamsEnabled(false);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch {
        toast.error("Error cargando equipos");
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 text-omega-purple animate-spin" />
      </div>
    );
  }

  if (!teamsEnabled) {
    return (
      <div className="max-w-lg mx-auto pb-10 pt-6 px-4 space-y-6">
        <Link href="/dashboard" className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
        <div className="omega-card p-8 text-center space-y-3">
          <Shield className="size-12 text-omega-muted/30 mx-auto" />
          <h2 className="text-xl font-black text-omega-text">Equipos deshabilitados</h2>
          <p className="text-sm text-omega-muted">La funcion de equipos no esta activa.</p>
        </div>
      </div>
    );
  }

  // Sort by stars desc, then wins desc
  const sorted = [...teams].sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="-mx-4 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-omega-gold/15 via-omega-surface to-omega-purple/10 shadow-lg shadow-omega-gold/10">
        <div className="px-5 pt-5 pb-6">
          <Link
            href="/dashboard"
            className="text-sm text-omega-muted hover:text-omega-text transition-colors inline-flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-omega-gold/20 flex items-center justify-center ring-2 ring-omega-gold/30">
              <Trophy className="size-6 text-omega-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-black neon-gold">RANKING EQUIPOS</h1>
              <p className="text-xs text-omega-muted">
                {sorted.length} equipos registrados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking table */}
      <div className="px-4 space-y-2">
        {sorted.length === 0 ? (
          <div className="omega-card p-8 text-center space-y-3">
            <Users className="size-12 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted">No hay equipos registrados</p>
          </div>
        ) : (
          sorted.map((team, idx) => {
            const pos = idx + 1;
            const winRate =
              team.wins + team.losses > 0
                ? Math.round((team.wins / (team.wins + team.losses)) * 100)
                : 0;

            const podiumClass =
              pos === 1
                ? "border-l-omega-gold"
                : pos === 2
                  ? "border-l-[#C0C0C0]"
                  : pos === 3
                    ? "border-l-[#CD7F32]"
                    : "border-l-omega-border/30";

            const PosIcon =
              pos === 1 ? Crown : pos === 2 ? Medal : pos === 3 ? Medal : null;

            return (
              <div
                key={team.id}
                className={`omega-card px-4 py-3 flex items-center gap-3 border-l-4 ${podiumClass} transition-all hover:shadow-md`}
              >
                {/* Position */}
                <div className="flex items-center justify-center size-8 shrink-0">
                  {PosIcon ? (
                    <PosIcon
                      className={`size-5 ${
                        pos === 1
                          ? "text-omega-gold"
                          : pos === 2
                            ? "text-[#C0C0C0]"
                            : "text-[#CD7F32]"
                      }`}
                    />
                  ) : (
                    <span className="text-sm font-black text-omega-muted">
                      #{pos}
                    </span>
                  )}
                </div>

                {/* Team info */}
                <div className="size-10 rounded-xl bg-omega-purple/15 flex items-center justify-center overflow-hidden shrink-0">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="size-full object-cover" />
                  ) : (
                    <Users className="size-5 text-omega-purple" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-omega-text truncate">
                    {team.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-omega-muted">
                    <span>{team.team_members?.length ?? 0} miembros</span>
                    <span>-</span>
                    <span>{winRate}% WR</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="size-3 text-omega-gold fill-omega-gold" />
                    <span className="text-sm font-black text-omega-gold">{team.stars}</span>
                  </div>
                  <p className="text-[10px] text-omega-muted">
                    {team.wins}W/{team.losses}L
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
