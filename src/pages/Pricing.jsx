import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import PackCard from '@/components/checkout/PackCard';
import CheckoutPanel from '@/components/checkout/CheckoutPanel';
import {
  CHECKOUT_PACKS,
  COST_AI_MESSAGE,
  COST_SAMPLE_DRAFT,
  FREE_CREDITS,
  FREE_SCRAPES,
  LEADS_PER_RUN,
  MAX_BRIEFS,
  SCRAPE_COST_PER_LEAD,
  formatCredits,
  getPack,
} from '@/lib/packs';

export default function Pricing() {
  const [params] = useSearchParams();
  const requested = params.get('pack');
  const initial = CHECKOUT_PACKS.some((pack) => pack.id === requested) ? requested : 'pro';
  const [selected, setSelected] = useState(initial);
  const pack = getPack(selected);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          Pricing & checkout
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-tight md:text-[3.4rem]">
          Buy once. Scout whenever you like.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
          Every workspace starts free with {formatCredits(FREE_CREDITS)} credits and {FREE_SCRAPES}{' '}
          customer scrapes — enough for {Math.floor(FREE_SCRAPES / LEADS_PER_RUN)} scouting runs.
          After that, pick a plan. One-time payment, no subscription, no card stored.
        </p>
      </div>

      {params.get('checkout') === 'cancelled' && (
        <p className="mt-8 rounded-lg border hairline bg-secondary/50 px-4 py-3 text-[13px] text-muted-foreground">
          Checkout was cancelled — nothing was charged and your balance is unchanged.
        </p>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start lg:gap-12">
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Choose a plan
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Prices in EUR
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {CHECKOUT_PACKS.map((item) => (
              <PackCard
                key={item.id}
                pack={item}
                selected={item.id === selected}
                onSelect={setSelected}
              />
            ))}
          </div>

          <div className="mt-6 rounded-lg border hairline bg-secondary/40 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              How your balance is spent
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-foreground/80">
              <li>
                • Scraping a customer costs {SCRAPE_COST_PER_LEAD} scrape. A scouting run returns{' '}
                {LEADS_PER_RUN} customers per brief.
              </li>
              <li>• Bulk scouting runs up to {MAX_BRIEFS} briefs at once.</li>
              <li>
                • An AI assistant message costs {COST_AI_MESSAGE} credits; a fresh sample draft
                costs {COST_SAMPLE_DRAFT} credits.
              </li>
              <li>• Only completed work is charged, and nothing expires.</li>
            </ul>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <CheckoutPanel pack={pack} />
          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <ArrowDown className="mt-0.5 h-3 w-3 shrink-0 rotate-180" />
            <span>
              Consent to immediate delivery is required before payment — see the{' '}
              <Link
                to="/terms"
                className="underline decoration-border underline-offset-2 hover:decoration-foreground"
              >
                Terms
              </Link>{' '}
              and{' '}
              <Link
                to="/refunds"
                className="underline decoration-border underline-offset-2 hover:decoration-foreground"
              >
                Refund policy
              </Link>
              .
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}