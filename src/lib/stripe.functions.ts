import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripeRequest } from "./stripe.server";
import { PLANS, TOPUP_PACK } from "./credits";
import { fulfillSubscriptionInvoice, fulfillTopupSession } from "./stripe-fulfill.server";

function appOrigin() {
  const request = getRequest();
  if (!request) throw new Error("Checkout must start from the app.");
  const url = new URL(request.url);
  const sandboxHost = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
  return sandboxHost ? `https://${sandboxHost}` : url.origin;
}

async function ensureCustomer(userId: string, email: string | undefined) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: w } = await supabaseAdmin
    .from("credit_wallets")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (w?.stripe_customer_id) return w.stripe_customer_id;
  const c = await stripeRequest<{ id: string }>("POST", "/customers", {
    email,
    metadata: { user_id: userId },
  });
  await supabaseAdmin.from("credit_wallets").update({ stripe_customer_id: c.id }).eq("user_id", userId);
  return c.id;
}

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ product: z.enum(["pro", "business", "topup"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string })?.email;
    const customer = await ensureCustomer(context.userId, email);
    const origin = appOrigin();
    const common = {
      customer,
      client_reference_id: context.userId,
      success_url: `${origin}/credits?checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits?tab=packages`,
      allow_promotion_codes: true,
    };
    if (data.product === "topup") {
      const s = await stripeRequest<{ url: string }>("POST", "/checkout/sessions", {
        ...common,
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: TOPUP_PACK.priceEur * 100,
              product_data: { name: "InboxHero top-up — 5,000 credits" },
            },
          },
        ],
        metadata: { user_id: context.userId, kind: "topup" },
        payment_intent_data: { metadata: { user_id: context.userId, kind: "topup" } },
      });
      return { url: s.url };
    }
    const plan = PLANS[data.product];
    const s = await stripeRequest<{ url: string }>("POST", "/checkout/sessions", {
      ...common,
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: plan.priceEur * 100,
            recurring: { interval: "month" },
            product_data: { name: `InboxHero ${plan.name} — ${plan.monthlyCredits.toLocaleString("en-US")} credits/month` },
          },
        },
      ],
      metadata: { user_id: context.userId, kind: "subscription", plan: plan.id },
      subscription_data: { metadata: { user_id: context.userId, plan: plan.id } },
    });
    return { url: s.url };
  });

export const createBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: w } = await supabaseAdmin
      .from("credit_wallets")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!w?.stripe_customer_id) throw new Error("No billing account yet — buy a plan or top-up first.");
    const s = await stripeRequest<{ url: string }>("POST", "/billing_portal/sessions", {
      customer: w.stripe_customer_id,
      return_url: `${appOrigin()}/credits`,
    });
    return { url: s.url };
  });

/** Called when the user returns from Checkout: confirms the payment with Stripe and adds credits once. */
export const confirmCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const session = await stripeRequest("GET", `/checkout/sessions/${data.sessionId}`);
    if (session.client_reference_id !== context.userId) throw new Error("This checkout belongs to another account.");
    if (session.mode === "payment") return { ok: await fulfillTopupSession(session, context.userId) };
    if (session.mode === "subscription" && session.invoice) {
      const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice.id;
      return { ok: await fulfillSubscriptionInvoice(invoiceId, context.userId) };
    }
    return { ok: false };
  });
