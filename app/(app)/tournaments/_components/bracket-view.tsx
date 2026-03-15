"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Swords, User, Clock, Scale, Loader2, Trophy, ChevronRight } from "lucide-react";
import { toast } from "sonner";

/* --- Types --- */

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
  stage?: string | null;
  player1?: { alias: string } | null;
  player2?: { alias: string } | null;
  winner?: { alias: string } | null;
  judge?: { alias: string } | null;
}

interface BracketViewProps {
  matches: BracketMatch[];
  format: "single_elimination" | "round_robin" | "swiss";
  currentRound: number;
  isAdmin?: boolean;
  tournamentId?: string;
  stage?: string | null;
  participantCount?: number;
}

/* --- Main Component --- */

export default function BracketView({
  matches,
  format,
  currentRound,
  isAdmin = false,
  tournamentId,
  stage,
  participantCount,
}: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <div className="omega-card shadow-sm p-10 text-center">
        <Swords className="size-10 text-omega-muted/20 mx-auto mb-3" />
        <p className="text-sm text-omega-muted/70">
          No hay partidas generadas todavia
        </p>
      </div>
    );
  }

  // Separate group stage and finals matches
  const groupMatches = matches.filter(
    (m) => !m.stage || m.stage === "group"
  );
  const finalsMatches = matches.filter((m) => m.stage === "finals");

  // If the tournament has both group and finals stages, show them separately
  const hasGroupAndFinals = groupMatches.length > 0 && finalsMatches.length > 0;
  const showingFinals = stage === "finals" || finalsMatches.length > 0;

  if (format === "single_elimination" && !hasGroupAndFinals) {
    return (
      <EliminationBracket
        matches={matches}
        isAdmin={isAdmin}
        tournamentId={tournamentId}
      />
    );
  }

  // Swiss / Round Robin: show group rounds + optional finals bracket
  const expectedRounds =
    format === "swiss" && participantCount
      ? Math.ceil(Math.log2(participantCount))
      : undefined;

  return (
    <div className="space-y-6">
      {/* Group stage rounds */}
      {groupMatches.length > 0 && (
        <div className="space-y-2">
          {hasGroupAndFinals && (
            <div className="flex items-center gap-2 px-1">
              <Swords className="size-4 text-omega-purple" />
              <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
                Fase de grupos
              </span>
            </div>
          )}
          <RoundList
            matches={groupMatches}
            currentRound={showingFinals ? -1 : currentRound}
            isAdmin={isAdmin}
            tournamentId={tournamentId}
            expectedRounds={expectedRounds}
            allGroupsDone={showingFinals}
          />
        </div>
      )}

      {/* Finals bracket */}
      {finalsMatches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Trophy className="size-4 text-omega-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-omega-text">
              Llaves finales
            </span>
          </div>
          <EliminationBracket
            matches={finalsMatches}
            isAdmin={isAdmin}
            tournamentId={tournamentId}
          />
        </div>
      )}
    </div>
  );
}

/* ===================================================
   SINGLE ELIMINATION -- horizontal tree bracket
   =================================================== */

