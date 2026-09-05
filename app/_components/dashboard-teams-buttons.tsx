"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Trophy, Swords } from "lucide-react";

// Accesos DIRECTOS de equipos para el jugador (nada de hub intermedio).
// Se renderiza DENTRO del grid de "quick links" del dashboard, así cada card
// fluye junto al resto (Predicciones, Combos, etc.).
//
// Reglas de visibilidad (vista jugador, solo participación):
//   - Todo aparece solo si teams_enabled === "true".
//   - "Liga" solo si además mode_liga_enabled === "true".
//   - Acá NO va ningún control de gestión: el sorteo/admin vive en la Zona Juez,
//     gateado por rol server-side.
export function DashboardTeamsButtons() {
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [ligaEnabled, setLigaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app-config")
      .then((r) => r.json())
      .then((d) => {
        setTeamsEnabled(d.teams_enabled === "true");
        setLigaEnabled(d.mode_liga_enabled === "true");
      })
      .catch(() => {
        setTeamsEnabled(false);
        setLigaEnabled(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !teamsEnabled) return null;

  return (
    <>
      <Link
        href="/team"
        className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-purple/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        data-testid="dashboard-team-link"
      >
        <div className="size-10 rounded-xl bg-omega-purple/20 flex items-center justify-center group-hover:bg-omega-purple/30 transition-colors">
          <Users className="size-5 text-omega-purple" />
        </div>
        <p className="text-xs font-bold text-omega-text">Mi Equipo</p>
        <p className="text-[10px] text-omega-muted leading-tight">Tu equipo y miembros</p>
      </Link>

      <Link
        href="/team-ranking"
        className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-gold/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        data-testid="dashboard-team-ranking-link"
      >
        <div className="size-10 rounded-xl bg-omega-gold/20 flex items-center justify-center group-hover:bg-omega-gold/30 transition-colors">
          <Trophy className="size-5 text-omega-gold" />
        </div>
        <p className="text-xs font-bold text-omega-text">Ranking equipos</p>
        <p className="text-[10px] text-omega-muted leading-tight">Tabla por estrellas</p>
      </Link>

      {ligaEnabled && (
        <Link
          href="/league"
          className="group omega-card p-3 flex flex-col items-center gap-1.5 text-center hover:border-omega-green/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          data-testid="dashboard-league-link"
        >
          <div className="size-10 rounded-xl bg-omega-green/20 flex items-center justify-center group-hover:bg-omega-green/30 transition-colors">
            <Swords className="size-5 text-omega-green" />
          </div>
          <p className="text-xs font-bold text-omega-text">Liga</p>
          <p className="text-[10px] text-omega-muted leading-tight">Tabla, fechas y partidos</p>
        </Link>
      )}
    </>
  );
}
