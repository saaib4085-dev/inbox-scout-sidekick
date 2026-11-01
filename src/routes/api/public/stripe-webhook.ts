import { createFileRoute } from "@tanstack/react-router";
import { stripeRequest, verifyStripeSignature } from "@/lib/stripe.server";
import { PLANS, TOPUP_PACK, type PlanId } from "@/lib/credits";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 500 });
        const raw = await request.text();
        if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret)) {
          return new Response("Invalid signature", { status: 400 });
        }
        const event = JSON.parse(raw) as { id: string; type: string; data: { object: any } };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: process each event once
        const { error: dup } = await supabaseAdmin.from("stripe_events").insert({ id: event.id, type: event.type });
        if (dup) return new Response("ok (duplicate)");

        try {
          const obj = event.data.object;
          if (event.type === "checkout.session.completed" && obj.mode === "payment" && obj.payment_status === "paid") {
            const userId = obj.metadata?.user_id;
            if (userId && obj.metadata?.kind === "topup") {
              await supabaseAdmin.rpc("add_topup", { _user_id: userId, _credits: TOPUP_PACK.credits });
            }
          } else if (event.type === "invoice.paid") {
            const subId = typeof obj.subscription === "string" ? obj.subscription : obj.parent?.subscription_details?.subscription;
            if (subId) {
              const sub = await stripeRequest("GET", `/subscriptions/${subId}`);
              const userId = sub.metadata?.user_id;
              const plan = sub.metadata?.plan as PlanId | undefined;
              if (userId && plan && (plan === "pro" || plan === "business")) {
                const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
                await supabaseAdmin.rpc("apply_subscription", {
                  _user_id: userId,
                  _plan: plan,
                  _credits: PLANS[plan].monthlyCredits,
                  _period_end: new Date(Number(periodEnd) * 1000).toISOString(),
                });
                await supabaseAdmin.from("credit_wallets").update({ stripe_subscription_id: subId }).eq("user_id", userId);
              }
            }
          } else if (event.type === "customer.subscription.deleted") {
            const userId = obj.metadata?.user_id;
            if (userId) await supabaseAdmin.rpc("end_subscription", { _user_id: userId });
          }
        } catch (e) {
          // Let Stripe retry: remove the idempotency marker
          await supabaseAdmin.from("stripe_events").delete().eq("id", event.id);
          console.error("Stripe webhook processing failed", event.type, e);
          return new Response("Processing failed", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
