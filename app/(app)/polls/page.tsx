"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";

interface Poll {
  id: string;
  question: string;
  options: string[];
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  creator: { alias: string };
  vote_counts: Record<number, number>;
  total_votes: number;
  my_vote: number | null;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingPoll, setVotingPoll] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create poll form
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const fetchPolls = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        const { data: player } = await supabase
          .from("players")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(player?.is_admin ?? false);
      }

      const res = await fetch("/api/polls");
      if (res.ok) {
        setPolls(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  async function handleVote(pollId: string, optionIndex: number) {
    setVotingPoll(pollId);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_index: optionIndex }),
      });

      if (res.ok) {
        // Optimistically update the poll
        setPolls((prev) =>
          prev.map((poll) => {
            if (poll.id !== pollId) return poll;
            const newCounts = { ...poll.vote_counts };
            newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
            return {
              ...poll,
              my_vote: optionIndex,
              vote_counts: newCounts,
              total_votes: poll.total_votes + 1,
            };
          })
        );
      }
    } finally {
      setVotingPoll(null);
    }
  }

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim().length > 0);
    if (!question.trim() || validOptions.length < 2) return;

    setCreating(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
        }),
      });

      if (res.ok) {
        setQuestion("");
        setOptions(["", ""]);
        setShowCreate(false);
        fetchPolls();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al crear la encuesta");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-omega-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-10 space-y-5">
      {/* Header */}
      <div className="px-4 pt-6 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-omega-muted hover:text-omega-text transition-colors"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-omega-blue/20 flex items-center justify-center">
              <BarChart3 className="size-6 text-omega-blue" />
            </div>
            <div>
              <h1 className="text-xl font-black text-omega-text">Encuestas</h1>
              <p className="text-xs text-omega-muted">Vota y ve los resultados</p>
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="omega-btn omega-btn-sm bg-omega-blue text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-1.5 hover:bg-omega-blue-glow transition-colors"
            >
              {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
              {showCreate ? "Cerrar" : "Crear"}
            </button>
          )}
        </div>
      </div>

      {/* Create poll form — any authenticated user */}
      {showCreate && isAuthenticated && (
        <div className="px-4">
          <form onSubmit={handleCreatePoll} className="omega-card p-4 space-y-3">
            <h3 className="text-sm font-bold text-omega-text">Nueva encuesta</h3>

            <div>
              <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Pregunta</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ej: Cual es el mejor tipo de Beyblade?"
                className="omega-input w-full mt-1"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-omega-muted font-bold uppercase tracking-wider">Opciones</label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Opcion ${i + 1}`}
                    className="omega-input flex-1"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                      className="text-omega-red hover:text-omega-red/80 px-2"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, ""])}
                  className="text-xs text-omega-blue font-bold hover:text-omega-blue-glow transition-colors"
                >
                  + Agregar opcion
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={creating || !question.trim() || options.filter((o) => o.trim()).length < 2}
              className="omega-btn w-full bg-omega-blue text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-omega-blue-glow transition-colors flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
              Crear encuesta
            </button>
          </form>
        </div>
      )}

      {/* Polls list */}
      <div className="px-4 space-y-4">
        {polls.length === 0 ? (
          <div className="omega-card p-10 text-center space-y-3">
            <BarChart3 className="size-10 text-omega-muted/20 mx-auto" />
            <p className="text-sm text-omega-muted/70">No hay encuestas activas</p>
          </div>
        ) : (
          polls.map((poll) => {
            const hasVoted = poll.my_vote !== null;
            const isVoting = votingPoll === poll.id;

            return (
              <div key={poll.id} className="omega-card p-4 space-y-4">
                {/* Question */}
                <div>
                  <p className="text-sm font-black text-omega-text">{poll.question}</p>
                  <p className="text-[11px] text-omega-muted mt-1">
                    por {poll.creator.alias} &middot; {poll.total_votes} voto{poll.total_votes !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {poll.options.map((option, i) => {
                    const count = poll.vote_counts[i] || 0;
                    const pct = poll.total_votes > 0 ? Math.round((count / poll.total_votes) * 100) : 0;
                    const isMyVote = poll.my_vote === i;

                    if (hasVoted) {
                      // Show results
                      return (
                        <div key={i} className="relative overflow-hidden rounded-xl border border-white/10">
                          {/* Background bar */}
                          <div
                            className={`absolute inset-0 ${isMyVote ? "bg-omega-purple/20" : "bg-omega-dark/40"}`}
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isMyVote && <CheckCircle className="size-4 text-omega-purple shrink-0" />}
                              <span className={`text-sm ${isMyVote ? "font-bold text-omega-text" : "text-omega-muted"}`}>
                                {option}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-omega-muted">{count}</span>
                              <span className={`text-sm font-black ${isMyVote ? "text-omega-purple" : "text-omega-muted"}`}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Not voted yet - show clickable options
                    return (
                      <button
                        key={i}
                        onClick={() => handleVote(poll.id, i)}
                        disabled={isVoting}
                        className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-omega-dark/50 hover:border-omega-purple/50 hover:bg-omega-purple/5 transition-all active:scale-[0.98] text-sm text-omega-text disabled:opacity-50"
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
