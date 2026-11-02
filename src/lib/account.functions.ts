import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripeRequest } from "./stripe.server";

const USER_TABLES = ["drafts", "leads", "outbox", "credit_ledger", "app_user_connections"] as const;

/** GDPR right of access: returns a copy of everything stored about the signed-in user. */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const [profile, wallet, consents, ...rest] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabaseAdmin.from("credit_wallets").select("plan, subscription_credits, bonus_credits, topup_credits, period_end, created_at").eq("user_id", uid).maybeSingle(),
      supabaseAdmin.from("purchase_consents").select("*").eq("user_id", uid),
      ...USER_TABLES.map((t) =>
        t === "app_user_connections"
          ? supabaseAdmin.from(t).select("connector_id, created_at").eq("user_id", uid)
          : supabaseAdmin.from(t).select("*").eq("user_id", uid),
      ),
    ]);
    const out: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      account: { id: uid, email: (context.claims as { email?: string })?.email ?? null },
      profile: profile.data,
      credit_wallet: wallet.data,
      purchase_consents: consents.data ?? [],
    };
    USER_TABLES.forEach((t, i) => (out[t] = rest[i]?.data ?? []));
    return JSON.stringify(out, null, 2);
  });

/** GDPR right to erasure: cancels any subscription, deletes the user's data and their sign-in. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ confirm: z.literal("DELETE") }).parse(d))
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: w } = await supabaseAdmin
      .from("credit_wallets")
      .select("stripe_subscription_id")
      .eq("user_id", uid)
      .maybeSingle();
    if (w?.stripe_subscription_id) {
      try {
        await stripeRequest("DELETE", `/subscriptions/${w.stripe_subscription_id}`);
      } catch (e) {
        console.error("Subscription cancel failed during account deletion:", (e as Error).message);
        throw new Error("We couldn't cancel your subscription. Please try again in a moment.");
      }
    }
    for (const t of ["drafts", "leads", "outbox", "app_user_connections", "credit_wallets"] as const) {
      const { error } = await supabaseAdmin.from(t).delete().eq("user_id", uid);
      if (error) throw new Error("Couldn't delete all of your data. Please try again.");
    }
    // Credit history and purchase consents are kept (no content, just amounts) for tax and consumer law.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error("Couldn't delete your sign-in. Please try again.");
    return { ok: true };
  });
