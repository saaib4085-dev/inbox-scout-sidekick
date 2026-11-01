import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const TREND_DAYS = 14;
const STATUSES = ['new', 'contacted', 'qualified', 'archived'];
const MAX_LEADS = 500;

function emptyTrend() {
  const out = [];
  const now = Date.now();
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(now - i * 86400000).toISOString().slice(0, 10);
    out.push({ day, leads: 0 });
  }
  return out;
}

function trendFromLeads(leads) {
  const trend = emptyTrend();
  const counts = new Map(trend.map((point) => [point.day, 0]));
  for (const lead of leads) {
    const key = String(lead.created_date ?? '').slice(0, 10);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }
  return trend.map((point) => ({ day: point.day, leads: counts.get(point.day) ?? 0 }));
}

function trendKey(row) {
  for (const value of Object.values(row ?? {})) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }
  return null;
}

function trendFromRows(rows) {
  const counts = new Map();
  for (const row of rows ?? []) {
    const key = trendKey(row);
    if (key) counts.set(key, (counts.get(key) ?? 0) + Number(row.count ?? 0));
  }
  return emptyTrend().map((point) => ({ day: point.day, leads: counts.get(point.day) ?? 0 }));
}

function buildStatuses(leads) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const lead of leads) {
    if (counts[lead.status] !== undefined) counts[lead.status] += 1;
  }
  return STATUSES.map((status) => ({ status, count: counts[status] }));
}

function statusesFromRows(rows) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const row of rows ?? []) {
    if (row?.status && counts[row.status] !== undefined) counts[row.status] += Number(row.count ?? 0);
  }
  return STATUSES.map((status) => ({ status, count: counts[status] }));
}

function topFromLeads(leads, limit = 5) {
  const counts = new Map();
  for (const lead of leads) {
    if (lead.company) counts.set(lead.company, (counts.get(lead.company) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function topFromRows(rows, field, limit = 5) {
  return (rows ?? [])
    .filter((row) => row?.[field])
    .map((row) => ({ label: String(row[field]), count: Number(row.count ?? 0) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function avgFromLeads(leads) {
  const scored = leads.filter((lead) => typeof lead.intent_score === 'number');
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((total, lead) => total + lead.intent_score, 0) / scored.length);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole.entities;
    const { scope } = await req.json().catch(() => ({}));

    if (scope === 'company') {
      if (user.role !== 'admin') return Response.json({ company: null, role: user.role ?? 'user' });

      const since = new Date(new Date().setUTCHours(0, 0, 0, 0) - (TREND_DAYS - 1) * 86400000).toISOString();
      const [status, avg, companies, accounts, purchases, topAccounts, trend] = await Promise.all([
        svc.Lead.aggregate({ groupBy: 'status' }),
        svc.Lead.aggregate({ avg: ['intent_score'] }),
        svc.Lead.aggregate({ groupBy: 'company' }),
        svc.CreditAccount.aggregate({ sum: ['balance', 'lifetime_purchased', 'runs_completed'] }),
        svc.Purchase.aggregate({ query: { status: 'paid' }, sum: ['amount_cents', 'credits'] }),
        svc.Lead.aggregate({ groupBy: 'user_email' }),
        svc.Lead.aggregate({
          query: { created_date: { $gte: since } },
          dateBucket: { field: 'created_date', unit: 'day' },
        }),
      ]);

      const accountRow = accounts?.rows?.[0] ?? {};
      const purchaseRow = purchases?.rows?.[0] ?? {};
      const avgRow = avg?.rows?.[0] ?? {};
      const statusRows = statusesFromRows(status?.rows);

      const company = {
        accounts: Number(accountRow.count ?? 0),
        leads: statusRows.reduce((total, row) => total + row.count, 0),
        runs: Number(accountRow.sum_runs_completed ?? 0),
        creditsSold: Number(purchaseRow.sum_credits ?? 0),
        revenueCents: Number(purchaseRow.sum_amount_cents ?? 0),
        outstandingCredits: Number(accountRow.sum_balance ?? 0),
        avgIntent:
          avgRow.avg_intent_score === null || avgRow.avg_intent_score === undefined
            ? null
            : Math.round(Number(avgRow.avg_intent_score)),
        statuses: statusRows,
        topCompanies: topFromRows(companies?.rows, 'company'),
        topAccounts: topFromRows(topAccounts?.rows, 'user_email'),
        trend: trendFromRows(trend?.rows),
      };

      return Response.json({ company, role: user.role });
    }

    const [accountRows, leadPage, purchaseTotals] = await Promise.all([
      svc.CreditAccount.filter({ user_email: user.email }),
      svc.Lead.filter({ user_email: user.email }, { sort: '-created_date', limit: MAX_LEADS }),
      svc.Purchase.aggregate({
        query: { user_email: user.email, status: 'paid' },
        sum: ['amount_cents', 'credits'],
      }),
    ]);

    const account = accountRows[0] ?? null;
    const leads = (leadPage.items ?? []).slice(0, MAX_LEADS);
    const purchaseRow = purchaseTotals?.rows?.[0] ?? {};

    return Response.json({
      personal: {
        balance: account?.balance ?? 0,
        plan: account?.plan ?? 'free',
        runs: account?.runs_completed ?? 0,
        creditsPurchased: account?.lifetime_purchased ?? 0,
        leads: leads.length,
        avgIntent: avgFromLeads(leads),
        statuses: buildStatuses(leads),
        topCompanies: topFromLeads(leads),
        trend: trendFromLeads(leads),
        orders: Number(purchaseRow.count ?? 0),
        spentCents: Number(purchaseRow.sum_amount_cents ?? 0),
      },
      role: user.role ?? 'user',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}