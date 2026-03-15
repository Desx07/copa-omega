"use client";

import { useState } from "react";
import { Trophy, ChevronDown } from "lucide-react";

interface PodiumBadge {
  tournament_name: string;
  logo_url: string | null;
  position: number;
  card_image_url: string | null;
}

interface PodiumCardsAccordionProps {
  badges: PodiumBadge[];
}

const POSITION_CONFIG = {
  1: {
    ring: "ring-2 ring-omega-gold shadow-[0_0_12px_rgba(255,214,10,0.35)]",
    label: "1ro",
    bg: "bg-omega-gold/15",
    text: "text-omega-gold",
  },
  2: {
    ring: "ring-2 ring-gray-400/60 shadow-[0_0_10px_rgba(192,192,192,0.2)]",
    label: "2do",
    bg: "bg-white/5",
    text: "text-gray-400",
  },
  3: {
    ring: "ring-2 ring-orange-500/60 shadow-[0_0_10px_rgba(205,127,50,0.2)]",
    label: "3ro",
    bg: "bg-orange-500/10",
    text: "text-orange-500",
  },
} as const;

export default function PodiumCardsAccordion({
  badges,
}: PodiumCardsAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (badges.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-omega-gold" />
        <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">
          Tarjetas de podio
        </h2>
      </div>

      <div className="space-y-2">
        {badges.map((badge, i) => {
          const config =
            POSITION_CONFIG[badge.position as 1 | 2 | 3] ?? POSITION_CONFIG[3];
          const isExpanded = expandedIndex === i;

          return (
            <div
              key={`${badge.tournament_name}-${i}`}
              className="omega-card shadow-sm overflow-hidden"
            >
              {/* Header — click to expand/collapse */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-omega-surface/50 transition-colors"
              >
                {/* Tournament logo */}
                <div
                  className={`size-8 rounded-full overflow-hidden ${config.ring} ${config.bg} flex items-center justify-center shrink-0`}
                >
                  {badge.logo_url ? (
                    <img
                      src={badge.logo_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Trophy className={`size-3.5 ${config.text}`} />
                  )}
                </div>

                {/* Tournament name */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-omega-text truncate">
                    {badge.tournament_name}
                  </p>
                </div>

                {/* Position badge */}
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md border ${config.bg} ${config.text} shrink-0`}
                >
                  {config.label}
                </span>

                {/* Chevron */}
                <ChevronDown
                  className={`size-4 text-omega-muted shrink-0 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expanded: card image */}
              {isExpanded && badge.card_image_url && (
                <div className="border-t border-omega-border/20">
                  <img
                    src={badge.card_image_url}
                    alt={`Tarjeta de podio - ${badge.tournament_name}`}
                    className="w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
