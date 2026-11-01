import { Link } from 'react-router-dom';
import StatTile from '@/components/analytics/StatTile';
import TrendChart from '@/components/analytics/TrendChart';
import StatusBreakdown from '@/components/analytics/StatusBreakdown';
import LeaderList from '@/components/analytics/LeaderList';
import { formatCredits } from '@/lib/packs';
import { formatEuro } from '@/lib/insights';

export default function PersonalInsights({ data, name }) {
  const firstName = name ? name.split(' ')[0] : '';
  const qualified = data.statuses.find((row) => row.status === 'qualified')?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Credit balance" value={formatCredits(data.balance)} hint={`${data.plan} plan`} />
        <StatTile label="Scouting runs" value={formatCredits(data.runs)} hint="1 scrape per customer" />
        <StatTile label="Leads found" value={formatCredits(data.leads)} hint={`${qualified} qualified`} />
        <StatTile
          label="Avg. intent score"
          value={data.avgIntent === null ? '—' : `${data.avgIntent}`}
          hint="Across every lead you have"
        />
      </div>

      {data.leads === 0 && (
        <div className="rounded-lg border border-dashed hairline bg-card/40 px-6 py-10 text-center">
          <p className="font-display text-xl tracking-tight">
            {firstName ? `${firstName}, nothing to chart yet.` : 'Nothing to chart yet.'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            Run a scout and this dashboard fills up with your lead trend, scores and queue mix.
          </p>
          <Link
            to="/app"
            className="mt-5 inline-flex h-9 items-center rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start a scouting run
          </Link>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <TrendChart data={data.trend} />
        <StatusBreakdown data={data.statuses} total={data.leads} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <LeaderList
          title="Companies you are reaching"
          subtitle="Top 5"
          rows={data.topCompanies}
          emptyLabel="No companies yet — they appear once you run a scout."
        />
        <div className="rounded-lg border hairline bg-card p-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[13px] font-medium tracking-tight">Your spending</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              All time
            </p>
          </div>
          <dl className="mt-5 space-y-3 text-[13px]">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Paid orders</dt>
              <dd className="font-mono text-[12px]">{formatCredits(data.orders)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Total spent</dt>
              <dd className="font-mono text-[12px]">{formatEuro(data.spentCents)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Credits purchased</dt>
              <dd className="font-mono text-[12px]">{formatCredits(data.creditsPurchased)}</dd>
            </div>
          </dl>
          <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
            Credits are pay-as-you-go: nothing renews, and unused credits stay on your balance.
          </p>
        </div>
      </div>
    </div>
  );
}