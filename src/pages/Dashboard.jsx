import { useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ScoutForm from '@/components/dashboard/ScoutForm';
import LeadCard from '@/components/dashboard/LeadCard';
import { formatCredits } from '@/lib/packs';

export default function Dashboard() {
  const { account, refreshAccount, user } = useOutletContext();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const checkoutState = params.get('checkout');

  useEffect(() => {
    const loadLeads = async () => {
      const page = await base44.entities.Lead.filter({}, { sort: '-created_date', limit: 30 });
      setLeads(page.items ?? page ?? []);
      setLoading(false);
    };
    loadLeads();
  }, []);

  const runScout = async (briefs) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('scoutLeads', { briefs });
      if (response.data?.error) return response.data.error;
      setLeads((previous) => [...(response.data.leads ?? []), ...previous]);
      await refreshAccount();
      return '';
    } catch (err) {
      return (
        err?.response?.data?.error ||
        'The scouting run failed. No scrapes were used — please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const regenerateDraft = async (leadId) => {
    try {
      const response = await base44.functions.invoke('draftEmail', { leadId });
      if (response.data?.error) return response.data.error;
      setLeads((previous) =>
        previous.map((lead) => (lead.id === leadId ? response.data.lead : lead)),
      );
      await refreshAccount();
      return '';
    } catch (err) {
      return (
        err?.response?.data?.error || 'The new draft could not be written. No credits were used.'
      );
    }
  };

  const changeStatus = async (id, status) => {
    await base44.entities.Lead.update(id, { status });
    setLeads((previous) => previous.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
  };

  const balance = account?.balance ?? 0;
  const scrapes = account?.scrape_balance ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      {checkoutState === 'success' && (
        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium tracking-tight">Payment received — thank you.</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Your credits and scrapes land in the balance below as soon as Stripe confirms the
              payment, usually within a few seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refreshAccount()}
            className="inline-flex h-9 shrink-0 items-center rounded-full border border-primary/40 px-4 text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Refresh balance
          </button>
        </div>
      )}
      <div className="flex flex-col justify-between gap-5 border-b hairline pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            Scout queue
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight md:text-[2.9rem]">
            Good morning{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Describe a buyer and InboxHero returns five scored customers with replies ready to send.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Credits
            </p>
            <p className="mt-1 font-display text-2xl leading-none">{formatCredits(balance)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Scrapes
            </p>
            <p className="mt-1 font-display text-2xl leading-none">{formatCredits(scrapes)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Runs
            </p>
            <p className="mt-1 font-display text-2xl leading-none">
              {formatCredits(account?.runs_completed ?? 0)}
            </p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex h-9 items-center rounded-full border hairline px-4 text-[13px] text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Top up
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ScoutForm onSubmit={runScout} busy={busy} scrapes={scrapes} />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium tracking-tight">Recent leads</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {leads.length} in queue
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading your queue…</p>
        ) : leads.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed hairline bg-card/40 px-6 py-14 text-center">
            <p className="font-display text-2xl tracking-tight">Your queue is empty.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Run your first scout above — one brief returns five scored customers for five scrapes,
              each with a draft reply.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={changeStatus}
                onRegenerate={regenerateDraft}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}