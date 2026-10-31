import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bot, Check, Mail, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { CreditPoints } from "@/components/app/PricingInfo";
import { PLANS, TOPUP_PACK, formatCredits } from "@/lib/credits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InboxHero — Draft professional client emails in 3 seconds" },
      {
        name: "description",
        content: "Paste an email, pick a tone, and get three polished AI replies. Find leads, review every email, and send from your own Gmail or Outlook.",
      },
      { property: "og:title", content: "InboxHero — AI email drafter & smart replies" },
      { property: "og:description", content: "Three polished AI reply drafts in seconds, plus lead search and outreach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "Three drafts, one click", text: "Direct, warm and strategic options for every email — tuned to your tone and strategy." },
  { icon: Search, title: "Find leads without websites", text: "Search local businesses, import CSVs, or add contacts by hand." },
  { icon: ShieldCheck, title: "You approve every send", text: "Each email waits for your review before it leaves your own mailbox." },
  { icon: BarChart3, title: "Analytics that matter", text: "Track generations, credits, leads and send rate on one dashboard." },
  { icon: Bot, title: "Corner AI assistant", text: "Ask it to draft an email, rework a reply or plan outreach — anytime." },
  { icon: Mail, title: "Your Gmail or Outlook", text: "Connect your own mailbox so replies come from your real address." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <a href="#pricing" className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground sm:block">Pricing</a>
          <Button asChild variant="ghost" className="rounded-full"><Link to="/auth">Sign in</Link></Button>
          <Button asChild className="rounded-full"><Link to="/auth">Get started</Link></Button>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary-deep shadow-soft">
              <Zap className="h-3.5 w-3.5" /> 1,000 free credits on sign-up
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Draft professional client emails in <span className="text-primary">3 seconds</span> with AI.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Paste an incoming email, choose a tone, and get three polished replies. Then find new leads and send reviewed outreach from your own inbox.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-gradient-primary px-6 text-base shadow-lift">
                <Link to="/auth">Try free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full bg-card px-6 text-base">
                <Link to="/auth"><Mail className="h-4 w-4" /> Connect Gmail account</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border bg-card p-5 shadow-lift">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incoming</p>
              <p className="mt-2 rounded-2xl bg-muted p-4 text-sm">"Hi — could you send over pricing for a 5-page site and your earliest start date? Thanks, Sarah"</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Polite / Formal", "Send Quote / Pricing"].map((t) => (
                  <span key={t} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">{t}</span>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {["Direct & Concise", "Warm & Relationship-focused", "Strategic / Detailed"].map((t, i) => (
                  <div key={t} className={`rounded-2xl border p-4 ${i === 0 ? "border-primary bg-primary-soft/40" : ""}`}>
                    <p className="text-xs font-semibold text-primary-deep">Option {i + 1} · {t}</p>
                    <div className="mt-2 h-2 w-4/5 rounded-full bg-muted" />
                    <div className="mt-1.5 h-2 w-3/5 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 -left-4 hidden rounded-3xl bg-gradient-assistant px-5 py-4 text-assistant-foreground shadow-lift sm:block">
              <p className="text-xs opacity-90">AI Assistant</p>
              <p className="font-display font-semibold">"Draft a follow-up email"</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Everything your inbox needs</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[1.75rem] border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary-deep"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Simple credit pricing</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Start free, upgrade when you need more, top up anytime.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {(["free", "pro", "business"] as const).map((id) => {
              const p = PLANS[id];
              return (
                <div key={id} className={`rounded-[1.75rem] border-2 bg-background p-6 ${id === "pro" ? "border-primary shadow-lift" : "border-border"}`}>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{p.name}</p>
                  <p className="mt-3 font-display text-4xl font-bold">€{p.priceEur}<span className="text-base font-medium text-muted-foreground">{id === "free" ? "" : "/mo"}</span></p>
                  <p className="mt-2 font-semibold text-primary-deep">{formatCredits(id === "free" ? 1000 : p.monthlyCredits)} credits {id === "free" ? "one-time" : "/ month"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                  <Button asChild className="mt-6 w-full rounded-full" variant={id === "pro" ? "default" : "outline"}>
                    <Link to="/auth">{id === "free" ? "Start free" : `Choose ${p.name}`}</Link>
                  </Button>
                </div>
              );
            })}
            <div className="rounded-[1.75rem] border-2 border-dashed bg-background p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top-up pack</p>
              <p className="mt-3 font-display text-4xl font-bold">€{TOPUP_PACK.priceEur}</p>
              <p className="mt-2 font-semibold text-primary-deep">{formatCredits(TOPUP_PACK.credits)} credits</p>
              <p className="mt-2 flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Carries over — never expires</p>
              <Button asChild variant="outline" className="mt-6 w-full rounded-full"><Link to="/auth">Get started</Link></Button>
            </div>
          </div>
          <div className="mt-10"><CreditPoints columns={3} /></div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <Logo />
        <p>© {new Date().getFullYear()} InboxHero. Every email is reviewed by you before it sends.</p>
      </footer>
    </div>
  );
}
