import { formatCredits } from '@/lib/packs';
import { share } from '@/lib/insights';

const TONES = {
  new: 'bg-primary',
  contacted: 'bg-chart-2',
  qualified: 'bg-chart-3',
  archived: 'bg-muted-foreground/40',
};

export default function StatusBreakdown({ data, total }) {
  return (
    <div className="rounded-lg border hairline bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] font-medium tracking-tight">Queue by status</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {formatCredits(total)} leads
        </p>
      </div>

      <ul className="mt-5 space-y-3.5">
        {data.map((row) => (
          <li key={row.status}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="capitalize text-foreground/80">{row.status}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {formatCredits(row.count)} · {share(row.count, total)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${TONES[row.status] ?? 'bg-primary'}`}
                style={{ width: `${share(row.count, total)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}