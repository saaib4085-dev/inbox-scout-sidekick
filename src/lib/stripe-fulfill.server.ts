import { stripeRequest } from "./stripe.server";
import { PLANS, TOPUP_PACK } from "./credits";

/** Records a fulfillment key once; returns false if it was already processed. */
async function claim(key: string, type: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("stripe_events").insert({ id: key, type });
  return !error;
}
async function release(key: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("stripe_events").delete().eq("id", key);
}

/** Adds top-up credits for a paid checkout session (idempotent). */
export async function fulfillTopupSession(session: any, expectedUserId?: string) {
  const userId = session?.metadata?.user_id;
  if (!userId || session.metadata?.kind !== "topup" || session.payment_status !== "paid") return false;
  if (expectedUserId && userId !== expectedUserId) return false;
  const key = `topup:${session.id}`;
  if (!(await claim(key, "topup"))) return true;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("add_topup", { _user_id: userId, _credits: TOPUP_PACK.credits });
    if (error) throw error;
    return true;
  } catch (e) {
    await release(key);
    throw e;
  }
}

/** Resets monthly plan credits for a paid subscription invoice (idempotent per invoice). */
export async function fulfillSubscriptionInvoice(invoiceId: string, expectedUserId?: string) {
  const invoice = await stripeRequest("GET", `/invoices/${invoiceId}`);
  if (invoice.status !== "paid") return false;
  const subId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.parent?.subscription_details?.subscription;
  if (!subId) return false;
  const sub = await stripeRequest("GET", `/subscriptions/${subId}`);
  const userId = sub.metadata?.user_id;
  const plan = sub.metadata?.plan;
  if (!userId || (plan !== "pro" && plan !== "business")) return false;
  if (expectedUserId && userId !== expectedUserId) return false;
  const key = `invoice:${invoiceId}`;
  if (!(await claim(key, "invoice"))) return true;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
    const { error } = await supabaseAdmin.rpc("apply_subscription", {
      _user_id: userId,
      _plan: plan,
      _credits: PLANS[plan as "pro" | "business"].monthlyCredits,
      _period_end: new Date(Number(periodEnd) * 1000).toISOString(),
    });
    if (error) throw error;
    await supabaseAdmin
      .from("credit_wallets")
      .update({ stripe_subscription_id: subId, stripe_customer_id: sub.customer })
      .eq("user_id", userId);
    return true;
  } catch (e) {
    await release(key);
    throw e;
  }
}
