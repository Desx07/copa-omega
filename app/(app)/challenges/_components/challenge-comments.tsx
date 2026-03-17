"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Loader2, Trash2, MessageSquare } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  player_id: string;
  player: { id: string; alias: string; avatar_url: string | null };
};

export default function ChallengeComments({
  challengeId,
  userId,
}: {
  challengeId: string;
  userId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch {
      // silent
    }
    setLoading(false);
  }, [challengeId]);

  useEffect(() => {
    if (open) fetchComments();
  }, [open, fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setContent("");
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="border-t border-white/[0.04]">
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 flex items-center justify-center gap-1.5 text-[10px] text-omega-muted hover:text-omega-text transition-colors"
      >
        <MessageSquare className="size-3" />
        {open ? "Cerrar comentarios" : `Comentarios${comments.length > 0 ? ` (${comments.length})` : ""}`}
      </button>

      {open && (
        <div>
          {/* Comments list */}
          <div className="max-h-40 overflow-y-auto px-4 space-y-2 pb-2">
            {loading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="size-4 animate-spin text-omega-muted" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-[10px] text-omega-muted/50 text-center py-2">
                Se el primero en comentar
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="size-5 rounded-full bg-omega-dark border border-omega-border/50 overflow-hidden shrink-0 mt-0.5">
                    {c.player.avatar_url ? (
                      <img src={c.player.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-[8px] font-bold text-omega-purple">
                        {c.player.alias.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-omega-text">{c.player.alias}</span>
                    <p className="text-[11px] text-omega-muted/80">{c.content}</p>
                  </div>
                  {c.player_id === userId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-omega-muted/30 hover:text-omega-red transition-colors shrink-0"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.04] bg-omega-surface/30"
          >
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200}
              placeholder="Picantea el reto..."
              className="flex-1 bg-omega-dark rounded-lg px-3 py-2 text-xs text-omega-text border border-white/[0.06] outline-none focus:border-omega-purple/50 transition-colors placeholder:text-omega-muted/40"
            />
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="omega-btn omega-btn-primary size-8 !p-0 shrink-0"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
