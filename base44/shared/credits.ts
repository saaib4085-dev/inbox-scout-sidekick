export const FREE_CREDITS = 500;
export const FREE_SCRAPES = 20;

export const LEADS_PER_RUN = 5;
export const MAX_BRIEFS = 5;

export const SCRAPE_COST_PER_LEAD = 1;
export const COST_AI_MESSAGE = 15;
export const COST_SAMPLE_DRAFT = 25;

export const CONSENT_VERSION = "2026-11-01";

// Plans. amountCents === null means it is arranged with the team (no self-serve checkout).
export const CREDIT_PACKS = {
  pro: { name: "Pro", credits: 1000, scrapes: 300, amountCents: 1900 },
  scale: { name: "Scale", credits: 5000, scrapes: 500, amountCents: 4900 },
  enterprise: { name: "Enterprise", credits: 10000, scrapes: 1000, amountCents: null },
};

export const PACK_PRICE_IDS = {
  pro: "price_1UWyMVBDEqYn0gipO0bir6pF",
  scale: "price_1UWyMVBDEqYn0gipRezPHyEw",
};

export function scrapeCostForRuns(briefCount) {
  return Math.max(0, briefCount) * LEADS_PER_RUN * SCRAPE_COST_PER_LEAD;
}

export async function ensureCreditAccount(base44, user) {
  const serviceRole = base44.asServiceRole;
  const existing = await serviceRole.entities.CreditAccount.filter({ user_email: user.email });
  if (existing.length > 0) {
    const account = existing[0];
    if (typeof account.scrape_balance === "number") return account;

    // Accounts created before scrapes existed start with the free scrape allowance.
    return serviceRole.entities.CreditAccount.update(account.id, {
      scrape_balance: FREE_SCRAPES,
      lifetime_scraped: account.lifetime_scraped ?? 0,
    });
  }

  return serviceRole.entities.CreditAccount.create({
    user_email: user.email,
    plan: "free",
    balance: FREE_CREDITS,
    lifetime_purchased: 0,
    scrape_balance: FREE_SCRAPES,
    lifetime_scraped: 0,
    runs_completed: 0,
  });
}

export async function purgeUserData(base44, email) {
  const serviceRole = base44.asServiceRole;
  const [leads, accounts, purchases] = await Promise.all([
    serviceRole.entities.Lead.deleteMany({ user_email: email }),
    serviceRole.entities.CreditAccount.deleteMany({ user_email: email }),
    serviceRole.entities.Purchase.deleteMany({ user_email: email }),
  ]);

  return { leads, accounts, purchases };
}