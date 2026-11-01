import { formatCredits } from '@/lib/packs';

export default function LeaderList({ title, subtitle, rows, emptyLabel }) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="rounded-lg border hairline bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] font-medium tracking-tight">{title}</p>
        {subtitle && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-5 text-[13px] text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="truncate text-foreground/80">{row.label}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatCredits(row.count)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}