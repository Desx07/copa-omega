"use client";

import { Crown, Swords, User, Clock, Scale } from "lucide-react";

/* ─── Types ─── */

export interface BracketMatch {
  id: string;
  round: number;
  match_order: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  status: "pending" | "in_progress" | "completed" | "bye";
  bracket_position: string | null;
  next_match_id: string | null;
  judge_id?: string | null;
  player1?: { alias: string } | null;
  player2?: { alias: string } | null;
  winner?: { alias: string } | null;
  judge?: { alias: string } | null;
}

interface BracketViewProps {
  matches: BracketMatch[];
  format: "single_elimination" | "round_robin" | "swiss";
  currentRound: number;
}

/* ─── Main Component ─── */

export default function BracketView({
  matches,
  format,
  currentRound,
}: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-omega-border bg-omega-card/40 p-10 text-center backdrop-blur-sm">
        <Swords className="size-10 text-omega-muted/20 mx-auto mb-3" />
        <p className="text-sm text-omega-muted/70">
          No hay partidas generadas todavia
        </p>
      </div>
    );
  }

  if (format === "single_elimination") {
    return <EliminationBracket matches={matches} />;
  }

  return <RoundList matches={matches} currentRound={currentRound} />;
}

/* ═══════════════════════════════════════════════════
   SINGLE ELIMINATION — horizontal tree bracket
   ═══════════════════════════════════════════════════ */

