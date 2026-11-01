import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureCreditAccount, COST_SAMPLE_DRAFT } from '../../shared/credits.ts';

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['subject', 'body'],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId } = await req.json().catch(() => ({}));
    if (!leadId || typeof leadId !== 'string') {
      return Response.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(leadId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!lead || lead.user_email !== user.email) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const account = await ensureCreditAccount(base44, user);
    if ((account.balance ?? 0) < COST_SAMPLE_DRAFT) {
      return Response.json(
        {
          error: `A sample draft costs ${COST_SAMPLE_DRAFT} credits and your balance is ${account.balance ?? 0}.`,
          balance: account.balance ?? 0,
        },
        { status: 402 },
      );
    }

    const prompt = `You write outreach emails for InboxHero, a small software business.

Prospect: ${lead.name}${lead.role ? `, ${lead.role}` : ''}${lead.company ? ` at ${lead.company}` : ''}
Buying signal: ${lead.signal || 'not recorded'}
Buyer brief the seller was hunting with: ${lead.run_brief || 'not recorded'}

Write one fresh outreach email to this person.

Rules:
- "subject" is under 8 words and sounds like a peer, never a marketer.
- "body" is under 80 words, first person, references the signal naturally, asks one short question.
- No bullet points, no exclamation marks, no "I hope this finds you well".
- Return only JSON matching the schema.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: DRAFT_SCHEMA,
    });

    const subject = String(result?.subject ?? '').trim().slice(0, 160);
    const draftBody = String(result?.body ?? '').trim().slice(0, 1200);
    if (!subject || !draftBody) {
      return Response.json({ error: 'The draft came back empty. No credits were used.' }, { status: 502 });
    }

    const updatedLead = await base44.asServiceRole.entities.Lead.update(lead.id, {
      draft_subject: subject,
      draft_body: draftBody,
    });

    const nextBalance = Math.max(0, (account.balance ?? 0) - COST_SAMPLE_DRAFT);
    const updatedAccount = await base44.asServiceRole.entities.CreditAccount.update(account.id, {
      balance: nextBalance,
    });

    return Response.json({
      lead: updatedLead,
      account: updatedAccount,
      cost: COST_SAMPLE_DRAFT,
    });
  } catch (error) {
    console.error('draftEmail error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}