import { z } from "zod";
import { PLANS, TOPUP_PACK } from "./credits";

export const POLICY_UPDATED = "2 November 2026";
/** Bump whenever the checkout consent wording changes; stored with every purchase. */
export const CONSENT_VERSION = "2026-11-02";

/** Business details shown on every legal page. Bracketed values still need the owner's real details. */
export const OPERATOR = {
  tradingName: "InboxHero",
  ownerName: "[Owner's legal name]",
  status: "Sole trader registered in Ireland (trading name registered with the CRO)",
  address: "[Business address, Ireland]",
  email: "[support email]",
};

export const WITHDRAWAL_WAIVER_TEXT =
  "I want my credits delivered immediately. I understand that once credits are added to my account I lose my 14-day right of withdrawal (cooling-off period).";
export const AGE_CONSENT_TEXT =
  "I am 18 or older, or my parent or legal guardian has agreed to this purchase.";

export type Product = "pro" | "business" | "topup";

export const checkoutInput = z.object({
  product: z.enum(["pro", "business", "topup"]),
  waiveWithdrawal: z.literal(true, { errorMap: () => ({ message: "Please confirm immediate delivery of your credits." }) }),
  adultOrGuardian: z.literal(true, { errorMap: () => ({ message: "Please confirm you are 18+ or have guardian consent." }) }),
});

/** The final price shown before purchase. InboxHero adds no transaction or card fees. */
export function checkoutSummary(product: Product) {
  if (product === "topup") {
    return {
      name: `Top-up pack — ${TOPUP_PACK.credits.toLocaleString("en-US")} credits`,
      priceEur: TOPUP_PACK.priceEur,
      feesEur: 0,
      totalEur: TOPUP_PACK.priceEur,
      recurring: false,
    };
  }
  const p = PLANS[product];
  return {
    name: `${p.name} plan — ${p.monthlyCredits.toLocaleString("en-US")} credits / month`,
    priceEur: p.priceEur,
    feesEur: 0,
    totalEur: p.priceEur,
    recurring: true,
  };
}

/** Who processes user data on InboxHero's behalf. */
export const PROCESSORS = [
  { name: "Lovable Cloud", purpose: "Hosting, sign-in and database storage for your account, drafts, leads and outbox." },
  { name: "Anthropic (Claude), via the Lovable AI Gateway", purpose: "Processes your prompts, pasted emails, lead details and brand voice to generate drafts and answer assistant questions." },
  { name: "Stripe", purpose: "Payment processing, subscriptions and invoices. We never see or store your card number." },
  { name: "Apify", purpose: "Runs business searches you request to find public business listings." },
  { name: "Google (Gmail) and Microsoft (Outlook)", purpose: "Only if you connect a mailbox — sends the emails you approve from your own account." },
];

export const RETENTION = [
  { data: "Account details (email, name, signature, brand voice)", period: "Until you delete your account." },
  { data: "Drafts, prompts and generated replies", period: "Until you delete them or your account." },
  { data: "Leads (including scraped public business details)", period: "Until you delete them or your account." },
  { data: "Outbox and sent-email records", period: "Until you delete them or your account." },
  { data: "Credit history and purchase consent records", period: "6 years after the purchase, to meet Irish tax and consumer law." },
  { data: "Mailbox connections", period: "Until you disconnect the mailbox or delete your account." },
];
