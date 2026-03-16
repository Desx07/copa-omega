"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Swords, User, Clock, Scale, Loader2, Trophy, ChevronRight, UserPlus, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const MAX_SCORE = 7; // Beyblade X maximum score per game

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
  isJudge?: boolean;
  currentUserId?: string;
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
  isJudge = false,
  currentUserId,
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
        isJudge={isJudge}
        currentUserId={currentUserId}
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
            isJudge={isJudge}
            currentUserId={currentUserId}
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
            isJudge={isJudge}
            currentUserId={currentUserId}
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
  isJudge,
  currentUserId,
  tournamentId,
}: {
  matches: BracketMatch[];
  isAdmin?: boolean;
  isJudge?: boolean;
  currentUserId?: string;
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
                    isJudge={isJudge}
                    currentUserId={currentUserId}
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
  isJudge,
  currentUserId,
  tournamentId,
}: {
  match: BracketMatch;
  isAdmin?: boolean;
  isJudge?: boolean;
  currentUserId?: string;
  tournamentId?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  // BUG 3 FIX: Use strings for score state so user can clear the input
  const [p1Score, setP1Score] = useState("");
  const [p2Score, setP2Score] = useState("");
  // BUG 5: state for adding player to bye
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerAlias, setNewPlayerAlias] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const router = useRouter();

  const p1Alias = match.player1?.alias ?? (match.player1_id ? "???" : "TBD");
  const p2Alias = match.player2?.alias ?? (match.player2_id ? "???" : "TBD");

  const p1Won = match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won = match.status === "completed" && match.winner_id === match.player2_id;

  const isBye = match.status === "bye";
  const isPending = match.status === "pending";
  const isActive = match.status === "in_progress";

  // BUG 2 FIX: Check if this is a bye that was already auto-advanced (has winner_id)
  const isByeResolved = isBye && match.winner_id != null;
  // BUG 2 FIX: Check if this is a bye that was NOT auto-advanced (no winner but has a player)
  const isByeUnresolved = isBye && match.winner_id == null && (match.player1_id || match.player2_id);
  // BUG 5: Check if this is a bye slot where admin can add a player
  const isByeSlot = isBye && match.winner_id == null && (match.player1_id || match.player2_id) && !(match.player1_id && match.player2_id);

  const isAssignedJudge = isJudge && currentUserId && match.judge_id === currentUserId;
  const canResolve =
    (isAdmin || isAssignedJudge) &&
    tournamentId &&
    (isPending || isActive) &&
    match.player1_id &&
    match.player2_id;

  // Parse scores for submission
  const p1ScoreNum = p1Score === "" ? 0 : parseInt(p1Score, 10);
  const p2ScoreNum = p2Score === "" ? 0 : parseInt(p2Score, 10);
  const scoresEqual = p1ScoreNum === p2ScoreNum;
  const scoreOverMax = p1ScoreNum > MAX_SCORE || p2ScoreNum > MAX_SCORE;
  const scoreInvalid = isNaN(p1ScoreNum) || isNaN(p2ScoreNum) || p1ScoreNum < 0 || p2ScoreNum < 0;

  async function handleSubmitScore() {
    if (!tournamentId || !match.player1_id || !match.player2_id) return;
    if (scoresEqual) {
      toast.error("No puede haber empate");
      return;
    }
    if (scoreOverMax) {
      toast.error(`El puntaje maximo es ${MAX_SCORE}`);
      return;
    }
    if (scoreInvalid) {
      toast.error("Puntaje invalido");
      return;
    }
    const winnerId = p1ScoreNum > p2ScoreNum ? match.player1_id : match.player2_id;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winner_id: winnerId,
            player1_score: p1ScoreNum,
            player2_score: p2ScoreNum,
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

  // BUG 2 FIX: Admin can manually advance an unresolved bye
  async function handleAdvanceBye() {
    if (!tournamentId || !match.id) return;
    const winnerId = match.player1_id ?? match.player2_id;
    if (!winnerId) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/matches/${match.id}/advance-bye`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournament_id: tournamentId }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error avanzando bye");
        return;
      }
      toast.success("Jugador avanzado");
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setSubmitting(false);
    }
  }

  // BUG 5: Admin can assign a player to a bye slot
  async function handleAddPlayerToBye() {
    if (!tournamentId || !match.id || !newPlayerAlias.trim()) return;
    setAddingPlayer(true);
    try {
      const res = await fetch(
        `/api/admin/matches/${match.id}/assign-player`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tournament_id: tournamentId,
            player_alias: newPlayerAlias.trim(),
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error agregando jugador");
        return;
      }
      toast.success("Jugador agregado al partido");
      setShowAddPlayer(false);
      setNewPlayerAlias("");
      router.refresh();
    } catch {
      toast.error("Error de conexion");
    } finally {
      setAddingPlayer(false);
    }
  }

  const borderColor = isActive
    ? "border-l-omega-blue"
    : p1Won || p2Won
    ? "border-l-omega-green"
    : isByeResolved
    ? "border-l-omega-green/50"
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
            {isByeResolved && " - BYE"}
          </span>
        </div>
      )}

      {/* Player 1 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          p1Won || (isByeResolved && match.winner_id === match.player1_id)
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
            p1Won || (isByeResolved && match.winner_id === match.player1_id)
              ? "text-omega-green"
              : match.player1_id
              ? "text-omega-text"
              : "text-omega-muted/40"
          }`}
        >
          {(p1Won || (isByeResolved && match.winner_id === match.player1_id)) && <Crown className="size-3 text-omega-gold inline mr-1" />}
          {isBye && match.player1_id && !match.player2_id ? `${p1Alias} (BYE)` : p1Alias}
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
          p2Won || (isByeResolved && match.winner_id === match.player2_id)
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
            p2Won || (isByeResolved && match.winner_id === match.player2_id)
              ? "text-omega-green"
              : match.player2_id
              ? "text-omega-text"
              : "text-omega-muted/40"
          }`}
        >
          {(p2Won || (isByeResolved && match.winner_id === match.player2_id)) && <Crown className="size-3 text-omega-gold inline mr-1" />}
          {isBye && match.player2_id && !match.player1_id ? `${p2Alias} (BYE)` : p2Alias}
        </span>
        {match.status === "completed" && (
          <span className={`text-xs font-black tabular-nums ${p2Won ? "text-omega-green" : "text-omega-muted"}`}>
            {match.player2_score}
          </span>
        )}
      </div>

      {/* BUG 2 FIX: Show resolved bye status */}
      {isByeResolved && (
        <div className="px-3 py-1.5 bg-omega-green/5 border-t border-omega-green/20 text-center">
          <span className="text-[10px] font-bold text-omega-green/80 uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle className="size-3" />
            Avanzado por BYE
          </span>
        </div>
      )}

      {/* BUG 2 FIX: Admin button to manually advance an unresolved bye */}
      {isAdmin && isByeUnresolved && (
        <div className="px-3 py-2 bg-omega-gold/5 border-t border-omega-gold/20 text-center">
          <button
            onClick={handleAdvanceBye}
            disabled={submitting}
            className="omega-btn omega-btn-primary px-3 py-1.5 text-xs !rounded-md w-full !bg-omega-gold/90 hover:!bg-omega-gold"
          >
            {submitting ? (
              <Loader2 className="size-3 animate-spin mx-auto" />
            ) : (
              <>
                <ChevronRight className="size-3" />
                Avanzar (BYE)
              </>
            )}
          </button>
        </div>
      )}

      {/* BUG 5 FIX: Admin can add player to bye slot */}
      {isAdmin && isByeSlot && !showAddPlayer && (
        <div className="px-3 py-2 bg-omega-blue/5 border-t border-omega-blue/20 text-center">
          <button
            onClick={() => setShowAddPlayer(true)}
            className="omega-btn px-3 py-1.5 text-xs !rounded-md w-full border border-omega-blue/30 text-omega-blue hover:bg-omega-blue/10"
          >
            <UserPlus className="size-3" />
            Agregar jugador
          </button>
        </div>
      )}

      {isAdmin && isByeSlot && showAddPlayer && (
        <div className="px-3 py-2.5 bg-omega-blue/5 border-t border-omega-blue/20 space-y-2">
          <input
            type="text"
            placeholder="Alias del jugador"
            value={newPlayerAlias}
            onChange={(e) => setNewPlayerAlias(e.target.value)}
            className="w-full rounded-md border border-omega-border bg-omega-dark px-2 py-1.5 text-xs text-omega-text focus:border-omega-blue focus:outline-none"
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => { setShowAddPlayer(false); setNewPlayerAlias(""); }}
              disabled={addingPlayer}
              className="flex-1 omega-btn px-2 py-1 text-[11px] !rounded-md border border-omega-border text-omega-muted hover:text-omega-text"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddPlayerToBye}
              disabled={addingPlayer || !newPlayerAlias.trim()}
              className="flex-1 omega-btn omega-btn-primary px-2 py-1 text-[11px] !rounded-md disabled:opacity-50"
            >
              {addingPlayer ? (
                <Loader2 className="size-3 animate-spin mx-auto" />
              ) : (
                <>
                  <UserPlus className="size-3" />
                  Agregar
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
            {/* BUG 3 FIX: text input with numeric mode, empty initial value */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={p1Score}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setP1Score(val);
              }}
              placeholder="0"
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-omega-muted/60 text-xs font-bold">-</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={p2Score}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setP2Score(val);
              }}
              placeholder="0"
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-[10px] font-bold text-omega-text truncate max-w-[60px]">
              {match.player2?.alias ?? "J2"}
            </span>
          </div>
          {/* BUG 4 FIX: Show max score hint */}
          <p className="text-[9px] text-omega-muted/60 text-center">Max {MAX_SCORE} puntos</p>
          {scoreOverMax && (
            <p className="text-[10px] text-red-400 text-center font-bold">
              El puntaje no puede ser mayor a {MAX_SCORE}
            </p>
          )}
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
              disabled={submitting || scoresEqual || scoreOverMax || scoreInvalid}
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
  isJudge,
  currentUserId,
  tournamentId,
  expectedRounds,
  allGroupsDone,
}: {
  matches: BracketMatch[];
  currentRound: number;
  isAdmin?: boolean;
  isJudge?: boolean;
  currentUserId?: string;
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
                  isJudge={isJudge}
                  currentUserId={currentUserId}
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
  isJudge,
  currentUserId,
  tournamentId,
}: {
  match: BracketMatch;
  isAdmin?: boolean;
  isJudge?: boolean;
  currentUserId?: string;
  tournamentId?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  // BUG 3 FIX: Use strings for score state so user can clear the input
  const [p1Score, setP1Score] = useState("");
  const [p2Score, setP2Score] = useState("");
  const router = useRouter();

  const p1Alias = match.player1?.alias ?? "TBD";
  const p2Alias = match.player2?.alias ?? "TBD";
  const p1Won =
    match.status === "completed" && match.winner_id === match.player1_id;
  const p2Won =
    match.status === "completed" && match.winner_id === match.player2_id;

  const isPending = match.status === "pending";
  const isActive = match.status === "in_progress";
  const isBye = match.status === "bye";
  const isAssignedJudge = isJudge && currentUserId && match.judge_id === currentUserId;
  const canResolve =
    (isAdmin || isAssignedJudge) &&
    tournamentId &&
    (isPending || isActive) &&
    match.player1_id &&
    match.player2_id;

  // Parse scores for submission
  const p1ScoreNum = p1Score === "" ? 0 : parseInt(p1Score, 10);
  const p2ScoreNum = p2Score === "" ? 0 : parseInt(p2Score, 10);
  const scoresEqual = p1ScoreNum === p2ScoreNum;
  const scoreOverMax = p1ScoreNum > MAX_SCORE || p2ScoreNum > MAX_SCORE;
  const scoreInvalid = isNaN(p1ScoreNum) || isNaN(p2ScoreNum) || p1ScoreNum < 0 || p2ScoreNum < 0;

  async function handleSubmitScore() {
    if (!tournamentId || !match.player1_id || !match.player2_id) return;
    if (scoresEqual) {
      toast.error("No puede haber empate");
      return;
    }
    if (scoreOverMax) {
      toast.error(`El puntaje maximo es ${MAX_SCORE}`);
      return;
    }
    if (scoreInvalid) {
      toast.error("Puntaje invalido");
      return;
    }
    const winnerId = p1ScoreNum > p2ScoreNum ? match.player1_id : match.player2_id;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/matches/${match.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            winner_id: winnerId,
            player1_score: p1ScoreNum,
            player2_score: p2ScoreNum,
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
          {isBye ? `${p1Alias} (BYE)` : p1Alias}
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
          ) : isBye ? (
            <span className="text-[10px] font-bold text-omega-muted/50 uppercase">
              bye
            </span>
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
              : isBye && !match.player2_id
              ? "text-omega-muted/30"
              : "text-omega-text"
          }`}
        >
          {isBye && !match.player2_id ? "---" : p2Alias}
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
            {/* BUG 3 FIX: text input with numeric mode */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={p1Score}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setP1Score(val);
              }}
              placeholder="0"
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-omega-muted/60 text-xs font-bold">-</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={p2Score}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setP2Score(val);
              }}
              placeholder="0"
              className="w-12 rounded-md border border-omega-border bg-omega-dark px-2 py-1 text-center text-xs font-bold text-omega-text focus:border-omega-purple focus:outline-none"
            />
            <span className="text-xs font-bold text-omega-text truncate max-w-[80px]">
              {match.player2?.alias ?? "J2"}
            </span>
          </div>
          {/* BUG 4 FIX: Show max score and validation */}
          <p className="text-[9px] text-omega-muted/60 text-center">Max {MAX_SCORE} puntos</p>
          {scoreOverMax && (
            <p className="text-[10px] text-red-400 text-center font-bold">
              El puntaje no puede ser mayor a {MAX_SCORE}
            </p>
          )}
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
              disabled={submitting || scoresEqual || scoreOverMax || scoreInvalid}
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
