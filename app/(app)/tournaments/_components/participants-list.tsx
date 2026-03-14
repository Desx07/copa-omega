import Link from "next/link";
import { Star, XCircle, Trophy } from "lucide-react";

export interface Participant {
  id: string;
  seed: number | null;
  points: number;
  tournament_wins: number;
  tournament_losses: number;
  is_eliminated: boolean;
  player: {
    id: string;
    alias: string;
    avatar_url: string | null;
    stars: number;
  };
}

interface ParticipantsListProps {
  participants: Participant[];
  showSeeds?: boolean;
  showPoints?: boolean;
}

export default function ParticipantsList({
  participants,
  showSeeds = false,
  showPoints = false,
}: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div className="omega-card shadow-sm p-8 text-center">
        <Star className="size-8 text-omega-muted/20 mx-auto mb-3" />
        <p className="text-sm text-omega-muted/70">
          No hay participantes inscriptos todavía
        </p>
      </div>
    );
  }

  const sorted = [...participants].sort((a, b) => {
    if (showPoints) {
      if (b.points !== a.points) return b.points - a.points;
    }
    if (b.tournament_wins !== a.tournament_wins)
      return b.tournament_wins - a.tournament_wins;
    if ((a.seed ?? 999) !== (b.seed ?? 999))
      return (a.seed ?? 999) - (b.seed ?? 999);
    return 0;
  });

  return (
    <section className="omega-card shadow-sm">
      <div className="omega-section-header">
        <Trophy className="size-4 text-omega-gold" />
        Participantes ({participants.length})
      </div>

      <div>
        {sorted.map((p, index) => {
          const borderColor = p.is_eliminated
            ? "border-l-omega-red/50"
            : index === 0 && showPoints
            ? "border-l-omega-gold"
            : "border-l-transparent";

          return (
            <Link
              key={p.id}
              href={`/player/${p.player.id}`}
              className={`omega-row border-l-4 ${borderColor} transition-all hover:bg-omega-surface ${
                p.is_eliminated ? "opacity-50" : ""
              }`}
            >
              {/* Position / seed */}
              <span className="text-sm font-black text-omega-muted/60 w-6 text-center shrink-0">
                {showSeeds && p.seed ? `#${p.seed}` : index + 1}
              </span>

              {/* Avatar */}
              <div className="size-8 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0">
                {p.player.avatar_url ? (
                  <img
                    src={p.player.avatar_url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-xs font-black text-omega-purple">
                    {p.player.alias.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + W/L */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-bold truncate ${
                      p.is_eliminated
                        ? "text-omega-muted line-through"
                        : "text-omega-text"
                    }`}
                  >
                    {p.player.alias}
                  </span>
                  {p.is_eliminated && (
                    <XCircle className="size-3 text-omega-red shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-omega-muted">
                  <span className="text-omega-green font-bold">
                    {p.tournament_wins}W
                  </span>
                  <span className="text-omega-muted/40"> / </span>
                  <span className="text-omega-red font-bold">
                    {p.tournament_losses}L
                  </span>
                </span>
              </div>

              {/* Points or stars */}
              {showPoints ? (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-black text-omega-gold">
                    {p.points}
                  </span>
                  <span className="text-[10px] text-omega-muted">pts</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                  <span className="text-sm font-black text-omega-gold">
                    {p.player.stars}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
