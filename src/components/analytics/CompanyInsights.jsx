import StatTile from '@/components/analytics/StatTile';
import TrendChart from '@/components/analytics/TrendChart';
import StatusBreakdown from '@/components/analytics/StatusBreakdown';
import LeaderList from '@/components/analytics/LeaderList';
import { formatCredits } from '@/lib/packs';
import { formatEuro } from '@/lib/insights';

export default function CompanyInsights({ data }) {
  if (!data) {
    return (
      <div className="rounded-lg border border-dashed hairline bg-card/40 px-6 py-12 text-center">
        <p className="font-display text-xl tracking-tight">Company insights are for admins.</p>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          Company-wide numbers cover every account using InboxHero, so they are limited to workspace
          admins. Ask an admin on your team for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Revenue" value={formatEuro(data.revenueCents)} hint="Paid credit packs" />
        <StatTile label="Credits sold" value={formatCredits(data.creditsSold)} hint="Lifetime across accounts" />
        <StatTile label="Accounts" value={formatCredits(data.accounts)} hint={`${formatCredits(data.runs)} runs completed`} />
        <StatTile
          label="Leads generated"
          value={formatCredits(data.leads)}
          hint={data.avgIntent === null ? 'No scores yet' : `Avg. intent ${data.avgIntent}`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TrendChart data={data.trend} label="Leads generated per day" />
        <StatusBreakdown data={data.statuses} total={data.leads} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <LeaderList
          title="Companies being reached"
          subtitle="Top 5"
          rows={data.topCompanies}
          emptyLabel="No leads across any account yet."
        />
        <LeaderList
          title="Busiest accounts"
          subtitle="Top 5 by leads"
          rows={data.topAccounts}
          emptyLabel="No account has generated leads yet."
        />
      </div>

      <div className="rounded-lg border hairline bg-card p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[13px] font-medium tracking-tight">Credit liability</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Live
          </p>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-mono text-[12px] text-foreground">{formatCredits(data.outstandingCredits)}</span>{' '}
          credits sit unspent across all accounts — work the platform still owes.
        </p>
      </div>
    </div>
  );
}