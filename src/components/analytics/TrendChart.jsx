import { formatCredits } from '@/lib/packs';

export default function TrendChart({ data, label = 'Leads discovered per day' }) {
  const max = Math.max(1, ...data.map((point) => point.leads));

  return (
    <div className="rounded-lg border hairline bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] font-medium tracking-tight">{label}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Last 14 days
        </p>
      </div>

      <div className="mt-6 flex h-32 items-end gap-1.5">
        {data.map((point) => (
          <div
            key={point.day}
            className="group flex h-full flex-1 flex-col justify-end"
            title={`${point.day} · ${point.leads} leads`}
          >
            <div
              className="w-full rounded-sm bg-primary/60 transition-colors group-hover:bg-primary"
              style={{ height: `${point.leads ? Math.max(6, (point.leads / max) * 100) : 2}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        <span>{data[0]?.day.slice(5)}</span>
        <span>peak {formatCredits(max)} / day</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}