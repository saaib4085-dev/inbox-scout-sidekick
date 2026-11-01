import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureCreditAccount, COST_AI_MESSAGE } from '../../shared/credits.ts';

const MAX_MESSAGES = 10;
const MAX_CHARS = 1500;
const MAX_LEADS = 12;

const SYSTEM = `You are the InboxHero AI assistant, a sidekick docked in the InboxHero app. InboxHero turns a person's inbox into high-intent leads: it scores prospects, shows the buying signal behind the score and drafts the reply.

How to answer:
- Be brief and useful: 1-4 short sentences, or a tight list when steps help.
- You can see the page they are on plus their credit balance, scrapes, plan and most recent leads (context below). You cannot read their actual mailbox, send email or change their account: say so plainly, then offer the draft or the next step they can take in the app.
- Never invent leads, scores, prices or orders. If the context does not cover it, say what you do know.
- For an email request, answer with a subject line and a body that is ready to send.
- Prices are in euro. Match the language the person writes in.

Pricing and costs, so your answers are accurate: Free includes 500 credits and 20 customer scrapes. Pro is €19 with 1,000 credits and 300 scrapes. Scale is €49 with 5,000 credits and 500 scrapes. Enterprise is 10,000 credits and 1,000 scrapes and is arranged with the team. One AI assistant message costs 15 credits, a new sample draft costs 25 credits, and each customer scraped costs 1 scrape. A scouting run returns 5 customers per brief.

App map: / is the landing page, /pricing shows the plans and checkout, /app is the dashboard with the scouting brief form (bulk runs allowed) and lead queue, /app/analytics has the Insights tabs, /app/account covers profile, data export and deletion, /terms, /privacy and /refunds hold the policies.`;

function truncate(value, max) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildContext(user, page, account, leads) {
  if (!user) {
    return 'WORKSPACE CONTEXT\nSigned out visitor browsing the public site. You have no workspace data for them; explain that signing in unlocks their leads, credits and scrapes.';
  }

  const lines = [
    'WORKSPACE CONTEXT (live from the app, treat as ground truth)',
    `Signed in as: ${user.full_name || 'unnamed'} <${user.email}> (${user.role || 'user'})`,
    `Current page: ${page}`,
    account
      ? `Credits available: ${account.balance ?? 0} · customer scrapes available: ${account.scrape_balance ?? 0} · plan ${account.plan || 'free'} · ${account.runs_completed ?? 0} runs completed`
      : 'Credits: no credit account yet (a free balance is created on first use)',
  ];

  if (leads.length === 0) {
    lines.push('Leads: none saved yet.');
  } else {
    lines.push(`Recent leads (${leads.length} shown, newest first):`);
    for (const lead of leads) {
      lines.push(
        `- ${truncate(lead.name, 60)} · ${truncate(lead.company, 40) || 'no company'} · intent ${lead.intent_score ?? '—'} · ${lead.status || 'new'} · signal: ${truncate(lead.signal, 110) || 'none recorded'}`,
      );
    }
  }

  return lines.join('\n');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const messages = incoming
      .filter(
        (message) =>
          message && typeof message.content === 'string' && ['user', 'assistant'].includes(message.role),
      )
      .slice(-MAX_MESSAGES)
      .map((message) => ({ role: message.role, content: message.content.slice(0, MAX_CHARS) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return Response.json({ error: 'A question is required' }, { status: 400 });
    }

    const page = typeof body.page === 'string' ? body.page.slice(0, 80) : '/';

    let account = null;
    if (user) {
      account = await ensureCreditAccount(base44, user);
      if ((account.balance ?? 0) < COST_AI_MESSAGE) {
        return Response.json(
          {
            error: `AI messages cost ${COST_AI_MESSAGE} credits and your balance is ${account.balance ?? 0}. Top up on the pricing page to keep chatting.`,
            balance: account.balance ?? 0,
          },
          { status: 402 },
        );
      }
    }

    let leads = [];
    if (user) {
      const leadPage = await base44.entities.Lead.filter(
        { user_email: user.email },
        { sort: '-created_date', limit: MAX_LEADS },
      );
      leads = leadPage.items ?? [];
    }

    const transcript = messages
      .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
      .join('\n');

    const prompt = [
      SYSTEM,
      '',
      buildContext(user, page, account, leads),
      '',
      'CONVERSATION',
      transcript,
      'Assistant:',
    ].join('\n');

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude-sonnet-5',
    });

    const text = String(reply ?? '').trim();
    if (!text) return Response.json({ error: 'The assistant returned nothing' }, { status: 502 });

    let balance = account?.balance ?? 0;
    if (account) {
      const nextBalance = Math.max(0, (account.balance ?? 0) - COST_AI_MESSAGE);
      const updated = await base44.asServiceRole.entities.CreditAccount.update(account.id, {
        balance: nextBalance,
      });
      balance = updated.balance ?? nextBalance;
    }

    return Response.json({ reply: text, balance, cost: account ? COST_AI_MESSAGE : 0 });
  } catch (error) {
    console.error('assistant function failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}