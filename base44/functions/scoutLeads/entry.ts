import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  ensureCreditAccount,
  LEADS_PER_RUN,
  MAX_BRIEFS,
  SCRAPE_COST_PER_LEAD,
} from '../../shared/credits.ts';

// We research more companies than we keep, because some sites block bots or publish no address.
const CANDIDATES = LEADS_PER_RUN + 6;

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    companies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          website: { type: 'string' },
          contact_page: { type: 'string' },
          published_email: { type: 'string' },
          contact_name: { type: 'string' },
          role: { type: 'string' },
          what_they_do: { type: 'string' },
          signal: { type: 'string' },
          intent_score: { type: 'number' },
        },
        required: ['company', 'website', 'what_they_do', 'signal', 'intent_score'],
      },
    },
  },
  required: ['companies'],
};

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    drafts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          draft_subject: { type: 'string' },
          draft_body: { type: 'string' },
        },
        required: ['company', 'draft_subject', 'draft_body'],
      },
    },
  },
  required: ['drafts'],
};

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const EMAIL_VALID = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const JUNK_EMAIL =
  /(sentry|wixpress|example\.|domain\.com|w3\.org|schema\.org|cloudflare|gstatic|google-analytics|doubleclick|@2x|\.(png|jpe?g|gif|webp|svg|css|js)$)/i;
const JUNK_LOCAL = /^(noreply|no-reply|donotreply|postmaster|abuse|webmaster)$/i;
const PREFERRED_LOCAL = ['info', 'hello', 'hi', 'contact', 'sales', 'office', 'enquiries', 'enquiry', 'team', 'studio', 'mail', 'admin'];

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function cleanBrief(value) {
  const brief = typeof value === 'string' ? value.trim() : '';
  if (brief.length < 12) return null;
  if (brief.length > 1200) return null;
  return brief;
}

function clamp(value, min, max) {
  const number = Math.round(Number(value) || 0);
  return Math.max(min, Math.min(max, number));
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function hostOf(value) {
  const url = normalizeUrl(value);
  if (!url) return '';
  return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return '';
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type && !type.includes('html') && !type.includes('text')) return '';
    const text = await response.text();
    return text.slice(0, 400000);
  } catch {
    return '';
  }
}

function extractEmails(html) {
  if (!html) return [];
  const decoded = html
    .replace(/&#0?64;/gi, '@')
    .replace(/%40/g, '@')
    .replace(/&#0?46;/g, '.');
  const found = decoded.match(EMAIL_RE) || [];
  return found
    .map((email) => email.toLowerCase().replace(/^[.,;:]+|[.,;:]+$/g, ''))
    .filter((email) => EMAIL_VALID.test(email) && !JUNK_EMAIL.test(email));
}

function pickEmail(emails, host) {
  const bare = String(host || '').replace(/^www\./, '');
  const unique = [...new Set(emails)].filter((email) => !JUNK_LOCAL.test(email.split('@')[0] || ''));
  if (unique.length === 0) return '';

  const onSite = unique.filter((email) => {
    const domain = email.split('@')[1] || '';
    return bare && (domain === bare || domain.endsWith(`.${bare}`));
  });
  const pool = onSite.length > 0 ? onSite : unique;
  const rank = (email) => {
    const local = email.split('@')[0] || '';
    const index = PREFERRED_LOCAL.findIndex((prefix) => local === prefix || local.startsWith(prefix));
    return index === -1 ? PREFERRED_LOCAL.length : index;
  };
  return pool.slice().sort((a, b) => rank(a) - rank(b))[0];
}

function buildDiscoveryPrompt(brief) {
  return `You are InboxHero's lead researcher. Use web search to find REAL, currently operating companies that match the seller's brief.

Seller's brief:
"""
${brief}
"""

Find up to ${CANDIDATES} distinct real companies that fit. Hard rules:
- Only companies you actually saw in search results. Never invent a company, a person, a domain or an email address.
- "website" is the company's real homepage URL starting with https://.
- "contact_page" is a real page on that website where contact details are published (for example /contact, /about, /imprint, /kontakt). Use "" if you did not see one.
- "published_email" must be an address you actually saw published for that company. If you did not see one, use "".
- "contact_name" and "role": only when the company publicly names that person; otherwise "".
- "what_they_do": one factual sentence about their business.
- "signal": one factual sentence from the search results showing why they fit now (recent launch, hiring, expansion, funding, new service line). No speculation, no invented events.
- "intent_score": integer 45-99, higher when the evidence is stronger.
Return only JSON matching the schema.`;
}

function buildDraftPrompt(brief, companies) {
  const list = companies
    .map(
      (company, index) =>
        `${index + 1}. ${company.company} — ${company.what_they_do || 'company from the search results'}${
          company.role ? ` — contact role: ${company.role}` : ''
        }${company.signal ? ` — signal: ${company.signal}` : ''}`,
    )
    .join('\n');

  return `You write first-touch outreach for the seller below. Every company has already been researched — do not invent additional facts about them.

Seller's brief:
"""
${brief}
"""

Companies:
${list}

For each company write one email:
- "company" repeats the company name exactly as given above.
- "draft_subject": under 8 words, sounds like a peer, specific to that company, no placeholders.
- "draft_body": under 70 words, first person, refers to their signal naturally, asks one short question, no bullet points, no exclamation marks, no "I hope this finds you well", no invented claims.
Return only JSON matching the schema.`;
}

async function discoverCompanies(base44, brief) {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: buildDiscoveryPrompt(brief),
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: DISCOVERY_SCHEMA,
  });
  const companies = Array.isArray(result?.companies) ? result.companies : [];
  return companies.filter((item) => item && String(item.company || '').trim() && normalizeUrl(item.website));
}

