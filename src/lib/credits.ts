// Shared credit rules. The database functions (reserve_credits / refund_credits /
// apply_subscription / add_topup) enforce the same rules server-side.

export const CREDIT_COSTS = {
  /** One generation request returns three reply options; charged once per request. */
  emailGeneration: 50,
  /** One question to the AI assistant. */
  aiQuestion: 50,
  /** One in-app lead search. */
  leadScrape: 100,
} as const;

export const SIGNUP_BONUS = 1000;

export type PlanId = "free" | "pro" | "business";

export const PLANS: Record<
  PlanId,
  { id: PlanId; name: string; priceEur: number; monthlyCredits: number; blurb: string }
> = {
  free: {
    id: "free",
    name: "Free",
    priceEur: 0,
    monthlyCredits: 0,
    blurb: "1,000 one-time sign-up credits that never expire. No monthly refill.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceEur: 19,
    monthlyCredits: 15000,
    blurb: "15,000 credits every month for solo founders and freelancers.",
  },
  business: {
    id: "business",
    name: "Business",
    priceEur: 50,
    monthlyCredits: 50000,
    blurb: "50,000 credits every month for teams and heavy outreach.",
  },
};

export const TOPUP_PACK = { id: "topup_5000", priceEur: 10, credits: 5000 } as const;

export interface WalletBalances {
  subscription: number;
  bonus: number;
  topup: number;
}

export function totalCredits(w: WalletBalances) {
  return w.subscription + w.bonus + w.topup;
}

/** How many actions of each kind the balance covers. */
export function creditsCover(total: number) {
  return {
    generations: Math.floor(total / CREDIT_COSTS.emailGeneration),
    questions: Math.floor(total / CREDIT_COSTS.aiQuestion),
    scrapes: Math.floor(total / CREDIT_COSTS.leadScrape),
  };
}

/**
 * Mirror of reserve_credits: spends expiring subscription credits first, then the
 * sign-up bonus, then carry-over top-up credits. Returns null when the balance is short.
 */
export function splitSpend(w: WalletBalances, amount: number): WalletBalances | null {
  if (totalCredits(w) < amount) return null;
  let left = amount;
  const subscription = Math.min(w.subscription, left);
  left -= subscription;
  const bonus = Math.min(w.bonus, left);
  left -= bonus;
  const topup = Math.min(w.topup, left);
  return { subscription, bonus, topup };
}

/** Monthly renewal: subscription credits reset to the plan amount, top-ups carry over. */
export function renewMonth(w: WalletBalances, plan: PlanId): WalletBalances {
  return { subscription: PLANS[plan].monthlyCredits, bonus: w.bonus, topup: w.topup };
}

export function formatCredits(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
