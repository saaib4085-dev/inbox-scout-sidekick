import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { CREDIT_PACKS, PACK_PRICE_IDS, CONSENT_VERSION } from '../../shared/credits.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Sign in to buy credits.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pack = CREDIT_PACKS[body.packId];
    const priceId = PACK_PRICE_IDS[body.packId];

    if (body.consentTerms !== true) {
      return Response.json(
        { error: 'You must accept the Terms of Service and Privacy Policy before paying.' },
        { status: 400 },
      );
    }
    if (!pack) return Response.json({ error: 'Unknown plan' }, { status: 400 });
    if (!priceId || pack.amountCents === null) {
      console.error('stripe checkout: plan is not self-serve', body.packId);
      return Response.json(
        { error: 'Enterprise is arranged with our team — get in touch and we will enable it on your workspace.' },
        { status: 400 },
      );
    }

    const origin = req.headers.get('X-Base44-App-Url');
    if (!origin) {
      console.error('stripe checkout: missing X-Base44-App-Url header');
      return Response.json({ error: 'Checkout is unavailable right now.' }, { status: 500 });
    }

    const purchase = await base44.asServiceRole.entities.Purchase.create({
      user_email: user.email,
      pack_id: body.packId,
      pack_name: pack.name,
      credits: pack.credits,
      scrapes: pack.scrapes,
      amount_cents: pack.amountCents,
      currency: 'EUR',
      status: 'pending_payment',
      consent_terms: true,
      consent_withdrawal_waiver: true,
      consent_version: CONSENT_VERSION,
      consented_at: new Date().toISOString(),
    });

    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${origin}/app?checkout=success`);
    params.set('cancel_url', `${origin}/pricing?checkout=cancelled`);
    params.set('customer_email', user.email);
    params.set('client_reference_id', purchase.id);
    params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') ?? '');
    params.set('metadata[purchase_id]', purchase.id);
    params.set('metadata[user_email]', user.email);
    params.set('metadata[pack_id]', body.packId);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-10-29.clover',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: params.toString(),
      signal: AbortSignal.timeout(20000),
    });

    const session = await response.json();
    if (!response.ok || !session?.url) {
      console.error('stripe checkout session failed', session?.error?.message, purchase.id);
      return Response.json(
        { error: session?.error?.message || 'Payment could not be started. Please try again.' },
        { status: 502 },
      );
    }

    await base44.asServiceRole.entities.Purchase.update(purchase.id, {
      stripe_session_id: session.id,
    });

    return Response.json({ url: session.url, orderId: purchase.id });
  } catch (error) {
    console.error('startCheckout error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}