"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Loader2, Trash2, Users, MessageSquare, ChevronUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/app/_components/presence-provider";

interface ChatMessage {
  id: string;
  player_id: string;
  content: string;
  created_at: string;
  player: { alias: string; avatar_url: string | null } | null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldScrollRef = useRef(true);

  const { onlineCount } = usePresence();

  // Load current user info
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: player } = await supabase
          .from("players")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(player?.is_admin ?? false);
      }
    }
    loadUser();
  }, []);

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/chat/messages?limit=50");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView();
      inputRef.current?.focus();
    }
  }, [loading]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const newMsg = payload.new as { id: string; player_id: string; content: string; created_at: string };

          // Don't duplicate if we already have it (from our own send)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // Fetch the player info
            (async () => {
              const { data: player } = await supabase
                .from("players")
                .select("alias, avatar_url")
                .eq("id", newMsg.player_id)
                .single();

              setMessages((current) =>
                current.map((m) =>
                  m.id === newMsg.id && !m.player
                    ? { ...m, player }
                    : m
                )
              );
            })();

            // Check if user is scrolled to bottom
            const container = messagesContainerRef.current;
            if (container) {
              const isAtBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 100;
              shouldScrollRef.current = isAtBottom;
            }

            return [
              ...prev,
              {
                id: newMsg.id,
                player_id: newMsg.player_id,
                content: newMsg.content,
                created_at: newMsg.created_at,
                player: null,
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load more (scroll up)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldestMessage = messages[0];
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(
        `/api/chat/messages?limit=50&cursor=${encodeURIComponent(oldestMessage.created_at)}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.messages.length > 0) {
        shouldScrollRef.current = false;
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore);

        // Maintain scroll position
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch {
      // Silent
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, messages]);

  // Send message
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || cooldown) return;

    setSending(true);
    shouldScrollRef.current = true;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) throw new Error();
      const newMessage = await res.json();

      // Add message locally (realtime might also add it, dedup handles that)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      setInput("");

      // Cooldown of 2 seconds
      setCooldown(true);
      setTimeout(() => setCooldown(false), 2000);
    } catch {
      // Silent
    } finally {
      setSending(false);
    }
  }

  // Delete message (admin)
  async function handleDelete(messageId: string) {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      // Realtime will remove it, but also remove locally
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      // Silent
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";

    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
    });
  }

  // Group messages by date
  function getDateKey(dateStr: string) {
    return new Date(dateStr).toDateString();
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-omega-dark/90 backdrop-blur-xl border-b border-omega-border/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="size-8 rounded-lg bg-omega-card flex items-center justify-center hover:bg-omega-card-hover transition-colors shrink-0"
          >
            <ArrowLeft className="size-4 text-omega-muted" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-omega-text">Chat General</h1>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-omega-green shadow-[0_0_4px_rgba(46,213,115,0.6)]" />
              <span className="text-[11px] text-omega-muted">
                {onlineCount} {onlineCount === 1 ? "online" : "online"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-omega-muted">
            <Users className="size-4" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="omega-btn omega-btn-secondary px-4 py-2 text-xs !rounded-full"
            >
              {loadingMore ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <ChevronUp className="size-3" />
                  Cargar anteriores
                </>
              )}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-omega-purple animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <MessageSquare className="size-12 text-omega-muted/20" />
            <p className="text-sm text-omega-muted/70">
              No hay mensajes todavia. Se el primero!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isOwn = msg.player_id === currentUserId;
              const alias =
                (msg.player as { alias: string } | null)?.alias ?? "...";
              const avatarUrl =
                (msg.player as { avatar_url: string | null } | null)
                  ?.avatar_url ?? null;

              // Show date separator
              const showDate =
                i === 0 ||
                getDateKey(msg.created_at) !==
                  getDateKey(messages[i - 1].created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center py-3">
                      <span className="text-[10px] font-bold text-omega-muted/50 bg-omega-dark/80 px-3 py-1 rounded-full uppercase tracking-wider">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex gap-2 py-1 ${
                      isOwn ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    {!isOwn && (
                      <div className="size-7 rounded-full overflow-hidden bg-omega-dark border border-omega-border shrink-0 mt-0.5">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-[10px] font-black text-omega-purple">
                            {alias.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`max-w-[75%] group ${
                        isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Alias + time */}
                      {!isOwn && (
                        <p className="text-[10px] font-bold text-omega-muted/70 mb-0.5 px-1">
                          {alias}
                        </p>
                      )}

                      <div className="flex items-end gap-1">
                        {isOwn && isAdmin && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-omega-red text-omega-muted/40"
                            title="Eliminar"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}

                        <div
                          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                            isOwn
                              ? "rounded-br-sm bg-omega-purple/20 border border-omega-purple/30 text-omega-text"
                              : "rounded-bl-sm bg-omega-card/80 border border-omega-border/30 text-omega-text/90"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <p
                            className={`text-[9px] mt-1 ${
                              isOwn
                                ? "text-omega-purple/50 text-right"
                                : "text-omega-muted/40"
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </p>
                        </div>

                        {!isOwn && isAdmin && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-omega-red text-omega-muted/40"
                            title="Eliminar"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 border-t border-omega-border/30 bg-omega-dark/90 backdrop-blur-xl px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            placeholder="Escribi un mensaje..."
            disabled={sending}
            maxLength={500}
            className="omega-input flex-1 !rounded-xl"
          />
          <button
            type="submit"
            disabled={sending || cooldown || !input.trim()}
            className="omega-btn omega-btn-purple size-10 !p-0 !rounded-xl shrink-0 shadow-sm hover:shadow-md"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
        {input.length > 400 && (
          <p className="text-[10px] text-omega-muted/50 text-right mt-1">
            {input.length}/500
          </p>
        )}
      </div>
    </div>
  );
}
