import { Check } from 'lucide-react';
import { formatCredits, formatPrice } from '@/lib/packs';

export default function PackCard({ pack, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pack.id)}
      aria-pressed={selected}
      className={
        selected
          ? 'w-full rounded-lg border border-foreground bg-card p-5 text-left shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] transition-all'
          : 'w-full rounded-lg border hairline bg-card/60 p-5 text-left transition-all hover:border-foreground/30 hover:bg-card'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-medium tracking-tight">{pack.name}</p>
            {pack.popular && (
              <span className="rounded-full border border-primary/30 bg-primary/[0.07] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
                Most chosen
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{pack.blurb}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-3xl leading-none">{formatPrice(pack)}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {pack.contact ? 'custom' : 'one-time'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t hairline pt-3">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground/70">
          {selected ? (
            <Check className="h-3.5 w-3.5 text-primary" />
          ) : (
            <span className="h-3.5 w-3.5 rounded-full border border-border" />
          )}
          {formatCredits(pack.credits)} credits
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {formatCredits(pack.scrapes)} scrapes
        </span>
      </div>
    </button>
  );
}