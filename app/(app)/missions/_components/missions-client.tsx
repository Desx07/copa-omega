"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Trophy,
  Swords,
  Flame,
  Shield,
  Star,
  Users,
  Heart,
  Eye,
  Box,
  Sparkles,
  Layout,
  Calendar,
  Clock,
  Zap,
  Coins,
  ShieldCheck,
  Crown,
  Medal,
  Loader2,
  Check,
  Lock,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────

interface DailyMission {
  id: string;
  mission_id: string;
  description: string;
  type: string;
  target_value: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completed_at: string | null;
  reward_oc: number;
  reward_xp: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "combat" | "social" | "collector" | "tournament" | "special";
  requirement_type: string;
  requirement_value: number;
  reward_oc: number;
  reward_xp: number;
  reward_badge: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  unlocked_at: string | null;
  current_progress: number;
}

type CategoryKey = "all" | "combat" | "social" | "collector" | "tournament" | "special";

// ── Icon map ─────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Swords,
  Flame,
  Shield,
  Crown,
  Star,
  Users,
  Heart,
  Eye,
  Box,
  Sparkles,
  Layout,
  Trophy,
  Calendar,
  Clock,
  Zap,
  Coins,
  ShieldCheck,
  Medal,
  Target,
  Lock,
  Gift,
};

// ── Category config ──────────────────────────

const CATEGORY_CONFIG: Record<CategoryKey, { label: string; color: string }> = {
  all: { label: "Todos", color: "text-omega-text" },
  combat: { label: "Combate", color: "text-omega-red" },
  social: { label: "Social", color: "text-omega-blue" },
  collector: { label: "Coleccion", color: "text-omega-green" },
  tournament: { label: "Torneo", color: "text-omega-gold" },
  special: { label: "Especial", color: "text-omega-purple" },
};

// ── Rarity config ────────────────────────────

const RARITY_CONFIG: Record<string, {
  label: string;
  border: string;
  bg: string;
  text: string;
  glow: string;
}> = {
  common: {
    label: "Comun",
    border: "border-omega-muted/30",
    bg: "bg-omega-muted/10",
    text: "text-omega-muted",
    glow: "",
  },
  rare: {
    label: "Raro",
    border: "border-omega-blue/40",
    bg: "bg-omega-blue/10",
    text: "text-omega-blue",
    glow: "",
  },
  epic: {
    label: "Epico",
    border: "border-omega-purple/50",
    bg: "bg-omega-purple/15",
    text: "text-omega-purple",
    glow: "shadow-[0_0_15px_rgba(123,47,247,0.2)]",
  },
  legendary: {
    label: "Legendario",
    border: "border-omega-gold/60",
    bg: "bg-omega-gold/10",
    text: "text-omega-gold",
    glow: "shadow-[0_0_20px_rgba(255,214,10,0.25)]",
  },
};

// ── Mission type icons ───────────────────────

const MISSION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  win_battle: Swords,
  win_battles_multiple: Flame,
  use_bey_type: Shield,
  challenge_stronger: Zap,
  feed_beypet: Heart,
  gacha_pull: Sparkles,
  win_3v3: Crown,
  check_in: Calendar,
  vote_prediction: Target,
  share_combo: Box,
};

// ── Main component ───────────────────────────

