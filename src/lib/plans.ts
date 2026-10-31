import { getUploadedTheme } from "./themes";

export interface PlanFeature {
  id: string;
  name: string;
  tier: "free" | "starter" | "pro";
  priceMonthly: number; // in paise
  priceFormatted: string;
  maxProducts: number;
  themesAllowed: string[];
  customDomain: boolean;
  maxBanners: number;
  highlight?: boolean;
  description: string;
  features: string[];
}

export const PLATFORM_PLANS: Record<string, PlanFeature> = {
  free: {
    id: "free",
    name: "Starter Free",
    tier: "free",
    priceMonthly: 0,
    priceFormatted: "₹0 / month",
    maxProducts: 10,
    themesAllowed: ["classic-bloom"],
    customDomain: false,
    maxBanners: 1,
    description: "Everything a new seller needs to launch online in 60 seconds.",
    features: [
      "Up to 10 products in catalog",
      "Classic Bloom default theme",
      "Direct UPI payments to your QR/VPA",
      "Cash on Delivery (COD) support",
      "Free live subdomain (shopname.shopper.site)",
      "Instant WhatsApp order sharing",
      "Standard order management dashboard",
    ],
  },
  starter: {
    id: "starter",
    name: "Growth Plan",
    tier: "starter",
    priceMonthly: 29900,
    priceFormatted: "₹299 / month",
    maxProducts: 50,
    themesAllowed: ["classic-bloom", "bento-tech", "botanical-wellness"],
    customDomain: false,
    maxBanners: 5,
    highlight: true,
    description: "Designed for growing boutique sellers with expanding catalogs.",
    features: [
      "Up to 50 products in catalog",
      "Starter designer templates, including Bento Tech & Kyoto Botanical",
      "Multiple promotional hero banners & announcement bar",
      "Discount coupon & promo code engine",
      "Customer review moderation & approval",
      "Direct WhatsApp customer 1-click messaging",
      "Verified Seller badge on storefront",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Merchant",
    tier: "pro",
    priceMonthly: 79900,
    priceFormatted: "₹799 / month",
    maxProducts: 999999,
    themesAllowed: [
      "classic-bloom",
      "lookbook-minimal",
      "magazine-bold",
      "bento-tech",
      "sidebar-storefront",
      "botanical-wellness",
    ],
    customDomain: true,
    maxBanners: 20,
    description: "For established businesses demanding scale, custom domains & luxury aesthetics.",
    features: [
      "Unlimited products & variants",
      "Every designer template, including Lookbook, Split Magazine & Sidebar",
      "Custom domain support (e.g. www.yourshop.in / .com)",
      "Unlimited promotional banners & sliders",
      "Remove 'Powered by shoppersite' watermark",
      "Advanced customer insights & analytics",
      "Priority 24/7 dedicated WhatsApp support",
    ],
  },
};

export function canAddProduct(currentCount: number, planId: string = "free"): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const plan = PLATFORM_PLANS[planId] || PLATFORM_PLANS.free;
  const limit = plan.maxProducts;
  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: currentCount < limit,
    limit,
    remaining,
  };
}

const TIER_RANK = { free: 0, starter: 1, pro: 2 } as const;

export function isThemeAllowed(themeSlug: string, planId: string = "free"): boolean {
  const plan = PLATFORM_PLANS[planId] || PLATFORM_PLANS.free;
  if (plan.themesAllowed.includes(themeSlug)) return true;
  // Templates uploaded by the admin open up by tier: Growth gets free + starter ones, Pro gets all
  const uploaded = getUploadedTheme(themeSlug);
  return Boolean(uploaded && TIER_RANK[uploaded.tier] <= TIER_RANK[plan.tier]);
}

export function isPaidPlan(planId: string = "free"): boolean {
  return planId === "starter" || planId === "pro";
}

export function canUseReviews(planId: string = "free"): boolean {
  return isPaidPlan(planId);
}

