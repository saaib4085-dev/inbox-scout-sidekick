import { describe, expect, it } from "vitest";
import { checkoutInput, checkoutSummary } from "./policies";

describe("checkout legal rules", () => {
  it("refuses checkout without the 14-day withdrawal waiver", () => {
    expect(checkoutInput.safeParse({ product: "topup", adultOrGuardian: true }).success).toBe(false);
    expect(checkoutInput.safeParse({ product: "topup", waiveWithdrawal: false, adultOrGuardian: true }).success).toBe(false);
  });
  it("refuses checkout without 18+ or guardian consent", () => {
    expect(checkoutInput.safeParse({ product: "pro", waiveWithdrawal: true, adultOrGuardian: false }).success).toBe(false);
  });
  it("accepts checkout when both boxes are ticked", () => {
    expect(checkoutInput.safeParse({ product: "business", waiveWithdrawal: true, adultOrGuardian: true }).success).toBe(true);
  });
  it("shows the final price with no added transaction fees", () => {
    expect(checkoutSummary("topup")).toMatchObject({ priceEur: 10, feesEur: 0, totalEur: 10 });
    expect(checkoutSummary("pro")).toMatchObject({ totalEur: 19, feesEur: 0, recurring: true });
    expect(checkoutSummary("business")).toMatchObject({ totalEur: 50, feesEur: 0 });
  });
});
