import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AssistantPanel from '@/components/assistant/AssistantPanel';

const STORAGE_KEY = 'inboxhero.assistant.thread';
const HIDDEN_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/oauth-consent'];

const readThread = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function AssistantWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(readThread);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or blocked — the thread simply stays in memory
    }
  }, [messages]);

  const send = async (text) => {
    const content = (typeof text === 'string' ? text : input).trim();
    if (!content || sending) return;

    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setError('');
    setSending(true);

    try {
      const response = await base44.functions.invoke('assistant', {
        messages: next.slice(-10),
        page: pathname,
      });
      const reply = response.data?.reply;
      if (!reply) throw new Error(response.data?.error || 'No reply');
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'The assistant could not reply just now. Please try again.',
      );
    } finally {
      setSending(false);
    }
  };

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end md:bottom-6 md:right-6">
      {open ? (
        <AssistantPanel
          messages={messages}
          input={input}
          sending={sending}
          error={error}
          onInput={setInput}
          onSend={send}
          onClose={() => setOpen(false)}
          onReset={() => {
            setMessages([]);
            setError('');
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-assistant-from to-assistant-to px-5 py-3 text-[13px] font-medium text-white shadow-lg shadow-assistant-to/40 transition-transform hover:scale-[1.02]"
        >
          <Bot className="h-4 w-4" strokeWidth={1.7} />
          AI Assistant
        </button>
      )}
    </div>
  );
}