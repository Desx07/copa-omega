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
      <div className="rounded-2xl border border-omega-border/40 bg-omega-card/40 p-8 text-center backdrop-blur-sm">
        <Star className="size-8 text-omega-muted/20 mx-auto mb-3" />
        <p className="text-sm text-omega-muted/70">
          No hay participantes inscriptos todavia
        </p>
      </div>
    );
  }

  // Sort: by points desc, then by wins desc, then by seed
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
    <div className="rounded-2xl border border-omega-border/40 bg-omega-card/40 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-omega-border/40 bg-omega-card/60">
        <h3 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="size-4 text-omega-gold" />
          Participantes ({participants.length})
        </h3>
      </div>

      <div className="divide-y divide-omega-border/20">
        {sorted.map((p, index) => (
          <Link
            key={p.id}
            href={`/player/${p.player.id}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-omega-card/40 transition-colors ${
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
        ))}
      </div>
    </div>
  );
}