export default function MissionsClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"daily" | "achievements">("daily");
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [ocEarnedToday, setOcEarnedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>("all");

  // Countdown timer
  const [timeToReset, setTimeToReset] = useState("");

  // Cargar datos
  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-missions");
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions ?? []);
        setOcEarnedToday(data.oc_earned_today ?? 0);
      }
    } catch {
      // Silenciar error
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      if (res.ok) {
        const data = await res.json();
        setAchievements(data.achievements ?? []);
        setTotalAchievements(data.total ?? 0);
        setUnlockedCount(data.unlocked ?? 0);
      }
    } catch {
      // Silenciar error
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchMissions(), fetchAchievements()]).finally(() =>
      setLoading(false)
    );
  }, [fetchMissions, fetchAchievements]);

  // Countdown timer - se actualiza cada segundo
  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeToReset(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reclamar recompensa
  const claimReward = async (playerMissionId: string) => {
    setClaiming(playerMissionId);
    try {
      const res = await fetch("/api/daily-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_mission_id: playerMissionId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`+${data.reward_oc} OC y +${data.reward_xp} XP`);
        // Refetch para actualizar estado
        await fetchMissions();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Error al reclamar");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setClaiming(null);
    }
  };

  // Filter achievements
  const filteredAchievements =
    categoryFilter === "all"
      ? achievements
      : achievements.filter((a) => a.category === categoryFilter);

  // Sort: unlocked first, then by rarity (legendary > epic > rare > common)
  const RARITY_ORDER: Record<string, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3,
  };
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Unlocked first
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    // Then by rarity (legendary first)
    return (RARITY_ORDER[a.rarity] ?? 3) - (RARITY_ORDER[b.rarity] ?? 3);
  });

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 text-omega-purple animate-spin" />
      </div>
    );
  }

  const completedCount = missions.filter((m) => m.completed).length;
  const claimedCount = missions.filter((m) => m.claimed).length;
  const allClaimed = missions.length > 0 && claimedCount === missions.length;

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-omega-black/90 backdrop-blur-md border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="size-8 rounded-lg bg-omega-card flex items-center justify-center hover:bg-omega-card-hover transition-colors"
          >
            <ArrowLeft className="size-4 text-omega-muted" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-black text-omega-text">
              Misiones y Logros
            </h1>
          </div>
          {/* OC badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-omega-gold/15 border border-omega-gold/30">
            <Coins className="size-3.5 text-omega-gold" />
            <span className="text-xs font-bold text-omega-gold">
              +{ocEarnedToday} OC hoy
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "daily"
                ? "bg-omega-purple text-white shadow-md shadow-omega-purple/30"
                : "bg-omega-card text-omega-muted hover:bg-omega-card-hover"
            }`}
          >
            <Target className="size-3.5 inline mr-1.5 -mt-0.5" />
            Misiones del Dia
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "achievements"
                ? "bg-omega-purple text-white shadow-md shadow-omega-purple/30"
                : "bg-omega-card text-omega-muted hover:bg-omega-card-hover"
            }`}
          >
            <Trophy className="size-3.5 inline mr-1.5 -mt-0.5" />
            Logros ({unlockedCount}/{totalAchievements})
          </button>
        </div>
      </div>

      {/* ═══ DAILY MISSIONS TAB ═══ */}
      {activeTab === "daily" && (
        <div className="px-4 mt-4 space-y-4">
          {/* Reset timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-omega-muted" />
              <span className="text-xs text-omega-muted">
                Nuevas misiones en
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-omega-blue">
              {timeToReset}
            </span>
          </div>

          {/* Progress overview */}
          <div className="omega-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-omega-text">
                Progreso del dia
              </h3>
              <span className="text-xs font-bold text-omega-muted">
                {completedCount}/{missions.length} completadas
              </span>
            </div>
            <div className="h-2 bg-omega-dark rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${missions.length > 0 ? (completedCount / missions.length) * 100 : 0}%`,
                  background:
                    allClaimed
                      ? "linear-gradient(90deg, #2ed573, #2ed573)"
                      : "linear-gradient(90deg, #7b2ff7, #00b4d8)",
                }}
              />
            </div>
            {allClaimed && (
              <div className="flex items-center gap-2 text-omega-green text-xs font-bold">
                <Check className="size-3.5" />
                Todas las recompensas reclamadas
              </div>
            )}
          </div>

          {/* Mission cards */}
          {missions.length === 0 ? (
            <div className="omega-card p-6 text-center">
              <Target className="size-10 text-omega-muted/30 mx-auto mb-2" />
              <p className="text-sm text-omega-muted">
                No hay misiones disponibles hoy
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => {
                const MissionIcon =
                  MISSION_ICON_MAP[mission.type] || Target;
                const progressPct =
                  mission.target_value > 0
                    ? Math.min(
                        100,
                        (mission.progress / mission.target_value) * 100
                      )
                    : 0;

                return (
                  <div
                    key={mission.id}
                    className={`omega-card p-4 transition-all ${
                      mission.claimed
                        ? "opacity-60"
                        : mission.completed
                          ? "border-omega-gold/40 shadow-[0_0_20px_rgba(255,214,10,0.15)]"
                          : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                          mission.completed
                            ? "bg-omega-gold/20"
                            : "bg-omega-purple/20"
                        }`}
                      >
                        {mission.claimed ? (
                          <Check className="size-5 text-omega-green" />
                        ) : (
                          <MissionIcon
                            className={`size-5 ${
                              mission.completed
                                ? "text-omega-gold"
                                : "text-omega-purple"
                            }`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-omega-text">
                          {mission.description}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 bg-omega-dark rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                mission.completed
                                  ? "bg-omega-gold"
                                  : "bg-omega-purple"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-omega-muted">
                            <span>
                              {mission.progress}/{mission.target_value}
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="size-2.5 text-omega-gold" />
                              {mission.reward_oc} OC
                              {mission.reward_xp > 0 && (
                                <>
                                  {" "}
                                  + {mission.reward_xp} XP
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Claim button */}
                    {mission.completed && !mission.claimed && (
                      <button
                        onClick={() => claimReward(mission.id)}
                        disabled={claiming === mission.id}
                        className="mt-3 w-full omega-btn omega-btn-gold py-2.5 text-sm animate-pulse"
                      >
                        {claiming === mission.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Gift className="size-4" />
                            Reclamar +{mission.reward_oc} OC
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ACHIEVEMENTS TAB ═══ */}
      {activeTab === "achievements" && (
        <div className="px-4 mt-4 space-y-4">
          {/* Total counter */}
          <div className="omega-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-omega-text">
                Logros desbloqueados
              </h3>
              <span className="text-sm font-bold text-omega-gold">
                {unlockedCount}/{totalAchievements}
              </span>
            </div>
            <div className="h-2 bg-omega-dark rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-omega-gold to-omega-gold-glow transition-all duration-700"
                style={{
                  width: `${totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Category filter tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 carousel-scroll">
            {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key) => {
              const config = CATEGORY_CONFIG[key];
              const count =
                key === "all"
                  ? achievements.length
                  : achievements.filter((a) => a.category === key).length;

              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    categoryFilter === key
                      ? "bg-omega-purple text-white shadow-md"
                      : "bg-omega-card text-omega-muted hover:bg-omega-card-hover"
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Achievement grid */}
          <div className="grid grid-cols-2 gap-3">
            {sortedAchievements.map((ach) => {
              const rarityConfig =
                RARITY_CONFIG[ach.rarity] ?? RARITY_CONFIG.common;
              const IconComp = ICON_MAP[ach.icon] ?? Trophy;
              const progressPct =
                ach.requirement_value > 0
                  ? Math.min(
                      100,
                      (ach.current_progress / ach.requirement_value) * 100
                    )
                  : 0;

              return (
                <div
                  key={ach.id}
                  className={`relative rounded-xl border p-3 transition-all ${
                    ach.unlocked
                      ? `${rarityConfig.border} ${rarityConfig.bg} ${rarityConfig.glow}`
                      : "border-white/[0.06] bg-omega-dark/40"
                  } ${
                    ach.rarity === "legendary" && ach.unlocked
                      ? "legendary-achievement"
                      : ""
                  }`}
                >
                  {/* Rarity badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${rarityConfig.text}`}
                    >
                      {rarityConfig.label}
                    </span>
                    {ach.unlocked && (
                      <Check className="size-3.5 text-omega-green" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                      ach.unlocked
                        ? rarityConfig.bg
                        : "bg-omega-muted/10"
                    }`}
                  >
                    {ach.unlocked ? (
                      <IconComp
                        className={`size-5 ${rarityConfig.text}`}
                      />
                    ) : (
                      <Lock className="size-5 text-omega-muted/40" />
                    )}
                  </div>

                  {/* Name & desc */}
                  <p
                    className={`text-xs font-bold text-center mb-0.5 ${
                      ach.unlocked ? "text-omega-text" : "text-omega-muted/50"
                    }`}
                  >
                    {ach.name}
                  </p>
                  <p
                    className={`text-[10px] text-center leading-tight ${
                      ach.unlocked
                        ? "text-omega-muted"
                        : "text-omega-muted/30"
                    }`}
                  >
                    {ach.description}
                  </p>

                  {/* Progress bar (for trackable, non-unlocked) */}
                  {!ach.unlocked && ach.requirement_value > 1 && (
                    <div className="mt-2 space-y-0.5">
                      <div className="h-1 bg-omega-dark rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-omega-muted/40 transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-omega-muted/40 text-center">
                        {ach.current_progress}/{ach.requirement_value}
                      </p>
                    </div>
                  )}

                  {/* Unlock date */}
                  {ach.unlocked && ach.unlocked_at && (
                    <p className="text-[9px] text-omega-muted/60 text-center mt-1.5">
                      {new Date(ach.unlocked_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}

                  {/* Reward */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {ach.reward_oc > 0 && (
                      <span
                        className={`text-[9px] font-bold flex items-center gap-0.5 ${
                          ach.unlocked
                            ? "text-omega-gold"
                            : "text-omega-muted/30"
                        }`}
                      >
                        <Coins className="size-2.5" />
                        {ach.reward_oc}
                      </span>
                    )}
                    {ach.reward_xp > 0 && (
                      <span
                        className={`text-[9px] font-bold flex items-center gap-0.5 ${
                          ach.unlocked
                            ? "text-omega-purple"
                            : "text-omega-muted/30"
                        }`}
                      >
                        <Zap className="size-2.5" />
                        {ach.reward_xp} XP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedAchievements.length === 0 && (
            <div className="omega-card p-6 text-center">
              <Trophy className="size-10 text-omega-muted/30 mx-auto mb-2" />
              <p className="text-sm text-omega-muted">
                No hay logros en esta categoria
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
