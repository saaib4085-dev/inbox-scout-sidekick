import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { confirmCheckout, createBillingPortal, createCheckout } from "@/lib/stripe.functions";
import { format } from "date-fns";
import { Check, Clock, CreditCard, LayoutGrid, Package, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { CreditPoints } from "@/components/app/PricingInfo";
import { useLedger, useWallet } from "@/hooks/use-app-data";
import { CREDIT_COSTS, PLANS, TOPUP_PACK, creditsCover, formatCredits } from "@/lib/credits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/credits")({
  validateSearch: z.object({ tab: z.enum(["overview", "packages"]).optional(), checkout: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Credits — InboxHero" },
      { name: "description", content: "Your credit balance, usage history, plans and top-up packs." },
      { property: "og:title", content: "Credits — InboxHero" },
      { property: "og:description", content: "Credit balance, plans and top-ups." },
    ],
  }),
  component: CreditsPage,
});

type Product = "pro" | "business" | "topup";

/** Opens Stripe Checkout in a new tab (it can't load inside the editor preview frame). */
async function openStripe(getUrl: () => Promise<{ url: string } | undefined>) {
  const tab = window.open("", "_blank");
  try {
    const res = await getUrl();
    if (!res?.url) throw new Error("Couldn't start checkout.");
    if (tab) tab.location.href = res.url;
    else window.location.href = res.url;
  } catch (e) {
    tab?.close();
    toast.error((e as Error).message);
  }
}

function useCheckout() {
  const checkout = useServerFn(createCheckout);
  return (product: Product) => openStripe(() => checkout({ data: { product } }));
}

