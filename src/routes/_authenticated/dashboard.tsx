import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { ArrowUpRight, Download, PenLine, Send, Users, Coins } from "lucide-react";
import { format, startOfDay, subDays } from "date-fns";
import { PageHeader } from "@/components/app/AppShell";
import { ExpandableCard } from "@/components/app/ExpandableCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDrafts, useLeads, useLedger, useOutbox, useWallet } from "@/hooks/use-app-data";
import { formatCredits } from "@/lib/credits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — InboxHero" },
      { name: "description", content: "Your email drafting, outreach and credit analytics at a glance." },
      { property: "og:title", content: "Dashboard — InboxHero" },
      { property: "og:description", content: "Email drafting and outreach analytics." },
    ],
  }),
  component: Dashboard,
});

const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function Dashboard() {
  const [range, setRange] = useState("30");
  const drafts = useDrafts();
  const ledger = useLedger();
  const leads = useLeads();
  const outbox = useOutbox();
  const wallet = useWallet();
  const days = Number(range);

  const stats = useMemo(() => {
    const since = startOfDay(subDays(new Date(), days - 1));
    const inRange = <T extends { created_at: string }>(rows?: T[]) =>
      (rows ?? []).filter((r) => new Date(r.created_at) >= since);
    const d = inRange(drafts.data);
    const l = inRange(ledger.data);
    const ld = inRange(leads.data);
    const o = inRange(outbox.data);

    const series = Array.from({ length: days }, (_, i) => {
      const day = startOfDay(subDays(new Date(), days - 1 - i));
      const key = day.toDateString();
      return {
        label: format(day, days > 31 ? "MMM d" : "d MMM"),
        drafts: d.filter((x) => new Date(x.created_at).toDateString() === key).length,
        credits: l
          .filter((x) => x.kind === "spend" && x.status === "committed" && new Date(x.created_at).toDateString() === key)
          .reduce((s, x) => s - x.amount, 0),
        leads: ld.filter((x) => new Date(x.created_at).toDateString() === key).length,
        sent: o.filter((x) => x.status === "sent" && new Date(x.created_at).toDateString() === key).length,
      };
    });

    const sources = ["search", "csv", "manual"].map((s) => ({
      name: s === "search" ? "Lead search" : s === "csv" ? "CSV import" : "Manual",
      value: ld.filter((x) => x.source === s).length,
    }));

    const spendBy = new Map<string, number>();
    l.filter((x) => x.kind === "spend" && x.status === "committed").forEach((x) => {
      const k = x.reason.startsWith("Lead search")
        ? "Lead search"
        : x.reason.startsWith("Refine")
          ? "Refine"
          : x.reason.startsWith("AI assistant")
            ? "Assistant"
            : "Email drafts";
      spendBy.set(k, (spendBy.get(k) ?? 0) - x.amount);
    });

    const tones = new Map<string, number>();
    d.forEach((x) => tones.set(x.tone || "Other", (tones.get(x.tone || "Other") ?? 0) + 1));

    const reviewed = o.length;
    const sent = o.filter((x) => x.status === "sent").length;
    return {
      series,
      sources,
      spend: [...spendBy.entries()].map(([name, value]) => ({ name, value })),
      tones: [...tones.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      totals: {
        drafts: d.length,
        options: d.length * 3,
        credits: l.filter((x) => x.kind === "spend" && x.status === "committed").reduce((s, x) => s - x.amount, 0),
        leads: ld.length,
        sent,
        pending: o.filter((x) => x.status === "pending_review").length,
      },
      sendRate: reviewed ? Math.round((sent / reviewed) * 100) : 0,
    };
  }, [drafts.data, ledger.data, leads.data, outbox.data, days]);

  function exportCsv() {
    const rows = [["date", "drafts", "credits_used", "leads", "emails_sent"], ...stats.series.map((s) => [s.label, s.drafts, s.credits, s.leads, s.sent])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inboxhero-analytics-${range}d.csv`;
    a.click();
  }

  const trend = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={stats.series} margin={{ left: -20, right: 8, top: 16 }}>
        <defs>
          <linearGradient id="fillDrafts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} minTickGap={24} stroke="var(--muted-foreground)" />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
        <Area type="monotone" dataKey="drafts" name="Generations" stroke="var(--chart-1)" strokeWidth={3} fill="url(#fillDrafts)" dot={{ r: 3, fill: "var(--chart-1)" }} />
        <Area type="monotone" dataKey="sent" name="Emails sent" stroke="var(--chart-2)" strokeWidth={2} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );

  const donut = (size: number) => {
    const total = stats.sources.reduce((s, x) => s + x.value, 0);
    return (
      <div>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie data={total ? stats.sources : [{ name: "None", value: 1 }]} dataKey="value" innerRadius="62%" outerRadius="92%" paddingAngle={total ? 3 : 0} cornerRadius={8} stroke="none">
              {(total ? stats.sources : [{ name: "None" }]).map((_, i) => (
                <Cell key={i} fill={total ? C[i] : "var(--muted)"} />
              ))}
            </Pie>
            {total > 0 && <Tooltip contentStyle={{ borderRadius: 16 }} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
          {stats.sources.map((s, i) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: C[i] }} />
              {total ? Math.round((s.value / total) * 100) : 0}% {s.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const creditsChart = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={stats.series.slice(-14)} margin={{ left: 0, right: 0, top: 8 }}>
        <defs>
          <linearGradient id="fillCredits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Tooltip contentStyle={{ borderRadius: 16 }} />
        <Area type="natural" dataKey="credits" name="Credits used" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#fillCredits)" />
      </AreaChart>
    </ResponsiveContainer>
  );

  const gauge = (size: number) => (
    <div className="relative">
      <ResponsiveContainer width="100%" height={size}>
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: stats.sendRate }]} startAngle={200} endAngle={-20}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={20} fill="var(--chart-1)" background={{ fill: "var(--muted)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-3xl font-bold">{stats.sendRate}%</p>
          <p className="text-xs text-muted-foreground">{stats.totals.pending} awaiting review</p>
        </div>
      </div>
    </div>
  );

  const pages = [
    { to: "/compose" as const, label: "Compose", value: `${stats.totals.drafts} generations`, icon: PenLine, key: "drafts" as const },
    { to: "/leads" as const, label: "Leads", value: `${stats.totals.leads} new leads`, icon: Users, key: "leads" as const },
    { to: "/outbox" as const, label: "Outbox", value: `${stats.totals.sent} sent`, icon: Send, key: "sent" as const },
    { to: "/credits" as const, label: "Credits", value: `${formatCredits(stats.totals.credits)} used`, icon: Coins, key: "credits" as const },
  ];

  const topPages = (big: boolean) => (
    <ul className={big ? "grid gap-4 md:grid-cols-2" : "divide-y"}>
      {pages.map((p) => (
        <li key={p.to} className={big ? "rounded-3xl border p-5" : "py-2"}>
          <Link to={p.to} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-deep">
              <p.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{p.value}</span>
            </span>
            <span className="w-20 shrink-0">
              <ResponsiveContainer width="100%" height={big ? 60 : 28}>
                <BarChart data={stats.series.slice(-10)}>
                  <Bar dataKey={p.key} fill="var(--chart-1)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <PageHeader
        title={`Overview — ${format(new Date(), "MMMM yyyy")}`}
        subtitle="Your drafting, outreach and credit activity."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-10 w-40 rounded-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportCsv} className="h-10 rounded-full">
              <Download className="h-4 w-4" /> Export data
            </Button>
          </>
        }
      />

      <ExpandableCard
        title="Email generation trends"
        description="Each generation returns three reply options"
        expanded={<div className="space-y-8">{trend(420)}<StatsGrid stats={stats.totals} wallet={wallet.data?.total ?? 0} /></div>}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">{trend(260)}</div>
          <StatsGrid stats={stats.totals} wallet={wallet.data?.total ?? 0} compact />
        </div>
      </ExpandableCard>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ExpandableCard title="1. Lead sources" expanded={<div className="mx-auto max-w-xl">{donut(420)}</div>}>
          {donut(170)}
        </ExpandableCard>
        <ExpandableCard
          title="2. Credit activity"
          expanded={
            <div className="space-y-6">
              {creditsChart(320)}
              <div className="grid gap-3 md:grid-cols-4">
                {stats.spend.map((s) => (
                  <div key={s.name} className="rounded-3xl border p-5">
                    <p className="text-sm text-muted-foreground">{s.name}</p>
                    <p className="font-display text-2xl font-bold">{formatCredits(s.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          {creditsChart(110)}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-display text-2xl font-bold">{formatCredits(wallet.data?.total ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Credits left</p>
            </div>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-deep">
              {formatCredits(stats.totals.credits)} used
            </span>
          </div>
        </ExpandableCard>
        <ExpandableCard title="3. Top pages" expanded={topPages(true)}>
          {topPages(false)}
        </ExpandableCard>
        <ExpandableCard
          title="4. Send rate"
          description="Reviewed emails that were sent"
          expanded={
            <div className="grid gap-8 md:grid-cols-2">
              {gauge(360)}
              <div>
                <h4 className="mb-3 font-semibold">Most-used tones</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.tones} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: 16 }} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          }
        >
          {gauge(170)}
        </ExpandableCard>
      </div>
    </div>
  );
}

function StatsGrid({
  stats,
  wallet,
  compact,
}: {
  stats: { drafts: number; options: number; credits: number; leads: number; sent: number };
  wallet: number;
  compact?: boolean;
}) {
  const items = [
    { label: "Generations", value: stats.drafts },
    { label: "Reply options", value: stats.options },
    { label: "Credits used", value: stats.credits },
    { label: "Leads added", value: stats.leads },
    { label: "Emails sent", value: stats.sent },
    { label: "Balance", value: wallet },
  ];
  return (
    <div className={compact ? "grid grid-cols-2 content-center gap-x-6 gap-y-5" : "grid grid-cols-2 gap-4 md:grid-cols-6"}>
      {items.map((i) => (
        <div key={i.label} className={compact ? "" : "rounded-3xl border p-5"}>
          <p className="text-xs text-muted-foreground">{i.label}</p>
          <p className="font-display text-2xl font-bold">{formatCredits(i.value)}</p>
        </div>
      ))}
    </div>
  );
}
