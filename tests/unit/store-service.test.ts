// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { storeService } from "@/lib/store-service";
import { PLATFORM_PLANS, canAddProduct, isThemeAllowed } from "@/lib/plans";
import { PLATFORM_THEMES, getTheme, generateThemeCssVariables } from "@/lib/themes";
import { getFontFamily } from "@/lib/fonts";

describe("Platform Multi-Tenant Store & Subscription Engine", () => {
  const testSubdomain = `testboutique-${Date.now().toString(36)}`;

  it("registers a new seller store with free starter plan & default theme", () => {
    const store = storeService.registerStore({
      name: "Test Silk Boutique",
      subdomain: testSubdomain,
      category: "Fashion & Apparel",
      ownerName: "Anita Roy",
      contactPhone: "+919876543210",
      contactEmail: "anita@testboutique.com",
      upiId: "anita@okhdfcbank",
      tagline: "Finest Indian silk sarees",
    });

    expect(store).toBeDefined();
    expect(store.subdomain).toBe(testSubdomain);
    expect(store.planId).toBe("free");
    expect(store.activeThemeSlug).toBe("classic-bloom");
    expect(store.products.length).toBeGreaterThanOrEqual(1);
    expect(store.upiId).toBe("anita@okhdfcbank");
  });

  it("enforces plan product quotas on the free tier (max 10 products)", () => {
    const store = storeService.getStore(testSubdomain)!;
    expect(store).toBeDefined();

    const quota = canAddProduct(store.products.length, "free");
    expect(quota.limit).toBe(10);
    expect(quota.allowed).toBe(true);

    // Test quota block when at limit
    const atLimitQuota = canAddProduct(10, "free");
    expect(atLimitQuota.allowed).toBe(false);
    expect(atLimitQuota.remaining).toBe(0);
  });

  it("blocks free tier stores from activating paid designer themes", () => {
    // Classic bloom is free
    expect(isThemeAllowed("classic-bloom", "free")).toBe(true);

    // Bento Tech and Kyoto Botanical require the starter plan
    expect(isThemeAllowed("bento-tech", "free")).toBe(false);
    expect(isThemeAllowed("botanical-wellness", "free")).toBe(false);

    // Tokyo Lookbook requires the pro plan
    expect(isThemeAllowed("lookbook-minimal", "free")).toBe(false);
    expect(isThemeAllowed("lookbook-minimal", "starter")).toBe(false);
    expect(isThemeAllowed("lookbook-minimal", "pro")).toBe(true);
  });

  it("upgrades store subscription and unlocks higher quotas and premium themes", () => {
    // Upgrade to starter/growth plan
    const updated = storeService.upgradeStorePlan(testSubdomain, "starter");
    expect(updated.planId).toBe("starter");

    const starterQuota = canAddProduct(20, "starter");
    expect(starterQuota.allowed).toBe(true);
    expect(starterQuota.limit).toBe(50);

    // Theme activation should now succeed for bento-tech
    const themeRes = storeService.setStoreTheme(testSubdomain, "bento-tech");
    expect(themeRes.success).toBe(true);

    const storeAfterTheme = storeService.getStore(testSubdomain)!;
    expect(storeAfterTheme.activeThemeSlug).toBe("bento-tech");
  });

  it("records buyer orders with unguessable tracking tokens and calculates totals", () => {
    const order = storeService.createOrder(testSubdomain, {
      customer: {
        name: "Meera Nair",
        phone: "+919800112233",
        email: "meera@example.com",
      },
      address: {
        street: "45 MG Road, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
      items: [
        {
          productId: "prod-test-1",
          title: "Kanchipuram Silk Saree",
          image: "https://example.com/saree.jpg",
          quantity: 2,
          price: 250000, // ₹2,500 each = ₹5,000
        },
      ],
      paymentMethod: "upi",
      paymentUtr: "439281729102",
    });

    expect(order).toBeDefined();
    expect(order.number).toMatch(/^#\d+/);
    expect(order.token).toMatch(/^tok_sh_/);
    expect(order.subtotal).toBe(500000);
    expect(order.paymentMethod).toBe("upi");
    expect(order.paymentUtr).toBe("439281729102");
    expect(order.fulfilmentStatus).toBe("placed");
  });

  it("allows buyers to submit reviews and sellers to moderate them", () => {
    const review = storeService.addReview(testSubdomain, {
      productId: "prod-test-1",
      customerName: "Meera Nair",
      rating: 5,
      title: "Gorgeous saree!",
      comment: "Zari work is authentic and fabric is pure silk. Super fast delivery.",
    });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.status).toBe("approved");

    // Moderate review (hide/pending)
    const updatedReview = storeService.updateReviewStatus(testSubdomain, review.id, "pending");
    expect(updatedReview.status).toBe("pending");
  });

  it("supports custom brand theme (3 color fields: Cream, Black, White) and store typography font selection", () => {
    const updated = storeService.updateStore(testSubdomain, {
      customBrandTheme: {
        primary: "#111111",
        background: "#FDFBF7",
        surface: "#FFFFFF",
      },
      fontFamily: "Outfit",
    });

    expect(updated.customBrandTheme).toEqual({
      primary: "#111111",
      background: "#FDFBF7",
      surface: "#FFFFFF",
    });
    expect(updated.fontFamily).toBe("Outfit");

    // Verify CSS variables generation
    const theme = getTheme(updated.activeThemeSlug);
    const cssVars = generateThemeCssVariables(theme, updated.customBrandTheme, updated.fontFamily);
    expect(cssVars["--primary"]).toBe("#111111");
    expect(cssVars["--background"]).toBe("#FDFBF7");
    expect(cssVars["--card"]).toBe("#FFFFFF");
    expect(cssVars["--font-store"]).toBe("'Outfit', sans-serif");
  });
});
