"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Camera, Swords, Star, Trophy, Target, Sparkles, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface OnboardingChecklistProps {
  playerId: string;
  hasAvatar: boolean;
  hasBeys: boolean;
  hasPredictions: boolean;
  hasChallenges: boolean;
}

const STEPS = [
  {
    id: "avatar",
    label: "Subi tu foto de perfil",
    description: "Que te reconozcan en la arena",
    icon: Camera,
    href: "/profile",
  },
  {
    id: "bey",
    label: "Agrega tu primer bey",
    description: "Registra tu blade, ratchet y bit",
    icon: Target,
    href: "/profile",
  },
  {
    id: "ranking",
    label: "Mira el ranking",
    description: "Conoce a tus rivales",
    icon: Trophy,
    href: "/ranking",
  },
  {
    id: "prediction",
    label: "Hace una prediccion",
    description: "Predeci quien gana la proxima",
    icon: Star,
    href: "/predictions",
  },
  {
    id: "challenge",
    label: "Reta a un blader",
    description: "Desafia a alguien y aposta estrellas",
    icon: Swords,
    href: "/challenges",
  },
];

export default function OnboardingChecklist({
  playerId,
  hasAvatar,
  hasBeys,
  hasPredictions,
  hasChallenges,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const [dismissing, setDismissing] = useState(false);
  const [visitedRanking, setVisitedRanking] = useState(false);

  // Check localStorage for ranking visit
  useEffect(() => {
    const visited = localStorage.getItem("onboarding_visited_ranking");
    if (visited) setVisitedRanking(true);
  }, []);

  const completionMap: Record<string, boolean> = {
    avatar: hasAvatar,
    bey: hasBeys,
    ranking: visitedRanking,
    prediction: hasPredictions,
    challenge: hasChallenges,
  };

  const completedCount = Object.values(completionMap).filter(Boolean).length;
  const allDone = completedCount === STEPS.length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  async function handleDismiss() {
    setDismissing(true);
    try {
      const supabase = createClient();
      await supabase
        .from("players")
        .update({ onboarding_completed: true })
        .eq("id", playerId);
      toast.success("Onboarding completado! A competir!");
      router.refresh();
    } catch {
      toast.error("Error");
    } finally {
      setDismissing(false);
    }
  }

  function handleStepClick(stepId: string) {
    if (stepId === "ranking") {
      localStorage.setItem("onboarding_visited_ranking", "true");
    }
  }

  return (
    <div className="omega-card p-4 space-y-3 border-l-4 border-l-omega-purple">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-omega-purple" />
          <h3 className="text-sm font-bold text-omega-text">Primeros pasos</h3>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="text-omega-muted hover:text-omega-text transition-colors"
          title="Cerrar"
        >
          {dismissing ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-omega-muted">
          <span>{completedCount}/{STEPS.length} completados</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-omega-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-omega-purple to-omega-gold rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {STEPS.map((step) => {
          const done = completionMap[step.id];
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.href}
              onClick={() => handleStepClick(step.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                done
                  ? "bg-omega-green/10 opacity-60"
                  : "bg-omega-dark/40 hover:bg-omega-purple/10"
              }`}
            >
              <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                done
                  ? "bg-omega-green/20 text-omega-green"
                  : "bg-omega-purple/20 text-omega-purple"
              }`}>
                {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${done ? "line-through text-omega-muted" : "text-omega-text"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-omega-muted">{step.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* All done celebration */}
      {allDone && (
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="omega-btn omega-btn-gold w-full py-2.5 text-sm"
        >
          {dismissing ? <Loader2 className="size-4 animate-spin" /> : "Todo listo! Empeza a competir"}
        </button>
      )}
    </div>
  );
}
