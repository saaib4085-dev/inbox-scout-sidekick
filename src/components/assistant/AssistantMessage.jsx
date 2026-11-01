export default function AssistantMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed text-white ${
          isUser ? 'bg-white/25' : 'bg-white/12 ring-1 ring-inset ring-white/20'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}