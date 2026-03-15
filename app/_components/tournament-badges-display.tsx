import { Trophy } from "lucide-react";

interface TournamentBadge {
  tournament_name: string;
  logo_url: string | null;
  position: number; // 1, 2, or 3
  card_image_url?: string | null;
}

interface TournamentBadgesDisplayProps {
  badges: TournamentBadge[];
}

const POSITION_CONFIG = {
  1: {
    ring: "ring-2 ring-omega-gold shadow-[0_0_12px_rgba(255,214,10,0.35)]",
    label: "1er",
    bg: "bg-omega-gold/15",
    text: "text-omega-gold",
    border: "border-omega-gold/40",
  },
  2: {
    ring: "ring-2 ring-gray-400/60 shadow-[0_0_10px_rgba(192,192,192,0.2)]",
    label: "2do",
    bg: "bg-white/5",
    text: "text-gray-400",
    border: "border-gray-400/30",
  },
  3: {
    ring: "ring-2 ring-orange-500/60 shadow-[0_0_10px_rgba(205,127,50,0.2)]",
    label: "3er",
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500/30",
  },
} as const;

/**
 * Displays tournament winner badges.
 * - Compact horizontal row of tournament logos with gold/silver/bronze ring
 * - Below: podium card images (full-width, Instagram-style) when available
 */
export default function TournamentBadgesDisplay({
  badges,
}: TournamentBadgesDisplayProps) {
  if (badges.length === 0) return null;

  const badgesWithCards = badges.filter((b) => b.card_image_url);

  return (
    <div className="space-y-4">
      {/* Badge icons row */}
      <div className="omega-card shadow-sm">
        <div className="omega-section-header">
          <Trophy className="size-4 text-omega-gold" />
          Torneos ({badges.length})
        </div>

        <div className="flex flex-wrap gap-3 p-4">
          {badges.map((badge, i) => {
            const config =
              POSITION_CONFIG[badge.position as 1 | 2 | 3] ?? POSITION_CONFIG[3];
            return (
              <div
                key={`${badge.tournament_name}-${i}`}
                className="flex flex-col items-center gap-1.5 group"
                title={`${badge.tournament_name} - ${config.label} lugar`}
              >
                <div
                  className={`size-12 rounded-full overflow-hidden ${config.ring} ${config.bg} flex items-center justify-center transition-transform group-hover:scale-110`}
                >
                  {badge.logo_url ? (
                    <img
                      src={badge.logo_url}
                      alt={badge.tournament_name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Trophy className={`size-5 ${config.text}`} />
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide ${config.text}`}
                >
                  {config.label}
                </span>
                <span className="text-[9px] text-omega-muted/70 max-w-[60px] text-center truncate leading-tight">
                  {badge.tournament_name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Podium cards — full-width Instagram-style images */}
      {badgesWithCards.length > 0 && (
        <div className="space-y-3">
          {badgesWithCards.map((badge, i) => {
            const config =
              POSITION_CONFIG[badge.position as 1 | 2 | 3] ?? POSITION_CONFIG[3];
            return (
              <div
                key={`card-${badge.tournament_name}-${i}`}
                className="omega-card shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-omega-border/20">
                  <div
                    className={`size-7 rounded-full overflow-hidden ${config.ring} ${config.bg} flex items-center justify-center shrink-0`}
                  >
                    {badge.logo_url ? (
                      <img
                        src={badge.logo_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Trophy className={`size-3 ${config.text}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-omega-text truncate">
                      {badge.tournament_name}
                    </p>
                    <p className={`text-[10px] font-medium ${config.text}`}>
                      {config.label} lugar
                    </p>
                  </div>
                </div>

                {/* Card image */}
                <img
                  src={badge.card_image_url!}
                  alt={`Tarjeta de podio - ${badge.tournament_name}`}
                  className="w-full object-contain"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