function EliminationBracket({ matches }: { matches: BracketMatch[] }) {
  // Group matches by round
  const rounds = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const arr = rounds.get(m.round) || [];
    arr.push(m);
    rounds.set(m.round, arr);
  }

  // Sort rounds and matches within each round
  const sortedRoundKeys = [...rounds.keys()].sort((a, b) => a - b);
  for (const key of sortedRoundKeys) {
    rounds.get(key)!.sort((a, b) => a.match_order - b.match_order);
  }

  const totalRounds = sortedRoundKeys.length;

  const roundLabels = (roundIndex: number, total: number): string => {
    const fromEnd = total - roundIndex;
    if (fromEnd === 1) return "FINAL";
    if (fromEnd === 2) return "SEMIFINAL";
    if (fromEnd === 3) return "CUARTOS";
    return `RONDA ${roundIndex + 1}`;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {sortedRoundKeys.map((roundNum, roundIndex) => {
          const roundMatches = rounds.get(roundNum)!;
          return (
            <div key={roundNum} className="flex flex-col">
              {/* Round label */}
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold text-omega-muted uppercase tracking-widest">
                  {roundLabels(roundIndex, totalRounds)}
                </span>
              </div>

              {/* Matches in this round */}
              <div
                className="flex flex-col justify-around flex-1 gap-4"
                style={{ minWidth: 200 }}
              >
                {roundMatches.map((match) => (
                  <EliminationMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EliminationMatchCard({ match }: { match: BracketMatch }) {
  const p1Alias = match.player1?.alias ?? (match.player1_id ? "???" : "TBD");
  const p2Alias = match.player2?.alias ?? (match.player2_id ? "???" : "TBD");

  const p1Won = match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won = match.status === "completed" && match.winner_id === match.player2_id;

  const isBye = match.status === "bye";
  const isPending = match.status === "pending";
  const isActive = match.status === "in_progress";

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isActive
          ? "border-omega-blue/50 shadow-md shadow-omega-blue/10"
          : isBye
          ? "border-omega-border/30 opacity-60"
          : "border-omega-border/50"
      }`}
    >
      {/* Position label */}
      {match.bracket_position && (
        <div className="px-3 py-1 bg-omega-card/80 border-b border-omega-border/30">
          <span className="text-[9px] font-bold text-omega-muted uppercase tracking-wider">
            {match.bracket_position}
          </span>
        </div>
      )}

      {/* Player 1 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          p1Won
            ? "bg-omega-green/10"
            : isPending
            ? "bg-omega-card/40"
            : "bg-omega-card/60"
        }`}
      >
        <div className="size-6 rounded-full bg-omega-dark border border-omega-border/50 flex items-center justify-center shrink-0">
          {match.player1_id ? (
            <span className="text-[10px] font-bold text-omega-purple">
              {p1Alias.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="size-3 text-omega-muted/40" />
          )}
        </div>
        <span
          className={`text-xs font-bold truncate flex-1 ${
            p1Won ? "text-omega-green" : match.player1_id ? "text-omega-text" : "text-omega-muted/40"
          }`}
        >
          {p1Won && <Crown className="size-3 text-omega-gold inline mr-1" />}
          {isBye && match.player1_id ? `${p1Alias} (BYE)` : p1Alias}
        </span>
        {match.status === "completed" && (
          <span className={`text-[10px] font-bold ${p1Won ? "text-omega-green" : "text-omega-muted"}`}>
            {match.player1_score}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-omega-border/30" />

      {/* Player 2 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          p2Won
            ? "bg-omega-green/10"
            : isPending
            ? "bg-omega-card/40"
            : "bg-omega-card/60"
        }`}
      >
        <div className="size-6 rounded-full bg-omega-dark border border-omega-border/50 flex items-center justify-center shrink-0">
          {match.player2_id ? (
            <span className="text-[10px] font-bold text-omega-blue">
              {p2Alias.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="size-3 text-omega-muted/40" />
          )}
        </div>
        <span
          className={`text-xs font-bold truncate flex-1 ${
            p2Won ? "text-omega-green" : match.player2_id ? "text-omega-text" : "text-omega-muted/40"
          }`}
        >
          {p2Won && <Crown className="size-3 text-omega-gold inline mr-1" />}
          {p2Alias}
        </span>
        {match.status === "completed" && (
          <span className={`text-[10px] font-bold ${p2Won ? "text-omega-green" : "text-omega-muted"}`}>
            {match.player2_score}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {isActive && (
        <div className="px-3 py-1.5 bg-omega-blue/10 border-t border-omega-blue/20 text-center">
          <span className="text-[10px] font-bold text-omega-blue uppercase tracking-wider flex items-center justify-center gap-1">
            <Clock className="size-3 animate-pulse" />
            En juego
          </span>
        </div>
      )}

      {/* Judge */}
      {match.judge?.alias && (
        <div className="px-3 py-1 bg-omega-gold/5 border-t border-omega-border/20 text-center">
          <span className="text-[9px] font-bold text-omega-gold/80 flex items-center justify-center gap-1">
            <Scale className="size-2.5" />
            Juez: {match.judge.alias}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROUND ROBIN / SWISS — grouped round list
   ═══════════════════════════════════════════════════ */

function RoundList({
  matches,
  currentRound,
}: {
  matches: BracketMatch[];
  currentRound: number;
}) {
  // Group by round
  const rounds = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const arr = rounds.get(m.round) || [];
    arr.push(m);
    rounds.set(m.round, arr);
  }

  const sortedRoundKeys = [...rounds.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {sortedRoundKeys.map((roundNum) => {
        const roundMatches = rounds.get(roundNum)!;
        const isCurrentRound = roundNum === currentRound;
        const allCompleted = roundMatches.every((m) => m.status === "completed" || m.status === "bye");

        return (
          <div
            key={roundNum}
            className={`rounded-2xl border overflow-hidden backdrop-blur-sm ${
              isCurrentRound
                ? "border-omega-blue/40 shadow-md shadow-omega-blue/10"
                : "border-omega-border/40"
            }`}
          >
            {/* Round header */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                isCurrentRound
                  ? "bg-omega-blue/10 border-omega-blue/30"
                  : "bg-omega-card/60 border-omega-border/40"
              }`}
            >
              <h3 className="text-sm font-bold text-omega-text/80 uppercase tracking-wider flex items-center gap-2">
                <Swords className={`size-4 ${isCurrentRound ? "text-omega-blue" : "text-omega-muted"}`} />
                Ronda {roundNum}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  allCompleted
                    ? "bg-omega-green/10 border border-omega-green/30 text-omega-green"
                    : isCurrentRound
                    ? "bg-omega-blue/10 border border-omega-blue/30 text-omega-blue"
                    : "bg-omega-card border border-omega-border text-omega-muted"
                }`}
              >
                {allCompleted ? "COMPLETADA" : isCurrentRound ? "EN CURSO" : "PENDIENTE"}
              </span>
            </div>

            {/* Matches */}
            <div className="divide-y divide-omega-border/20 bg-omega-card/30">
              {roundMatches.map((match) => (
                <RoundMatchRow key={match.id} match={match} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoundMatchRow({ match }: { match: BracketMatch }) {
  const p1Alias = match.player1?.alias ?? "TBD";
  const p2Alias = match.player2?.alias ?? "TBD";
  const p1Won = match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won = match.status === "completed" && match.winner_id === match.player2_id;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-omega-card/40 transition-colors">
      {/* Status dot */}
      <div
        className={`size-2 rounded-full shrink-0 ${
          match.status === "completed"
            ? "bg-omega-green"
            : match.status === "in_progress"
            ? "bg-omega-blue animate-pulse"
            : match.status === "bye"
            ? "bg-omega-muted/30"
            : "bg-omega-muted/50"
        }`}
      />

      {/* Player 1 */}
      <span
        className={`text-sm font-bold truncate flex-1 text-right ${
          p1Won ? "text-omega-green" : p2Won ? "text-omega-muted" : "text-omega-text"
        }`}
      >
        {p1Won && <Crown className="size-3 text-omega-gold inline mr-1" />}
        {p1Alias}
      </span>

      {/* Score */}
      <div className="flex items-center gap-1.5 shrink-0">
        {match.status === "completed" ? (
          <div className="flex items-center gap-1 rounded-full bg-omega-card border border-omega-border/50 px-2.5 py-0.5">
            <span className={`text-xs font-black ${p1Won ? "text-omega-green" : "text-omega-muted"}`}>
              {match.player1_score}
            </span>
            <span className="text-omega-muted/40 text-[10px]">-</span>
            <span className={`text-xs font-black ${p2Won ? "text-omega-green" : "text-omega-muted"}`}>
              {match.player2_score}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-omega-muted uppercase">vs</span>
        )}
      </div>

      {/* Player 2 */}
      <span
        className={`text-sm font-bold truncate flex-1 ${
          p2Won ? "text-omega-green" : p1Won ? "text-omega-muted" : "text-omega-text"
        }`}
      >
        {p2Alias}
        {p2Won && <Crown className="size-3 text-omega-gold inline ml-1" />}
      </span>

      {/* Judge */}
      {match.judge?.alias && (
        <span className="text-[9px] text-omega-gold/70 flex items-center gap-0.5 shrink-0" title={`Juez: ${match.judge.alias}`}>
          <Scale className="size-2.5" />
          {match.judge.alias}
        </span>
      )}
    </div>
  );
}
