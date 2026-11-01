import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeSignature } from "@/lib/stripe.server";
import { fulfillSubscriptionInvoice, fulfillTopupSession } from "@/lib/stripe-fulfill.server";

// Stripe calls this after payments and on every monthly renewal. Signature-verified.
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
        const obj = event.data.object;
        try {
          if (event.type === "checkout.session.completed" && obj.mode === "payment") {
            await fulfillTopupSession(obj);
          } else if (event.type === "invoice.paid" && obj.id) {
            await fulfillSubscriptionInvoice(obj.id);
          } else if (event.type === "customer.subscription.deleted") {
            const userId = obj.metadata?.user_id;
            if (userId) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin.rpc("end_subscription", { _user_id: userId });
            }
          }
        } catch (e) {
          console.error("Stripe webhook processing failed", event.type, e);
          return new Response("Processing failed", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
