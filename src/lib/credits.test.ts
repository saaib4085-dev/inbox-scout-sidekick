import { describe, expect, it } from "vitest";
import {
  CREDIT_COSTS,
  PLANS,
  SIGNUP_BONUS,
  TOPUP_PACK,
  renewMonth,
  splitSpend,
} from "./credits";

describe("credit pricing", () => {
  it("charges 50 credits per email generation request (three options)", () => {
    expect(CREDIT_COSTS.emailGeneration).toBe(50);
  });
  it("charges 50 credits per AI question", () => {
    expect(CREDIT_COSTS.aiQuestion).toBe(50);
  });
  it("charges 100 credits per lead scrape", () => {
    expect(CREDIT_COSTS.leadScrape).toBe(100);
  });
  it("gives a one-time 1,000 credit sign-up bonus with no monthly refill", () => {
    expect(SIGNUP_BONUS).toBe(1000);
    expect(PLANS.free.monthlyCredits).toBe(0);
  });
  it("prices Pro at €19 for 15,000 monthly credits", () => {
    expect(PLANS.pro.priceEur).toBe(19);
    expect(PLANS.pro.monthlyCredits).toBe(15000);
  });
  it("prices Business at €50 for 50,000 monthly credits", () => {
    expect(PLANS.business.priceEur).toBe(50);
    expect(PLANS.business.monthlyCredits).toBe(50000);
  });
  it("sells a €10 top-up for 5,000 credits", () => {
    expect(TOPUP_PACK.priceEur).toBe(10);
    expect(TOPUP_PACK.credits).toBe(5000);
  });
});

describe("credit balances", () => {
  it("refuses a spend larger than the balance", () => {
    expect(splitSpend({ subscription: 0, bonus: 40, topup: 0 }, 50)).toBeNull();
  });
  it("spends subscription credits before bonus and top-up credits", () => {
    expect(splitSpend({ subscription: 30, bonus: 10, topup: 100 }, 100)).toEqual({
      subscription: 30,
      bonus: 10,
      topup: 60,
    });
  });
  it("resets subscription credits monthly without rollover but keeps top-ups", () => {
    expect(renewMonth({ subscription: 4000, bonus: 0, topup: 5000 }, "pro")).toEqual({
      subscription: 15000,
      bonus: 0,
      topup: 5000,
    });
  });
});
