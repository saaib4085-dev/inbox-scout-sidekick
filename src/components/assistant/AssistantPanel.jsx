import { useEffect, useRef } from 'react';
import { Bot, Minus, Send, RotateCcw } from 'lucide-react';
import AssistantMessage from '@/components/assistant/AssistantMessage';

const SUGGESTIONS = [
  'Draft an email to follow up on a quote',
  'Write a polite decline',
  'Tips for cold outreach',
];

export default function AssistantPanel({
  messages,
  input,
  sending,
  error,
  onInput,
  onSend,
  onClose,
  onReset,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  return (
    <div className="relative w-[min(92vw,390px)] rounded-[26px] bg-gradient-to-br from-assistant-from to-assistant-to text-white shadow-2xl shadow-assistant-to/40">
      <div className="absolute -top-3 left-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-semibold tracking-tight ring-1 ring-inset ring-white/25 backdrop-blur">
        <Bot className="h-3.5 w-3.5" strokeWidth={1.8} />
        AI Assistant
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1">
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Start a new chat"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Minimize assistant"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <Minus className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 pb-4 pt-8">
        {messages.length === 0 ? (
          <div className="py-2">
            <h2 className="text-center font-display text-[22px] leading-snug tracking-tight">
              Hello, how can I help you today?
            </h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSend(suggestion)}
                  className="rounded-full bg-white/12 px-3.5 py-2 text-[12px] leading-snug text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="max-h-[46vh] space-y-2.5 overflow-y-auto pr-0.5">
            {messages.map((message, index) => (
              <AssistantMessage key={index} message={message} />
            ))}
            {sending && (
              <p className="text-[12px] text-white/70">Thinking…</p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-[11px] text-white/85">{error}</p>}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
          className="mt-4 flex items-center gap-2 rounded-full bg-assistant-input p-1.5 pl-4"
        >
          <input
            value={input}
            onChange={(event) => onInput(event.target.value)}
            placeholder="Type here..."
            aria-label="Ask the assistant"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-white placeholder:text-white/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-assistant-to transition-opacity hover:opacity-90 disabled:opacity-45"
          >
            <Send className="h-4 w-4" strokeWidth={1.9} />
          </button>
        </form>

        <p className="mt-2.5 text-center text-[10px] leading-relaxed text-white/65">
          Knows your leads, credits and the page you are on · 15 credits per message
        </p>
      </div>
    </div>
  );
}