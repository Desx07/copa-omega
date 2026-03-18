"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Swords, Target, BarChart3, Trophy, MessageSquare, Zap } from "lucide-react";

interface Mission {
  id: string;
  label: string;
  description: string;
  icon: string;
  check: string;
  completed: boolean;
}

const ICON_MAP: Record<string, typeof Swords> = {
  Swords, Target, BarChart3, Trophy, MessageSquare, Zap,
};

const HREF_MAP: Record<string, string> = {
  combo: "/combos",
  prediction: "/predictions",
  poll: "/polls",
  ranking: "/ranking",
  comment: "/feed",
  challenge: "/challenges",
};

export default function WeeklyMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missions")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMissions(data.missions); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (missions.length === 0) return null;

  const completed = missions.filter(m => m.completed).length;
  const allDone = completed === missions.length;
  const progress = Math.round((completed / missions.length) * 100);

  // All done: show compact badge instead of full card
  if (allDone) {
    return (
      <div className="omega-card px-4 py-3 border-l-4 border-l-omega-green flex items-center gap-2">
        <Check className="size-4 text-omega-green" />
        <span className="text-xs font-bold text-omega-green">Misiones completadas</span>
        <span className="text-[10px] text-omega-muted ml-auto">{completed}/{missions.length}</span>
      </div>
    );
  }

  return (
    <div className="omega-card p-4 space-y-3 border-l-4 border-l-omega-blue">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-omega-blue" />
          <h3 className="text-sm font-bold text-omega-text">Misiones de la semana</h3>
        </div>
        <span className="text-[10px] text-omega-muted font-bold">{completed}/{missions.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-omega-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-omega-blue to-omega-purple rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mission list — only show pending */}
      <div className="space-y-1">
        {missions.filter(m => !m.completed).map(m => {
          const Icon = ICON_MAP[m.icon] || Target;
          return (
            <Link
              key={m.id}
              href={HREF_MAP[m.check] || "/dashboard"}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all bg-omega-dark/40 hover:bg-omega-blue/10"
            >
              <div className="size-6 rounded-full flex items-center justify-center shrink-0 bg-omega-blue/20 text-omega-blue">
                <Icon className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-omega-text">{m.label}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
