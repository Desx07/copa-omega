"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState("BeyBot");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !historyLoaded) {
      loadHistory();
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("bot_conversations")
        .select("messages, bot_name")
        .single();

      if (data) {
        setMessages(data.messages || []);
        setBotName(data.bot_name || "BeyBot");
        setNameInput(data.bot_name || "BeyBot");
      }
    } catch {
      // No history yet
    }
    setHistoryLoaded(true);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [userMessage],
          botName,
        }),
      });

      if (!res.ok) throw new Error("Error");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Uh, algo fallo... Intenta de nuevo, blader." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRenamBot() {
    const name = nameInput.trim() || "BeyBot";
    setBotName(name);
    setEditingName(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("bot_conversations")
        .upsert({
          player_id: user.id,
          bot_name: name,
          messages: messages,
          updated_at: new Date().toISOString(),
        }, { onConflict: "player_id" });
    } catch {
      // Silent
    }
  }

  async function handleClearHistory() {
    setMessages([]);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("bot_conversations")
        .upsert({
          player_id: user.id,
          messages: [],
          bot_name: botName,
          updated_at: new Date().toISOString(),
        }, { onConflict: "player_id" });
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col omega-card-elevated !rounded-2xl sm:bottom-6 sm:right-6 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-omega-border/40 bg-gradient-to-r from-omega-purple/20 via-omega-card/80 to-omega-blue/20 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-omega-purple/30 ring-2 ring-omega-purple/50">
                <Bot className="size-4 text-omega-purple-glow" />
              </div>
              <div>
                {editingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenamBot()}
                      onBlur={handleRenamBot}
                      maxLength={20}
                      autoFocus
                      className="w-24 bg-transparent border-b border-omega-purple text-sm font-bold text-omega-text outline-none"
                    />
                  </div>
                ) : (
                  <button onClick={() => { setNameInput(botName); setEditingName(true); }} className="flex items-center gap-1 group">
                    <p className="text-sm font-bold text-omega-text">{botName}</p>
                    <Pencil className="size-2.5 text-omega-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                <p className="text-[10px] text-omega-muted">Asistente Copa Omega Star</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-2 py-1 rounded text-[10px] text-omega-muted hover:text-omega-red transition-colors"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="omega-btn omega-btn-secondary size-7 !p-0 !rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "60vh", minHeight: "280px" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-omega-purple/15 ring-2 ring-omega-purple/30">
                  <Bot className="size-7 text-omega-purple-glow" />
                </div>
                <div>
                  <p className="text-sm font-bold text-omega-text">Hola, blader!</p>
                  <p className="mt-1 text-xs text-omega-muted leading-relaxed max-w-[240px]">
                    Soy {botName}, tu asistente de Copa Omega Star. Preguntame sobre el torneo, combos, estrategias, o decime contra quien vas a pelear!
                  </p>
                  <p className="mt-2 text-[10px] text-omega-muted/60">
                    Toca mi nombre para cambiarlo
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-omega-purple/20 mt-0.5">
                    <Bot className="size-3 text-omega-purple-glow" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-omega-blue/20 border border-omega-blue/30 text-omega-text"
                      : "rounded-bl-sm bg-omega-card/80 border border-omega-border/30 text-omega-text/90"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-omega-blue/20 mt-0.5">
                    <User className="size-3 text-omega-blue" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-omega-purple/20">
                  <Bot className="size-3 text-omega-purple-glow" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-omega-card/80 border border-omega-border/30 px-4 py-3">
                  <span className="size-1.5 rounded-full bg-omega-purple animate-pulse" />
                  <span className="size-1.5 rounded-full bg-omega-purple animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="size-1.5 rounded-full bg-omega-purple animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-omega-border bg-omega-surface p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Preguntale a ${botName}...`}
                disabled={loading}
                className="omega-input flex-1 !rounded-xl"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="omega-btn omega-btn-purple size-10 !p-0 !rounded-xl shrink-0"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-90 sm:bottom-6 sm:right-6 ${
          open
            ? "omega-btn omega-btn-secondary !rounded-full"
            : "omega-btn omega-btn-primary !rounded-full hover:scale-105"
        }`}
        aria-label={open ? "Cerrar chat" : `Abrir ${botName}`}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
