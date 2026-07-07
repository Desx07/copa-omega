"use client";

// ============================================================================
// SANDBOX de Ascenso — 100% en memoria (JSON), sin base de datos ni prod.
// Sirve para PROBAR y VER el flujo completo del Torneo de Ascenso:
//   habilitar jugadores → crear partidas → sumar puntos → llenar ticket →
//   cola por orden de llegada → combate de ascenso → subir rango → cambio manual.
// Reusa la lógica REAL de lib/ascenso (mismos rangos y targets que la app).
// Solo dev (404 en prod). Reset al recargar.
// ============================================================================

import { useState, useMemo } from "react";
import { notFound } from "next/navigation";
import { RANKS, rankInfo, nextRank, hasFullTicket, POINTS_PER_WIN, type RankLetter } from "@/lib/ascenso";

interface SandboxPlayer {
  id: string;
  alias: string;
  rank: RankLetter;
  ticket: number;
  ticketFilledAt: number | null; // timestamp de cuándo llenó (orden FIFO)
  enabled: boolean;              // habilitado por admin (pagó/juega)
  wins: number;
  losses: number;
}

// Roster de ejemplo (sin estrellas — Copa Omega Star terminó). Todos rango F.
const INITIAL: SandboxPlayer[] = [
  "Valt", "Shu", "Aiger", "Free", "Lui", "Dante", "Hyuga", "Rantaro",
].map((alias, i) => ({
  id: `p${i + 1}`,
  alias,
  rank: "F" as RankLetter,
  ticket: 0,
  ticketFilledAt: null,
  enabled: false,
  wins: 0,
  losses: 0,
}));

let clock = 1; // reloj lógico para el orden de llegada

