import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

async function hmacHex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export default async function (req) {
  try {
    const signingSecret = secrets.get('STRIPE_WEBHOOK_SECRET');
    const signatureHeader = req.headers.get('stripe-signature') || '';
    const payload = await req.text();

    const parsed = { timestamp: null, signatures: [] };
    for (const part of signatureHeader.split(',')) {
      const [name, value] = part.split('=');
      if (name === 't') parsed.timestamp = value;
      if (name === 'v1' && value) parsed.signatures.push(value);
    }

    if (!parsed.timestamp || parsed.signatures.length === 0) {
      return Response.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    const expected = await hmacHex(signingSecret, `${parsed.timestamp}.${payload}`);
    const valid = parsed.signatures.some((candidate) => safeEqual(candidate, expected));
    if (!valid) return Response.json({ error: 'Invalid signature' }, { status: 400 });

    if (Math.abs(Date.now() / 1000 - Number(parsed.timestamp)) > 600) {
      return Response.json({ error: 'Stale signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);

    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.async_payment_succeeded'
    ) {
      return Response.json({ received: true, ignored: event.type });
    }

    const session = event.data?.object ?? {};
    if (session.metadata?.base44_test_checkout === 'true') {
      return Response.json({ received: true, ignored: 'self_test' });
    }
    if (session.payment_status !== 'paid') {
      return Response.json({ received: true, ignored: 'unpaid' });
    }

    const purchaseId = session.metadata?.purchase_id;
    if (!purchaseId) return Response.json({ received: true, ignored: 'no_purchase_reference' });

    const base44 = createClientFromRequest(req);
    const purchase = await base44.asServiceRole.entities.Purchase.get(purchaseId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!purchase) return Response.json({ received: true, ignored: 'purchase_missing' });
    if (purchase.status === 'paid') return Response.json({ received: true, ignored: 'already_paid' });

    const amountMatches = Number(session.amount_total) === Number(purchase.amount_cents);
    const currencyMatches =
      String(session.currency || '').toLowerCase() === String(purchase.currency || 'EUR').toLowerCase();
    if (!amountMatches || !currencyMatches) {
      console.error('stripe amount mismatch', session.id, session.amount_total, purchase.amount_cents);
      return Response.json({ received: true, ignored: 'amount_mismatch' });
    }

    const credits = Number(purchase.credits) || 0;
    const scrapes = Number(purchase.scrapes) || 0;
    const existing = await base44.asServiceRole.entities.CreditAccount.filter({
      user_email: purchase.user_email,
    });

    if (existing.length > 0) {
      await base44.asServiceRole.entities.CreditAccount.update(existing[0].id, {
        balance: (existing[0].balance ?? 0) + credits,
        lifetime_purchased: (existing[0].lifetime_purchased ?? 0) + credits,
        scrape_balance: (existing[0].scrape_balance ?? 0) + scrapes,
        plan: purchase.pack_id,
      });
    } else {
      await base44.asServiceRole.entities.CreditAccount.create({
        user_email: purchase.user_email,
        plan: purchase.pack_id,
        balance: credits,
        lifetime_purchased: credits,
        scrape_balance: scrapes,
        lifetime_scraped: 0,
        runs_completed: 0,
      });
    }

    await base44.asServiceRole.entities.Purchase.update(purchase.id, {
      status: 'paid',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent ?? null,
    });

    return Response.json({ received: true, fulfilled: purchase.id, credits, scrapes });
  } catch (error) {
    console.error('stripeWebhook error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}