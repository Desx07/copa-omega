"use client";

import { useMemo, useState } from "react";
import { Swords, Star, ChevronDown } from "lucide-react";
import RematchButton from "./rematch-button";

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string;
  stars_bet: number;
  completed_at: string | null;
  player1: unknown;
  player2: unknown;
}

function groupMatchesByDate(matches: Match[]) {
  const groups: Record<string, Match[]> = {};
  for (const match of matches) {
    const dateKey = match.completed_at
      ? new Date(match.completed_at).toLocaleDateString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Sin fecha";
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(match);
  }
  return Object.entries(groups);
}

export default function MatchHistory({ matches, userId }: { matches: Match[]; userId: string }) {
  const [open, setOpen] = useState(false);
  const grouped = useMemo(() => groupMatchesByDate(matches), [matches]);

  return (
    <div className="px-4 space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Swords className="size-4 text-omega-blue" />
          <h2 className="text-xs font-bold text-omega-text uppercase tracking-wider">Mis ultimas batallas</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="omega-badge omega-badge-blue">{matches.length}</span>
          <ChevronDown className={`size-4 text-omega-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <>
          {matches.length === 0 ? (
            <div className="omega-card p-10 text-center space-y-3">
              <Swords className="size-10 text-omega-muted/20 mx-auto" />
              <p className="text-sm text-omega-muted/70">Todavia no tenes batallas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([dateLabel, groupMatches]) => (
                <div key={dateLabel} className="space-y-2">
                  <p className="text-[11px] font-semibold text-omega-muted/60 tracking-wide pl-1">
                    {"\uD83D\uDCC5"} {dateLabel} — {groupMatches.length} {groupMatches.length === 1 ? "batalla" : "batallas"}
                  </p>
                  {groupMatches.map((match) => {
                    const won = match.winner_id === userId;
                    const isPlayer1 = match.player1_id === userId;
                    const opponent = isPlayer1 ? match.player2 : match.player1;
                    const opponentAlias = (opponent as unknown as { alias: string })?.alias ?? "???";
                    const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
                    return (
                      <div
                        key={match.id}
                        className={`rounded-xl border-l-4 ${won ? "border-l-omega-green" : "border-l-omega-red"} bg-omega-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-3`}
                      >
                        <div className={`size-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${won ? "bg-omega-green/20 border border-omega-green/40 text-omega-green" : "bg-omega-red/20 border border-omega-red/40 text-omega-red"}`}>
                          {won ? "W" : "L"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-omega-text truncate">vs {opponentAlias}</p>
                          <p className="text-xs text-omega-muted/70">
                            {match.completed_at ? new Date(match.completed_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!won && match.stars_bet > 0 && (
                            <RematchButton opponentId={opponentId} starsBet={match.stars_bet} />
                          )}
                          <div className={`flex items-center gap-1 ${won ? "text-omega-green" : "text-omega-red"}`}>
                            <span className="text-sm font-black">{won ? "+" : "-"}{match.stars_bet}</span>
                            <Star className="size-3.5 text-omega-gold fill-omega-gold" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
