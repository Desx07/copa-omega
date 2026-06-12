"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Trophy, Shuffle } from "lucide-react";

export function DashboardTeamsButtons({
  isAdmin,
  isJudge,
}: {
  isAdmin: boolean;
  isJudge: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.teams_enabled === "true"))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !enabled) return null;

  return (
    <>
      {/* Team buttons in engagement grid */}
      <Link href="/team" className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-purple/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
        <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center group-hover:bg-omega-purple/30 transition-colors">
          <Users className="size-5 text-omega-purple" />
        </div>
        <p className="text-xs font-bold text-omega-text">Mi Equipo</p>
        <p className="text-[10px] text-omega-muted leading-tight">Gestion de equipo</p>
      </Link>
      <Link href="/team-ranking" className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-gold/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
        <div className="size-10 rounded-xl bg-omega-gold/20 flex items-center justify-center group-hover:bg-omega-gold/30 transition-colors">
          <Trophy className="size-5 text-omega-gold" />
        </div>
        <p className="text-xs font-bold text-omega-text">Ranking Equipos</p>
        <p className="text-[10px] text-omega-muted leading-tight">Tabla de equipos</p>
      </Link>
    </>
  );
}

export function DashboardTeamsSorteoButton({
  isAdmin,
  isJudge,
}: {
  isAdmin: boolean;
  isJudge: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.teams_enabled === "true"))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !enabled || (!isAdmin && !isJudge)) return null;

  return (
    <Link href="/admin/team-matches/random" className="group rounded-2xl bg-gradient-to-br from-omega-purple to-omega-purple-glow/70 p-4 shadow-md shadow-omega-purple/30 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center text-center col-span-2">
      <div className="size-10 rounded-xl bg-white/20 mb-2 flex items-center justify-center group-hover:bg-white/30 transition-colors">
        <Shuffle className="size-5 text-white" />
      </div>
      <p className="text-xs font-bold text-white">Sorteo Equipos</p>
    </Link>
  );
}
