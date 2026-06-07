"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Wrench, Sparkles } from "lucide-react";
import { useOtto } from "@/components/OttoProvider";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const GENERIC_PROMPTS = [
  "Why won't my car start?",
  "What does a P0420 code mean?",
  "My brakes squeal — what should I check?",
];
const CONTEXT_PROMPTS = [
  "What should I check first?",
  "Is it safe to drive?",
  "Roughly what will this cost?",
];

export function OttoChat() {
  const otto = useOtto();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const uid = () => `m${++idRef.current}`;
  const vehicle = otto.context?.vehicle;

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Msg = { id: uid(), role: "user", content: trimmed };
    const ottoId = uid();
    const history = [...messages, userMsg];
    setMessages([...history, { id: ottoId, role: "assistant", content: "" }]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          context: otto.context ?? undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`chat failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === ottoId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === ottoId && !m.content
            ? { ...m, content: "Sorry — I hit a snag. Please try again." }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  const suggestions = vehicle ? CONTEXT_PROMPTS : GENERIC_PROMPTS;

  return (
    <>
      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Otto" : "Open Otto, the AI mechanic"}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-accent-orange text-background shadow-glow-orange"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot className="h-7 w-7" strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-accent-green" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Otto chat"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-5 z-50 flex h-[min(72vh,600px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-elevated/60 px-4 py-3">
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-orange/15">
                <Bot className="h-5 w-5 text-accent-orange" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold leading-none text-primary">Otto</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                  {vehicle ? `On your ${vehicle}` : "Your AI mechanic"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-secondary transition-colors hover:bg-elevated hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {/* Greeting */}
              <OttoBubble>
                Hey, I&apos;m Otto 🔧 — your AI mechanic.{" "}
                {vehicle
                  ? `I can see you're looking at the ${vehicle}. Ask me anything about it.`
                  : "Ask me about any car problem — noises, warning lights, repairs, or costs."}
              </OttoBubble>

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent-orange/15 px-3.5 py-2 text-sm leading-relaxed text-primary">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <OttoBubble key={m.id}>
                    {m.content || (streaming ? <TypingDots /> : "")}
                  </OttoBubble>
                ),
              )}

              {/* Suggested prompts (only before first message) */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-elevated px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:border-accent-orange/40 hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-border bg-elevated/40 p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={taRef}
                  value={input}
                  rows={1}
                  placeholder="Ask Otto about your car…"
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  className="max-h-[120px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-primary placeholder:text-secondary/60 focus:border-accent-orange/70 focus:outline-none focus:ring-1 focus:ring-accent-orange/40"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  aria-label="Send"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-orange text-background transition-opacity hover:bg-orange-400 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-center font-mono text-[10px] text-secondary/60">
                <Sparkles className="h-2.5 w-2.5" />
                Otto can be wrong — verify safety-critical repairs.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function OttoBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-orange/15">
        <Wrench className="h-3.5 w-3.5 text-accent-orange" />
      </span>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-elevated px-3.5 py-2 text-sm leading-relaxed text-primary">
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 0.15, 0.3].map((d, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-secondary"
          style={{ animation: `spark 1s ease-in-out ${d}s infinite` }}
        />
      ))}
    </span>
  );
}
