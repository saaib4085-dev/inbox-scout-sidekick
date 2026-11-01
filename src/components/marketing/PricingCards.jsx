import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { CREDIT_PACKS, formatCredits, formatPrice } from '@/lib/packs';

export default function PricingCards({ ctaLabel = 'Choose pack' }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {CREDIT_PACKS.map((pack) => (
        <div
          key={pack.id}
          className={
            pack.popular
              ? 'relative flex flex-col rounded-lg border border-foreground bg-foreground p-6 text-background'
              : 'relative flex flex-col rounded-lg border hairline bg-card p-6'
          }
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70">
              {pack.name}
            </p>
            {pack.popular && (
              <span className="rounded-full border border-background/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]">
                Most chosen
              </span>
            )}
          </div>

          <p className="mt-6 font-display text-5xl leading-none tracking-tight">
            {formatPrice(pack)}
          </p>
          <p className={pack.popular ? 'mt-2 text-sm text-background/70' : 'mt-2 text-sm text-muted-foreground'}>
            {pack.free ? 'free to start' : pack.contact ? 'custom plan' : 'one-time'} ·{' '}
            {formatCredits(pack.credits)} credits · {formatCredits(pack.scrapes)} scrapes
          </p>

          <p
            className={
              pack.popular
                ? 'mt-5 text-[13px] leading-relaxed text-background/80'
                : 'mt-5 text-[13px] leading-relaxed text-muted-foreground'
            }
          >
            {pack.blurb}
          </p>

          <ul className="mt-5 space-y-2">
            {pack.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[13px]">
                <Check
                  className={
                    pack.popular
                      ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-background/70'
                      : 'mt-0.5 h-3.5 w-3.5 shrink-0 text-primary'
                  }
                />
                <span className={pack.popular ? 'text-background/85' : 'text-foreground/80'}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to={pack.free ? '/pricing' : `/pricing?pack=${pack.id}`}
            className={
              pack.popular
                ? 'mt-8 inline-flex h-11 items-center justify-center rounded-full bg-background text-sm font-medium text-foreground transition-opacity hover:opacity-90'
                : 'mt-8 inline-flex h-11 items-center justify-center rounded-full border border-foreground/15 text-sm font-medium text-foreground transition-colors hover:border-foreground/40'
            }
          >
            {pack.cta || ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}