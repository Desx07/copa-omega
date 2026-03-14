"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) {
        throw new Error("Error en la respuesta");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Uh, algo falló... Intentá de nuevo en unos segundos, blader. 🔧",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-omega-border/60 bg-omega-dark/95 shadow-2xl shadow-omega-purple/20 backdrop-blur-xl sm:bottom-6 sm:right-6 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-omega-border/40 bg-gradient-to-r from-omega-purple/20 via-omega-card/80 to-omega-blue/20 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-omega-purple/30 ring-2 ring-omega-purple/50">
                <Bot className="size-4 text-omega-purple-glow" />
              </div>
              <div>
                <p className="text-sm font-bold text-omega-text">BeyBot</p>
                <p className="text-[10px] text-omega-muted">
                  Asistente Copa Omega Star
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-lg text-omega-muted transition-colors hover:bg-omega-card hover:text-omega-text"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "60vh", minHeight: "280px" }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-omega-purple/15 ring-2 ring-omega-purple/30">
                  <Bot className="size-7 text-omega-purple-glow" />
                </div>
                <div>
                  <p className="text-sm font-bold text-omega-text">
                    Hola, blader! 🌟
                  </p>
                  <p className="mt-1 text-xs text-omega-muted leading-relaxed max-w-[240px]">
                    Soy BeyBot, tu asistente de Copa Omega Star. Preguntame
                    sobre el torneo, estrategias, o decime contra quién vas a
                    pelear!
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
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
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
                  <span
                    className="size-1.5 rounded-full bg-omega-purple animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="size-1.5 rounded-full bg-omega-purple animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-omega-border/40 bg-omega-card/40 p-3">
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="Preguntale a BeyBot..."
                disabled={loading}
                className="flex-1 rounded-xl border border-omega-border/40 bg-omega-dark/80 px-3.5 py-2.5 text-sm text-omega-text placeholder:text-omega-muted/50 outline-none transition-colors focus:border-omega-purple/60 focus:ring-1 focus:ring-omega-purple/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-omega-purple/80 text-white transition-all hover:bg-omega-purple active:scale-95 disabled:opacity-40 disabled:hover:bg-omega-purple/80"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
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
            ? "bg-omega-card border border-omega-border/60 text-omega-muted hover:text-omega-text shadow-omega-dark/50"
            : "bg-gradient-to-br from-omega-purple to-omega-blue text-white shadow-omega-purple/30 hover:shadow-omega-purple/50 hover:scale-105"
        }`}
        aria-label={open ? "Cerrar chat" : "Abrir BeyBot"}
      >
        {open ? (
          <X className="size-5" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </button>
    </>
  );
}
