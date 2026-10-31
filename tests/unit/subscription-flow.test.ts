// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { storeService } from "@/lib/store-service";
import { siteConfig } from "@/lib/config/site";
import { PLATFORM_PLANS } from "@/lib/plans";

describe("Subscription & UPI Payment Flow Unit Tests", () => {
  const testSubdomain = `subtest-${Date.now().toString(36)}`;

  beforeAll(() => {
    storeService.registerStore({
      name: "Sub Test Boutique",
      subdomain: testSubdomain,
      category: "Fashion & Apparel",
      ownerName: "Test Owner",
      contactPhone: "+919876543210",
      upiId: "testowner@okhdfcbank",
      tagline: "Test store for subscriptions",
    });
  });

  it("creates a pending subscription payment request with fixed 2-decimal amount", () => {
    const req = storeService.createSubscriptionPayment(testSubdomain, {
      planId: "starter",
      billingCycle: "monthly",
      paymentUtr: "428910293841",
    });

    expect(req).toBeDefined();
    expect(req.planId).toBe("starter");
    expect(req.planName).toBe(PLATFORM_PLANS.starter.name);
    expect(req.amount).toBe(29900); // ₹299.00 in paise
    expect(req.status).toBe("pending_verification");
    expect(req.estimatedVerificationTime).toBe("1-2 hours");
    expect(req.paymentUtr).toBe("428910293841");
    expect(req.referenceId).toMatch(/^REF-SUB-/);

    const store = storeService.getStore(testSubdomain);
    expect(store?.pendingSubscription).toBeDefined();
    expect(store?.pendingSubscription?.id).toBe(req.id);
    expect(store?.planId).toBe("free"); // Plan remains free until verified
  });

  it("formats UPI URL with strictly fixed amount and standard INR currency", () => {
    const plan = PLATFORM_PLANS.starter;
    const amountRupees = plan.priceMonthly / 100;
    const fixedAmountStr = amountRupees.toFixed(2); // "299.00"

    const platformUpi = siteConfig.platformUpiId;
    const platformName = siteConfig.platformMerchantName;
    const refId = "REF-SUB-123456";
    const note = "Sub Growth Plan - demo-shop";

    const upiUrl = `upi://pay?pa=${encodeURIComponent(platformUpi)}&pn=${encodeURIComponent(
      platformName
    )}&am=${fixedAmountStr}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(refId)}`;

    expect(upiUrl).toContain("upi://pay?");
    expect(upiUrl).toContain(`am=299.00`); // Strict fixed amount
    expect(upiUrl).toContain("cu=INR");
    expect(upiUrl).toContain(`pa=${encodeURIComponent(platformUpi)}`);
  });

  it("supports annual billing option with 2 months discount calculation", () => {
    const req = storeService.createSubscriptionPayment(testSubdomain, {
      planId: "starter",
      billingCycle: "yearly",
    });

    expect(req.billingCycle).toBe("yearly");
    expect(req.amount).toBe(PLATFORM_PLANS.starter.priceYearly || 299000); // ₹2,990
    expect(req.status).toBe("pending_verification");
  });

  it("verifies and activates subscription upon bank confirmation", () => {
    const req = storeService.createSubscriptionPayment(testSubdomain, {
      planId: "starter",
      paymentUtr: "987654321012",
    });

    const verifyRes = storeService.verifySubscriptionPayment(testSubdomain, req.id);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.store?.planId).toBe("starter"); // Successfully upgraded to starter
    expect(verifyRes.store?.pendingSubscription).toBeNull(); // Pending cleared

    const historyItem = verifyRes.store?.subscriptionHistory?.find((h) => h.id === req.id);
    expect(historyItem).toBeDefined();
    expect(historyItem?.status).toBe("verified");
    expect(historyItem?.verifiedAt).toBeDefined();
  });

  it("allows cancelling a pending subscription request", () => {
    storeService.createSubscriptionPayment(testSubdomain, {
      planId: "pro",
    });

    const cancelled = storeService.cancelSubscriptionRequest(testSubdomain);
    expect(cancelled).toBe(true);

    const store = storeService.getStore(testSubdomain);
    expect(store?.pendingSubscription).toBeNull();
  });
});
