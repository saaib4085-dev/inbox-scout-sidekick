import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import LeadQueuePreview from '@/components/marketing/LeadQueuePreview';
import PricingCards from '@/components/marketing/PricingCards';
import { FREE_CREDITS, FREE_SCRAPES, LEADS_PER_RUN, formatCredits } from '@/lib/packs';

const steps = [
  {
    n: '01',
    title: 'Describe your buyer',
    body: 'One paragraph about who you want to reach. No filters, no boolean strings, no spreadsheet imports.',
  },
  {
    n: '02',
    title: 'We scout and score',
    body: 'InboxHero reads your conversations, ranks every prospect by real buying intent and explains the signal behind each score.',
  },
  {
    n: '03',
    title: 'You send the reply',
    body: 'Each lead arrives with a short, human reply written in your voice. Copy it, tweak a line, hit send.',
  },
];

const features = [
  {
    title: 'Intent over keywords',
    body: 'Scores are based on what people actually said and did — pricing questions, silence broken, decks forwarded.',
  },
  {
    title: 'Replies you would write',
    body: 'Drafts stay under 70 words, reference the real signal, and never sound like a mail merge.',
  },
  {
    title: 'Credits, not subscriptions',
    body: 'Scraping a customer costs one scrape and an AI message costs 15 credits. Top up when you need to — nothing expires.',
  },
  {
    title: 'Yours to delete',
    body: 'Export your data or erase your account and every stored record from the account screen, at any time.',
  },
];

export default function Landing() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-primary/[0.06] to-transparent" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border hairline bg-card/60 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                AI lead scouting for your inbox
              </span>
            </div>

            <h1 className="mt-7 font-display text-[3.1rem] leading-[0.96] tracking-[-0.01em] text-foreground sm:text-6xl lg:text-[4.4rem]">
              The five people in your inbox
              <span className="italic text-primary"> who actually want to buy.</span>
            </h1>

            <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              InboxHero reads the noise, ranks every prospect by intent, and hands you a
              ready-to-send reply. Describe your ideal buyer — we do the scouting.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/pricing"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                Start with {formatCredits(FREE_CREDITS)} free credits
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-foreground/15 px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
              >
                See how a run works
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              No card to start · Credits never expire
            </p>
          </div>

          <LeadQueuePreview />
        </div>

        <div className="border-y hairline">
          <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y hairline px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
            {[
              ['5 customers', 'scored per brief'],
              ['1 scrape', 'per customer'],
              ['Under a minute', 'from brief to drafts'],
            ].map(([value, label]) => (
              <div key={label} className="py-6 md:px-8 md:first:pl-0 md:last:pr-0">
                <p className="text-lg font-medium tracking-tight">{value}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">How it works</p>
          <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Three steps, one honest queue.
          </h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border hairline bg-border/70 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="bg-card p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {step.n}
              </p>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y hairline bg-card/60">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                Why it works
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-[2.75rem]">
                Built for people who send their own emails.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border hairline bg-border/70 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="bg-background p-6">
                  <h3 className="text-[15px] font-medium tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Pricing</p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">
              Buy credits once. Use them whenever.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            One-time packs, no subscription. Checkout requires consent to our terms
            and to immediate credit delivery.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards ctaLabel="Get this pack" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="overflow-hidden rounded-xl bg-foreground px-7 py-14 text-background md:px-14 md:py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
                Stop guessing who to write to
                <span className="italic text-primary-foreground/70"> tomorrow morning.</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-background/70">
                {formatCredits(FREE_CREDITS)} free credits and {FREE_SCRAPES} free customer scrapes
                are waiting on your first workspace. That is enough for{' '}
                {Math.floor(FREE_SCRAPES / LEADS_PER_RUN)} full scouting runs.
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-background px-7 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              Open checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}