import { BADGE_DEFINITIONS } from "@/lib/badges";
import { Award } from "lucide-react";

interface BadgesDisplayProps {
  earnedBadgeIds: string[];
}

/**
 * Displays all badges in a grid. Earned badges are fully visible,
 * unearned badges are grayed out. Works as a server or client component.
 */
export default function BadgesDisplay({ earnedBadgeIds }: BadgesDisplayProps) {
  const earnedSet = new Set(earnedBadgeIds);

  return (
    <div className="rounded-2xl border border-omega-border/40 bg-omega-card/30 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-omega-border bg-omega-card/60">
        <h2 className="text-sm font-bold text-omega-muted uppercase tracking-wider flex items-center gap-2">
          <Award className="size-4 text-omega-gold" />
          Medallas ({earnedBadgeIds.length}/{BADGE_DEFINITIONS.length})
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-2 p-4">
        {BADGE_DEFINITIONS.map((badge) => {
          const earned = earnedSet.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all ${
                earned
                  ? "bg-omega-gold/10 border border-omega-gold/30"
                  : "bg-omega-dark/40 border border-omega-border/20 opacity-40 grayscale"
              }`}
              title={`${badge.name}: ${badge.description}`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span
                className={`text-[10px] font-bold leading-tight ${
                  earned ? "text-omega-text" : "text-omega-muted/60"
                }`}
              >
                {badge.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