async function scrapeCandidate(candidate) {
  const website = normalizeUrl(candidate.website);
  const contactPage = normalizeUrl(candidate.contact_page);
  const urls = [...new Set([contactPage, website].filter(Boolean))];

  const pages = await Promise.all(
    urls.map(async (url) => ({ url, emails: extractEmails(await fetchPage(url)) })),
  );

  const withEmails = pages.filter((page) => page.emails.length > 0);
  const primary = withEmails.find((page) => page.url === contactPage) || withEmails[0] || null;

  let email = '';
  let sourceUrl = primary?.url || contactPage || website || '';

  if (primary) {
    email = pickEmail(primary.emails, hostOf(primary.url));
  }

  // The model's hint is only trusted when the address lives on the company's own domain.
  if (!email) {
    const hinted = String(candidate.published_email || '').trim().toLowerCase();
    const hintedDomain = hinted.split('@')[1] || '';
    const siteDomain = hostOf(website);
    if (
      EMAIL_VALID.test(hinted) &&
      !JUNK_EMAIL.test(hinted) &&
      siteDomain &&
      (hintedDomain === siteDomain || hintedDomain.endsWith(`.${siteDomain}`))
    ) {
      email = hinted;
      sourceUrl = contactPage || website || '';
    }
  }

  return {
    company: String(candidate.company || '').trim().slice(0, 120),
    website,
    email,
    source_url: sourceUrl,
    contact_name: String(candidate.contact_name || '').trim().slice(0, 120),
    role: String(candidate.role || '').trim().slice(0, 120),
    what_they_do: String(candidate.what_they_do || '').trim().slice(0, 300),
    signal: String(candidate.signal || '').trim().slice(0, 400),
    intent_score: clamp(candidate.intent_score, 45, 99),
  };
}

async function writeDrafts(base44, brief, companies) {
  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildDraftPrompt(brief, companies),
      response_json_schema: DRAFT_SCHEMA,
    });
    return Array.isArray(result?.drafts) ? result.drafts : [];
  } catch (error) {
    console.error('drafting failed', error.message);
    return [];
  }
}

async function runBrief(base44, brief) {
  const candidates = await discoverCompanies(base44, brief);
  if (candidates.length === 0) return [];

  const scraped = (await Promise.all(candidates.map((candidate) => scrapeCandidate(candidate)))).filter(
    (item) => item.company,
  );
  if (scraped.length === 0) return [];

  // An address is the deliverable now, so only leads with a published email are kept.
  const chosen = scraped.filter((item) => item.email).slice(0, LEADS_PER_RUN);

  const drafts = await writeDrafts(base44, brief, chosen);
  const key = (value) => String(value || '').trim().toLowerCase();
  const byCompany = new Map(drafts.map((draft) => [key(draft.company), draft]));

  return chosen.map((item) => {
    const draft = byCompany.get(key(item.company)) || {};
    return {
      name: item.contact_name || item.company,
      company: item.company,
      email: item.email,
      role: item.role,
      intent_score: item.intent_score,
      signal: item.signal || item.what_they_do,
      source_url: item.source_url,
      draft_subject: String(draft.draft_subject || '').slice(0, 160),
      draft_body: String(draft.draft_body || '').slice(0, 1200),
      status: 'new',
      run_brief: brief.slice(0, 400),
    };
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body.briefs) ? body.briefs : [body.brief];
    const briefs = incoming.map(cleanBrief).filter(Boolean).slice(0, MAX_BRIEFS);

    if (briefs.length === 0) {
      return Response.json(
        { error: 'Describe who you are looking for — each brief needs at least 12 characters.' },
        { status: 400 },
      );
    }
    if (incoming.filter((value) => typeof value === 'string' && value.trim()).length > MAX_BRIEFS) {
      return Response.json({ error: `Up to ${MAX_BRIEFS} briefs per bulk run.` }, { status: 400 });
    }

    const account = await ensureCreditAccount(base44, user);
    const neededScrapes = briefs.length * LEADS_PER_RUN * SCRAPE_COST_PER_LEAD;
    if ((account.scrape_balance ?? 0) < neededScrapes) {
      return Response.json(
        {
          error: `This run needs ${neededScrapes} customer scrapes and you have ${account.scrape_balance ?? 0}. Each customer costs ${SCRAPE_COST_PER_LEAD} scrape.`,
          scrape_balance: account.scrape_balance ?? 0,
        },
        { status: 402 },
      );
    }

    const results = await Promise.allSettled(briefs.map((brief) => runBrief(base44, brief)));

    const rows = [];
    let completedRuns = 0;
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') {
        console.error('brief failed', index, result.reason?.message);
        return;
      }
      if (result.value.length === 0) return;
      completedRuns += 1;
      for (const lead of result.value) {
        rows.push({ user_email: user.email, ...lead });
      }
    });

    if (rows.length === 0) {
      return Response.json(
        {
          error:
            'The scouting run found no companies with a published email address. No scrapes were used.',
        },
        { status: 502 },
      );
    }

    const created = await base44.asServiceRole.entities.Lead.bulkCreate(rows);
    const scrapesUsed = rows.length * SCRAPE_COST_PER_LEAD;

    const updatedAccount = await base44.asServiceRole.entities.CreditAccount.update(account.id, {
      scrape_balance: Math.max(0, (account.scrape_balance ?? 0) - scrapesUsed),
      lifetime_scraped: (account.lifetime_scraped ?? 0) + scrapesUsed,
      runs_completed: (account.runs_completed ?? 0) + completedRuns,
    });

    return Response.json({
      leads: created,
      account: updatedAccount,
      runs: completedRuns,
      scrapes_charged: scrapesUsed,
    });
  } catch (error) {
    console.error('scoutLeads failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}