function CreditsPage() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const confirm = useServerFn(confirmCheckout);
  const [tab, setTab] = useState<"overview" | "packages">(search.tab ?? "overview");
  useEffect(() => {
    const sessionId = search.checkout;
    if (!sessionId?.startsWith("cs_")) return;
    navigate({ to: "/credits", search: {}, replace: true });
    confirm({ data: { sessionId } })
      .then((r) => {
        if (r?.ok) toast.success("Payment received — your credits have been added.");
        else toast.info("Payment is still processing — credits will appear shortly.");
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => {
        qc.invalidateQueries({ queryKey: ["wallet"] });
        qc.invalidateQueries({ queryKey: ["ledger"] });
      });
  }, [search.checkout]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[1.75rem] border bg-card p-3 shadow-soft">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI credits</p>
        <div className="flex gap-1 lg:flex-col">
          {[
            { id: "overview" as const, label: "Overview", icon: LayoutGrid },
            { id: "packages" as const, label: "Packages", icon: Package },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition",
                tab === t.id ? "bg-primary-soft font-semibold text-primary-deep" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </aside>
      <div className="min-w-0">{tab === "overview" ? <Overview onPackages={() => setTab("packages")} /> : <Packages />}</div>
    </div>
  );
}

function Overview({ onPackages }: { onPackages: () => void }) {
  const wallet = useWallet();
  const portal = useServerFn(createBillingPortal);
  const ledger = useLedger(50);
  const w = wallet.data;
  const cover = creditsCover(w?.total ?? 0);
  const plan = PLANS[w?.plan ?? "free"];
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border bg-card shadow-soft">
        <div className="bg-gradient-primary p-6 text-primary-foreground sm:p-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="text-sm opacity-90">Available balance</p>
              <p className="font-display text-5xl font-bold">{formatCredits(w?.total ?? 0)}</p>
              <p className="mt-1 text-sm opacity-90">
                {plan.name} plan{w?.periodEnd ? ` · renews ${format(new Date(w.periodEnd), "d MMM yyyy")}` : ""}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={onPackages} variant="secondary" className="rounded-full">
                <Plus className="h-4 w-4" /> Get credits
              </Button>
              {w?.plan && w.plan !== "free" && (
                <Button onClick={() => openStripe(() => portal())} variant="secondary" className="rounded-full">
                  <CreditCard className="h-4 w-4" /> Manage billing
                </Button>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Monthly plan", value: w?.subscription ?? 0, note: "resets monthly" },
              { label: "Sign-up bonus", value: w?.bonus ?? 0, note: "never expires" },
              { label: "Top-ups", value: w?.topup ?? 0, note: "carries over" },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl bg-card/15 p-3 backdrop-blur">
                <p className="text-xs opacity-90">{b.label}</p>
                <p className="font-display text-xl font-bold">{formatCredits(b.value)}</p>
                <p className="text-[11px] opacity-80">{b.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 p-6 sm:p-8">
          <div>
            <h2 className="font-semibold">What your balance covers</h2>
            <p className="text-sm text-muted-foreground">
              About {formatCredits(cover.generations)} email generations ({formatCredits(cover.generations * 3)} reply options), or{" "}
              {formatCredits(cover.questions)} AI questions, or {formatCredits(cover.scrapes)} lead searches.
            </p>
          </div>
          <CreditPoints />
        </div>
      </section>

      <section className="rounded-[1.75rem] border bg-card p-6 shadow-soft">
        <h2 className="mb-4 font-semibold">Recent activity</h2>
        {ledger.data?.length ? (
          <ul className="divide-y">
            {ledger.data.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    l.amount > 0 ? "bg-success-soft text-success" : l.status === "refunded" ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary-deep",
                  )}
                >
                  {l.status === "refunded" ? <RefreshCw className="h-4 w-4" /> : l.amount > 0 ? <Plus className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(l.created_at), "d MMM, HH:mm")}
                    {l.status === "refunded" ? " · refunded" : ""}
                  </p>
                </div>
                <span className={cn("shrink-0 font-semibold tabular-nums", l.amount > 0 ? "text-success" : l.status === "refunded" ? "text-muted-foreground line-through" : "")}>
                  {l.amount > 0 ? "+" : ""}
                  {formatCredits(l.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
        )}
      </section>
    </div>
  );
}

function Packages() {
  const [billing, setBilling] = useState<"monthly" | "onetime">("monthly");
  const wallet = useWallet();
  const checkout = useCheckout();
  const strip =
    billing === "monthly"
      ? [
          { icon: RefreshCw, title: "Fresh credits monthly", text: "Your plan balance resets every billing month." },
          { icon: Clock, title: "No rollover", text: "Unused monthly plan credits don't carry over." },
          { icon: Plus, title: "Top up anytime", text: "Add a pack when you run low — it carries over." },
        ]
      : [
          { icon: CreditCard, title: "Pay once", text: "No subscription, no auto-renewal." },
          { icon: Clock, title: "Credits never expire", text: "Top-ups stay in your account until you use them." },
          { icon: Plus, title: "Stack anytime", text: "Buy another pack whenever you run low." },
        ];
  return (
    <section className="rounded-[2rem] border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">Choose a plan</h2>
          <p className="text-sm text-muted-foreground">
            {billing === "monthly" ? "Monthly credits that reset each billing period." : "Pay once. Top-up credits never expire — use them at your pace."}
          </p>
        </div>
        <div className="inline-flex rounded-full border bg-background p-1">
          {(["monthly", "onetime"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
                billing === b ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground",
              )}
            >
              {b === "monthly" ? "Monthly" : "One-time"}
              {b === "monthly" && <span className="rounded-full bg-card/25 px-1.5 text-[10px] font-bold uppercase">Best</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-3xl bg-primary-soft p-4 sm:grid-cols-3">
        {strip.map((s) => (
          <div key={s.title} className="flex gap-3">
            <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep" />
            <div>
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      {billing === "monthly" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(["free", "pro", "business"] as const).map((id) => {
            const p = PLANS[id];
            const current = wallet.data?.plan === id;
            return (
              <PlanCard
                key={id}
                badge={id === "free" ? "Starter" : "Monthly"}
                name={p.name}
                credits={id === "free" ? 1000 : p.monthlyCredits}
                creditsLabel={id === "free" ? "one-time credits" : "credits / month"}
                pill={id === "free" ? "Never expires" : "Resets monthly"}
                price={`€${p.priceEur}`}
                per={id === "free" ? "" : "/mo"}
                highlight={id === "pro"}
                points={[
                  p.blurb,
                  `≈ ${formatCredits(Math.floor((id === "free" ? 1000 : p.monthlyCredits) / CREDIT_COSTS.emailGeneration))} email generations`,
                  `≈ ${formatCredits(Math.floor((id === "free" ? 1000 : p.monthlyCredits) / CREDIT_COSTS.leadScrape))} lead searches`,
                ]}
                cta={current ? "Current plan" : id === "free" ? "Included" : `Subscribe to ${p.name}`}
                disabled={current || id === "free"}
                onClick={() => checkout(id as Product)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <PlanCard
            badge="One-time"
            name="Top-up"
            credits={TOPUP_PACK.credits}
            creditsLabel="credits"
            pill="Never expires"
            price={`€${TOPUP_PACK.priceEur}`}
            per=""
            highlight
            points={[
              "Carries over month to month",
              `≈ ${formatCredits(TOPUP_PACK.credits / CREDIT_COSTS.emailGeneration)} email generations`,
              "Works on any plan, including Free",
            ]}
            cta="Buy"
            onClick={() => checkout("topup")}
          />
        </div>
      )}

      <div className="mt-8">
        <h3 className="mb-3 font-semibold">How credits work</h3>
        <CreditPoints columns={3} />
      </div>
    </section>
  );
}

function PlanCard(p: {
  badge: string;
  name: string;
  credits: number;
  creditsLabel: string;
  pill: string;
  price: string;
  per: string;
  points: string[];
  cta: string;
  highlight?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className={cn("relative rounded-[1.75rem] border-2 bg-card p-5 pt-7 transition hover:-translate-y-0.5 hover:shadow-lift", p.highlight ? "border-primary" : "border-border")}>
      <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">{p.badge}</span>
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{p.name}</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold text-primary-deep">{formatCredits(p.credits)}</span>
        <span className="text-sm text-muted-foreground">{p.creditsLabel}</span>
      </p>
      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
        <Check className="h-3 w-3" /> {p.pill}
      </span>
      <p className="mt-4 font-display text-3xl font-bold">
        {p.price}
        <span className="text-base font-medium text-muted-foreground">{p.per}</span>
      </p>
      <ul className="mt-3 space-y-1.5">
        {p.points.map((x) => (
          <li key={x} className="flex gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {x}
          </li>
        ))}
      </ul>
      <Button className="mt-5 h-11 w-full rounded-full" disabled={p.disabled} onClick={p.onClick}>
        {p.cta}
      </Button>
    </div>
  );
}