function EliminationBracket({
  matches,
  isAdmin,
  tournamentId,
}: {
  matches: BracketMatch[];
  isAdmin?: boolean;
  tournamentId?: string;
}) {
  const rounds = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const arr = rounds.get(m.round) || [];
    arr.push(m);
    rounds.set(m.round, arr);
  }

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
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold text-omega-muted uppercase tracking-widest">
                  {roundLabels(roundIndex, totalRounds)}
                </span>
              </div>

              <div
                className="flex flex-col justify-around flex-1 gap-4"
                style={{ minWidth: 200 }}
              >
                {roundMatches.map((match) => (
                  <EliminationMatchCard
                    key={match.id}
                    match={match}
                    isAdmin={isAdmin}
                    tournamentId={tournamentId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EliminationMatchCard({
  match,
  isAdmin,
  tournamentId,
}: {
  match: BracketMatch;
  isAdmin?: boolean;
  tournamentId?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const router = useRouter();

  const p1Alias = match.player1?.alias ?? (match.player1_id ? "???" : "TBD");
  const p2Alias = match.player2?.alias ?? (match.player2_id ? "???" : "TBD");

  const p1Won = match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won = match.status === "completed" && match.winner_id === match.player2_id;

  const isBye = match.status === "bye";
  const isPending = match.status === "pending";
  const isActive = match.status === "in_progress";

  const canResolve =
    isAdmin &&
    tournamentId &&
    (isPending || isActive) &&
    match.player1_id &&
    match.player2_id;

  async function handleSubmitScore() {
    if (!tournamentId || !match.player1_id || !match.player2_id) return;
    if (p1Score === p2Score) {
      toast.error("No puede haber empate");
      return;
    }
    const winnerId = p1Score > p2Score ? match.player1_id : match.player2_id;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winner_id: winnerId,
            player1_score: p1Score,
            player2_score: p2Score,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error guardando resultado");
        return;
      }
      toast.success("Resultado guardado");
      setShowScoreForm(false);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  }

  const borderColor = isActive
    ? "border-l-omega-blue"
    : p1Won || p2Won
    ? "border-l-omega-green"
    : isBye
    ? "border-l-omega-muted/30"
    : "border-l-omega-purple/30";

  return (
    <div
      className={`omega-card border-l-4 ${borderColor} shadow-sm transition-all hover:shadow-md ${
        isActive
          ? "!border-t-omega-blue/50 !shadow-omega-blue/10"
          : isBye
          ? "opacity-60"
          : ""
      }`}
    >
      {/* Position label */}
      {match.bracket_position && (
        <div className="px-3 py-1 bg-omega-surface border-b border-omega-border/30">
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
            ? "bg-omega-card"
            : "bg-omega-surface"
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
          <span className={`text-xs font-black tabular-nums ${p1Won ? "text-omega-green" : "text-omega-muted"}`}>
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
            ? "bg-omega-card"
            : "bg-omega-surface"
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
          <span className={`text-xs font-black tabular-nums ${p2Won ? "text-omega-green" : "text-omega-muted"}`}>
            {match.player2_score}
          </span>
        )}
      </div>

      {/* Admin: score form */}
      {canResolve && !showScoreForm && (
        <div className="px-3 py-2 bg-omega-purple/5 border-t border-omega-purple/20 text-center">
          <button
            onClick={() => setShowScoreForm(true)}
            className="omega-btn omega-btn-primary px-3 py-1.5 text-xs !rounded-md w-full"
          >
            <Swords className="size-3" />
            Cargar resultado
          </button>
        </div>
      )}

      {canResolve && showScoreForm && (
        <div className="px-3 py-2.5 bg-omega-purple/5 border-t border-omega-purple/20 space-y-2">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="text-[10px] font-bold text-omega-text truncate max-w-[60px]">
              {match.player1?.alias ?? "J1"}
            </span>
            <input
              type="number"
              min={0}
              value={p1Score}
              onChange={(e) => setP1Score(Number(e.target.value))}
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-omega-muted/60 text-xs font-bold">-</span>
            <input
              type="number"
              min={0}
              value={p2Score}
              onChange={(e) => setP2Score(Number(e.target.value))}
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-[10px] font-bold text-omega-text truncate max-w-[60px]">
              {match.player2?.alias ?? "J2"}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowScoreForm(false)}
              disabled={submitting}
              className="flex-1 omega-btn px-2 py-1 text-[11px] !rounded-md border border-omega-border text-omega-muted hover:text-omega-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitScore}
              disabled={submitting || p1Score === p2Score}
              className="flex-1 omega-btn omega-btn-primary px-2 py-1 text-[11px] !rounded-md disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-3 animate-spin mx-auto" />
              ) : (
                <>
                  <Crown className="size-3" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isActive && !canResolve && (
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

/* ===================================================
   ROUND ROBIN / SWISS -- grouped round list
   =================================================== */

function RoundList({
  matches,
  currentRound,
  isAdmin,
  tournamentId,
  expectedRounds,
  allGroupsDone,
}: {
  matches: BracketMatch[];
  currentRound: number;
  isAdmin?: boolean;
  tournamentId?: string;
  expectedRounds?: number;
  allGroupsDone?: boolean;
}) {
  const rounds = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const arr = rounds.get(m.round) || [];
    arr.push(m);
    rounds.set(m.round, arr);
  }

  const sortedRoundKeys = [...rounds.keys()].sort((a, b) => a - b);

  // For Swiss: show placeholders for future rounds not yet generated
  const maxExistingRound =
    sortedRoundKeys.length > 0
      ? sortedRoundKeys[sortedRoundKeys.length - 1]
      : 0;
  const futureRounds: number[] = [];
  if (expectedRounds && !allGroupsDone) {
    for (let r = maxExistingRound + 1; r <= expectedRounds; r++) {
      futureRounds.push(r);
    }
  }

  return (
    <div className="space-y-4">
      {sortedRoundKeys.map((roundNum) => {
        const roundMatches = rounds.get(roundNum)!;
        const isCurrentRound = roundNum === currentRound;
        const allCompleted = roundMatches.every(
          (m) => m.status === "completed" || m.status === "bye"
        );

        const borderColor = isCurrentRound
          ? "border-l-omega-blue"
          : allCompleted
          ? "border-l-omega-green"
          : "border-l-omega-purple/30";

        return (
          <div
            key={roundNum}
            className={`omega-card border-l-4 ${borderColor} shadow-sm transition-all hover:shadow-md ${
              isCurrentRound ? "!shadow-omega-blue/10" : ""
            }`}
          >
            {/* Round header */}
            <div
              className={`omega-section-header justify-between ${
                isCurrentRound
                  ? "!bg-omega-blue/10 !border-omega-blue/30"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Swords
                  className={`size-4 ${
                    isCurrentRound ? "text-omega-blue" : "text-omega-muted"
                  }`}
                />
                Ronda {roundNum}
              </div>
              <span
                className={
                  allCompleted
                    ? "omega-badge omega-badge-green"
                    : isCurrentRound
                    ? "omega-badge omega-badge-blue"
                    : "omega-badge omega-badge-purple"
                }
              >
                {allCompleted
                  ? "COMPLETADA"
                  : isCurrentRound
                  ? "EN CURSO"
                  : "PENDIENTE"}
              </span>
            </div>

            {/* Matches */}
            <div>
              {roundMatches.map((match) => (
                <RoundMatchRow
                  key={match.id}
                  match={match}
                  isAdmin={isAdmin}
                  tournamentId={tournamentId}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Future rounds placeholder */}
      {futureRounds.map((roundNum) => (
        <div
          key={`future-${roundNum}`}
          className="omega-card border-l-4 border-l-omega-muted/20 shadow-sm opacity-50"
        >
          <div className="omega-section-header justify-between">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-omega-muted/40" />
              <span className="text-omega-muted/60">Ronda {roundNum}</span>
            </div>
            <span className="omega-badge omega-badge-purple">PROXIMA</span>
          </div>
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-omega-muted/50 flex items-center justify-center gap-1.5">
              <ChevronRight className="size-3" />
              Se generara al completar la ronda anterior
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoundMatchRow({
  match,
  isAdmin,
  tournamentId,
}: {
  match: BracketMatch;
  isAdmin?: boolean;
  tournamentId?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const router = useRouter();

  const p1Alias = match.player1?.alias ?? "TBD";
  const p2Alias = match.player2?.alias ?? "TBD";
  const p1Won =
    match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won =
    match.status === "completed" && match.winner_id === match.player2_id;

  const isPending = match.status === "pending";
  const isActive = match.status === "in_progress";
  const canResolve =
    isAdmin &&
    tournamentId &&
    (isPending || isActive) &&
    match.player1_id &&
    match.player2_id;

  async function handleSubmitScore() {
    if (!tournamentId || !match.player1_id || !match.player2_id) return;
    if (p1Score === p2Score) {
      toast.error("No puede haber empate");
      return;
    }
    const winnerId = p1Score > p2Score ? match.player1_id : match.player2_id;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winner_id: winnerId,
            player1_score: p1Score,
            player2_score: p2Score,
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error guardando resultado");
        return;
      }
      toast.success("Resultado guardado");
      setShowScoreForm(false);
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="omega-row flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-0">
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
            p1Won
              ? "text-omega-green"
              : p2Won
              ? "text-omega-muted"
              : "text-omega-text"
          }`}
        >
          {p1Won && (
            <Crown className="size-3 text-omega-gold inline mr-1" />
          )}
          {p1Alias}
        </span>

        {/* Score */}
        <div className="flex items-center gap-1.5 shrink-0">
          {match.status === "completed" ? (
            <div className="flex items-center gap-1 rounded-full bg-omega-card border border-omega-border/50 px-2.5 py-0.5">
              <span
                className={`text-xs font-black tabular-nums ${
                  p1Won ? "text-omega-green" : "text-omega-muted"
                }`}
              >
                {match.player1_score}
              </span>
              <span className="text-omega-muted/40 text-[10px]">-</span>
              <span
                className={`text-xs font-black tabular-nums ${
                  p2Won ? "text-omega-green" : "text-omega-muted"
                }`}
              >
                {match.player2_score}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-omega-muted uppercase">
              vs
            </span>
          )}
        </div>

        {/* Player 2 */}
        <span
          className={`text-sm font-bold truncate flex-1 ${
            p2Won
              ? "text-omega-green"
              : p1Won
              ? "text-omega-muted"
              : "text-omega-text"
          }`}
        >
          {p2Alias}
          {p2Won && (
            <Crown className="size-3 text-omega-gold inline ml-1" />
          )}
        </span>

        {/* Judge */}
        {match.judge?.alias && (
          <span
            className="text-[9px] text-omega-gold/70 flex items-center gap-0.5 shrink-0"
            title={`Juez: ${match.judge.alias}`}
          >
            <Scale className="size-2.5" />
            {match.judge.alias}
          </span>
        )}
      </div>

      {/* Admin: score form toggle */}
      {canResolve && !showScoreForm && (
        <div className="w-full pt-1.5 border-t border-omega-border/20 mt-1">
          <button
            onClick={() => setShowScoreForm(true)}
            className="omega-btn omega-btn-primary px-3 py-1 text-[11px] !rounded-md w-full"
          >
            <Swords className="size-3" />
            Cargar resultado
          </button>
        </div>
      )}

      {canResolve && showScoreForm && (
        <div className="w-full pt-2 border-t border-omega-border/20 mt-1 space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xs font-bold text-omega-text truncate max-w-[80px]">
              {match.player1?.alias ?? "J1"}
            </span>
            <input
              type="number"
              min={0}
              value={p1Score}
              onChange={(e) => setP1Score(Number(e.target.value))}
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-omega-muted/60 text-xs font-bold">-</span>
            <input
              type="number"
              min={0}
              value={p2Score}
              onChange={(e) => setP2Score(Number(e.target.value))}
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-xs font-bold text-omega-text truncate max-w-[80px]">
              {match.player2?.alias ?? "J2"}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowScoreForm(false)}
              disabled={submitting}
              className="flex-1 omega-btn px-2 py-1 text-[11px] !rounded-md border border-omega-border text-omega-muted hover:text-omega-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitScore}
              disabled={submitting || p1Score === p2Score}
              className="flex-1 omega-btn omega-btn-primary px-2 py-1 text-[11px] !rounded-md disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-3 animate-spin mx-auto" />
              ) : (
                <>
                  <Crown className="size-3" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
