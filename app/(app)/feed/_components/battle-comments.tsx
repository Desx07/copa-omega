"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Trash2, Loader2 } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  player_id: string;
  player: { id: string; alias: string; avatar_url: string | null };
};

type BattleCommentsProps = {
  matchId: string;
  userId: string;
  isAdmin: boolean;
};

export default function BattleComments({
  matchId,
  userId,
  isAdmin,
}: BattleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/${matchId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/battles/${matchId}/comments`, {
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
      // ignore
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(
        `/api/battles/${matchId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // ignore
    }
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  return (
    <div className="space-y-0">
      {/* Comments list */}
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <Loader2 className="size-4 text-omega-muted animate-spin mx-auto" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-omega-muted/50">Sin comentarios</p>
          </div>
        ) : (
          comments.map((comment) => {
            const playerData = comment.player as unknown as {
              id: string;
              alias: string;
              avatar_url: string | null;
            };
            const canDelete =
              comment.player_id === userId || isAdmin;

            return (
              <div
                key={comment.id}
                className="omega-row py-2.5 px-4 gap-2.5"
              >
                <div className="size-7 rounded-full bg-omega-dark overflow-hidden shrink-0 border border-omega-border/20">
                  {playerData.avatar_url ? (
                    <img
                      src={playerData.avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                      {playerData.alias?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-omega-text">
                      {playerData.alias}
                    </span>
                    <span className="text-[10px] text-omega-muted">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-omega-text/80 mt-0.5 break-words">
                    {comment.content}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-omega-muted/30 hover:text-omega-red transition-colors shrink-0"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Comment input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.04] bg-omega-surface/30"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={200}
          placeholder="Comentar..."
          className="flex-1 bg-omega-dark rounded-lg px-3 py-2 text-xs text-omega-text border border-white/[0.06] outline-none focus:border-omega-purple/50 transition-colors placeholder:text-omega-muted/40"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="omega-btn omega-btn-primary size-8 !p-0 shrink-0"
        >
          {submitting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Send className="size-3" />
          )}
        </button>
      </form>
    </div>
  );
}
