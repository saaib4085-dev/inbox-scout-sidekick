import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export class CreditError extends Error {}

/** Reserve credits as the signed-in user before any paid call. Throws when the balance is short. */
export async function reserveCredits(
  supabase: SupabaseClient<Database>,
  amount: number,
  reason: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("reserve_credits", { _amount: amount, _reason: reason });
  if (error) {
    if (error.message.includes("insufficient_credits")) {
      throw new CreditError(
        `Not enough credits — this needs ${amount}. Top up or upgrade on the Credits page.`,
      );
    }
    throw new Error("Could not reserve credits. Please try again.");
  }
  return data as string;
}

/** Restore reserved credits after a failed AI or scraper request. */
export async function refundCredits(ledgerId: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("refund_credits", {
    _ledger_id: ledgerId,
    _user_id: userId,
  });
  if (error) console.error("refund failed", ledgerId, error.message);
}

/** Run a paid action: reserve first, refund if the action throws. */
export async function withCredits<T>(
  ctx: { supabase: SupabaseClient<Database>; userId: string },
  amount: number,
  reason: string,
  action: () => Promise<T>,
): Promise<T> {
  const ledgerId = await reserveCredits(ctx.supabase, amount, reason);
  try {
    return await action();
  } catch (e) {
    await refundCredits(ledgerId, ctx.userId);
    throw e;
  }
}
