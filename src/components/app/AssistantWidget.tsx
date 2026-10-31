import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Minus, Send, Bot } from "lucide-react";
import { toast } from "sonner";
import { askAssistant } from "@/lib/ai.functions";
import { CREDIT_COSTS } from "@/lib/credits";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["Draft an email to follow up on a quote", "Write a polite decline", "Tips for cold outreach"];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(askAssistant);
  const qc = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({ data: { messages: next.slice(-12) } });
      setMsgs([...next, { role: "assistant", content: res?.answer ?? "" }]);
    } catch (e) {
      toast.error((e as Error).message);
      setMsgs(msgs);
      setInput(q);
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["ledger"] });
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-assistant px-5 py-3 text-sm font-semibold text-assistant-foreground shadow-lift transition hover:scale-105"
      >
        <Bot className="h-4 w-4" /> AI Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-2rem))] drop-shadow-2xl">
      {/* Tab */}
      <div className="flex items-end">
        <div className="relative flex items-center gap-2 rounded-t-[1.5rem] bg-gradient-assistant px-5 pb-2 pt-3 text-assistant-foreground">
          <Bot className="h-4 w-4" />
          <span className="font-display text-base font-semibold">AI Assistant</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setOpen(false)}
          aria-label="Minimise assistant"
          className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-card text-muted-foreground shadow-soft hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
      {/* Body */}
      <div className="rounded-[1.75rem] rounded-tl-none bg-gradient-assistant p-4 text-assistant-foreground">
        <div className="max-h-[50vh] min-h-[140px] space-y-3 overflow-y-auto pr-1">
          {msgs.length === 0 && (
            <div className="py-4 text-center">
              <p className="font-display text-lg leading-snug">Hello,<br />How can I help you today?</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full bg-assistant-foreground/15 px-3 py-1 text-xs hover:bg-assistant-foreground/25"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "group relative max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user" ? "bg-card text-card-foreground" : "bg-assistant-foreground/12",
                )}
              >
                {m.content}
                {m.role === "assistant" && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast.success("Copied");
                    }}
                    className="mt-1 flex items-center gap-1 text-[11px] opacity-80 hover:opacity-100"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-1 px-2 py-2" aria-label="Thinking">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-assistant-foreground/80" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex items-center gap-2 rounded-full bg-assistant-input py-1.5 pl-4 pr-1.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here…"
            className="min-w-0 flex-1 bg-transparent text-sm text-assistant-foreground placeholder:text-assistant-foreground/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card text-assistant disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] opacity-80">{CREDIT_COSTS.aiQuestion} credits per question</p>
      </div>
    </div>
  );
}