export default function AscensoSandbox() {
  if (process.env.NODE_ENV !== "development") notFound();

  const [players, setPlayers] = useState<SandboxPlayer[]>(INITIAL);
  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  // Cada victoria vale POINTS_PER_WIN fijos (progresión por peleas, estilo Z-A).
  const points = POINTS_PER_WIN;
  const [kind, setKind] = useState<"normal" | "ascension">("normal");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (m: string) => setLog((l) => [m, ...l].slice(0, 12));

  const byId = (id: string) => players.find((p) => p.id === id);
  const enabled = players.filter((p) => p.enabled);

  // Cola FIFO por rango: los que tienen ticket lleno, ordenados por llegada
  const queuesByRank = useMemo(() => {
    const map: Record<string, SandboxPlayer[]> = {};
    for (const p of players) {
      if (p.enabled && hasFullTicket(p.rank, p.ticket)) {
        (map[p.rank] ||= []).push(p);
      }
    }
    for (const r of Object.keys(map)) {
      map[r].sort((a, b) => (a.ticketFilledAt ?? 0) - (b.ticketFilledAt ?? 0));
    }
    return map;
  }, [players]);

  function toggleEnabled(id: string) {
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
    const p = byId(id);
    addLog(`${p?.enabled ? "❌ Deshabilitado" : "✅ Habilitado"}: ${p?.alias}`);
  }

  function changeRank(id: string, rank: RankLetter) {
    setPlayers((ps) =>
      ps.map((p) => (p.id === id ? { ...p, rank, ticket: 0, ticketFilledAt: null } : p))
    );
    addLog(`🔧 ${byId(id)?.alias} → rango ${rank} (ticket reiniciado)`);
  }

  function resolveMatch(winnerId: string) {
    const a = byId(p1);
    const b = byId(p2);
    if (!a || !b) return;
    const winner = winnerId === a.id ? a : b;
    const loser = winnerId === a.id ? b : a;

    if (kind === "normal") {
      // Suma puntos al ganador; si cruza el umbral, marca llegada a la cola
      setPlayers((ps) =>
        ps.map((p) => {
          if (p.id === winner.id) {
            const target = rankInfo(p.rank).ticketTarget ?? Infinity;
            const wasFilled = p.ticket >= target;
            const newTicket = p.ticket + points;
            const nowFilled = newTicket >= target;
            return {
              ...p,
              ticket: newTicket,
              ticketFilledAt: !wasFilled && nowFilled ? clock++ : p.ticketFilledAt,
              wins: p.wins + 1,
            };
          }
          if (p.id === loser.id) return { ...p, losses: p.losses + 1 };
          return p;
        })
      );
      addLog(`⚔️ ${winner.alias} le ganó a ${loser.alias}: +${points} pts de ticket`);
    } else {
      // Combate de ascenso: ganador sube de rango, ambos reinician ticket
      const nr = nextRank(winner.rank);
      setPlayers((ps) =>
        ps.map((p) => {
          if (p.id === winner.id) {
            return { ...p, rank: nr ?? p.rank, ticket: 0, ticketFilledAt: null, wins: p.wins + 1 };
          }
          if (p.id === loser.id) {
            return { ...p, ticket: 0, ticketFilledAt: null, losses: p.losses + 1 };
          }
          return p;
        })
      );
      addLog(`🏆 ${winner.alias} ganó el COMBATE DE ASCENSO → sube a rango ${nr}. ${loser.alias} reinicia ticket.`);
    }
  }

  const canResolve = p1 && p2 && p1 !== p2 && byId(p1)?.enabled && byId(p2)?.enabled &&
    (kind === "normal" || (byId(p1)?.rank === byId(p2)?.rank &&
      hasFullTicket(byId(p1)!.rank, byId(p1)!.ticket) && hasFullTicket(byId(p2)!.rank, byId(p2)!.ticket)));

  return (
    <div className="min-h-screen bg-omega-black text-omega-text p-4 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-black text-omega-purple">SANDBOX · Torneo de Ascenso</h1>
        <p className="text-xs text-omega-muted">
          Prueba en memoria (sin base, sin prod). Sin estrellas — todos arrancan rango F.
          Recargá para reiniciar.
        </p>
      </div>

      {/* CREAR PARTIDA */}
      <div className="omega-card !p-3 space-y-2">
        <p className="text-sm font-bold">Crear partida</p>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setKind("normal")}
            className={`flex-1 rounded-lg py-1.5 font-bold ${kind === "normal" ? "bg-omega-purple text-white" : "bg-omega-elevated text-omega-muted"}`}>
            Normal (suma puntos)
          </button>
          <button onClick={() => setKind("ascension")}
            className={`flex-1 rounded-lg py-1.5 font-bold ${kind === "ascension" ? "bg-omega-gold text-black" : "bg-omega-elevated text-omega-muted"}`}>
            Combate de ascenso
          </button>
        </div>
        <div className="flex gap-2">
          <select value={p1} onChange={(e) => setP1(e.target.value)} className="omega-input flex-1 text-xs">
            <option value="">Jugador 1…</option>
            {enabled.map((p) => <option key={p.id} value={p.id}>{p.alias} ({p.rank} · {p.ticket}pts)</option>)}
          </select>
          <select value={p2} onChange={(e) => setP2(e.target.value)} className="omega-input flex-1 text-xs">
            <option value="">Jugador 2…</option>
            {enabled.map((p) => <option key={p.id} value={p.id}>{p.alias} ({p.rank} · {p.ticket}pts)</option>)}
          </select>
        </div>
        {kind === "normal" && (
          <p className="text-[11px] text-omega-muted">
            Cada victoria da <span className="font-bold text-omega-green">{POINTS_PER_WIN} pts</span> fijos.
            Subir de rango cuesta: F 30 peleas · E 40 · D 50 · C 60 · B 70 · A 80.
          </p>
        )}
        {p1 && p2 && p1 !== p2 && (
          <div className="flex gap-2 text-xs">
            <button disabled={!canResolve} onClick={() => resolveMatch(p1)}
              className="flex-1 rounded-lg bg-omega-green/80 py-2 font-bold text-black disabled:opacity-40">
              Gana {byId(p1)?.alias}
            </button>
            <button disabled={!canResolve} onClick={() => resolveMatch(p2)}
              className="flex-1 rounded-lg bg-omega-green/80 py-2 font-bold text-black disabled:opacity-40">
              Gana {byId(p2)?.alias}
            </button>
          </div>
        )}
        {p1 && p2 && kind === "ascension" && !canResolve && (
          <p className="text-[11px] text-omega-red">Para el combate de ascenso ambos deben ser del mismo rango y tener el ticket lleno.</p>
        )}
      </div>

      {/* COLAS FIFO */}
      {Object.keys(queuesByRankSafe(queuesByRank)).length > 0 && (
        <div className="omega-card !p-3 space-y-2">
          <p className="text-sm font-bold">Colas de combate (orden de llegada)</p>
          {Object.entries(queuesByRankSafe(queuesByRank)).map(([rank, q]) => (
            <div key={rank} className="text-xs">
              <span className="font-bold" style={{ color: rankInfo(rank as RankLetter).glow }}>
                Rango {rank}
              </span>
              <span className="text-omega-muted"> — {q.length} en espera</span>
              <ol className="list-decimal list-inside text-omega-muted">
                {q.map((p) => <li key={p.id}>{p.alias}</li>)}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* ROSTER */}
      <div className="omega-card !p-3 space-y-1">
        <p className="text-sm font-bold">Jugadores ({enabled.length}/{players.length} habilitados)</p>
        {players.map((p) => {
          const info = rankInfo(p.rank);
          const target = info.ticketTarget;
          const full = hasFullTicket(p.rank, p.ticket);
          return (
            <div key={p.id} className={`flex items-center gap-3 rounded-lg p-2.5 text-xs ${p.enabled ? "bg-omega-card/40" : "opacity-50"}`}>
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${info.color} text-base font-black text-white`}>{p.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-bold text-omega-text">
                  {p.alias} <span className="font-normal text-omega-muted">· {p.wins}W {p.losses}L</span>
                </p>
                <p className="truncate text-[11px] text-omega-muted">
                  {target === null ? "🎫 Rango máximo" : `${p.ticket}/${target} pts${full ? " · 🎫 LLENO" : ""}`}
                </p>
              </div>
              <select value={p.rank} onChange={(e) => changeRank(p.id, e.target.value as RankLetter)}
                className="w-20 shrink-0 rounded-lg border border-omega-border bg-omega-elevated px-1.5 py-1.5 text-[11px] text-omega-text"
                title="Cambiar rango (admin)">
                {RANKS.map((r) => <option key={r.letter} value={r.letter}>{r.letter}</option>)}
              </select>
              <button onClick={() => toggleEnabled(p.id)}
                className={`w-11 shrink-0 rounded-full px-2 py-1.5 font-bold ${p.enabled ? "bg-omega-green text-black" : "bg-omega-elevated text-omega-muted"}`}>
                {p.enabled ? "ON" : "OFF"}
              </button>
            </div>
          );
        })}
      </div>

      {/* LOG */}
      <div className="omega-card !p-3">
        <p className="text-sm font-bold mb-1">Registro</p>
        <div className="space-y-0.5 text-[11px] text-omega-muted">
          {log.length === 0 ? <p>Habilitá jugadores y creá partidas…</p> : log.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </div>
    </div>
  );
}

function queuesByRankSafe(m: Record<string, SandboxPlayer[]>): Record<string, SandboxPlayer[]> {
  const out: Record<string, SandboxPlayer[]> = {};
  for (const [k, v] of Object.entries(m)) if (v.length > 0) out[k] = v;
  return out;
}
