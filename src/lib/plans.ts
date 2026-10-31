import { getUploadedTheme } from "./themes";

export interface PlanFeature {
  id: string;
  name: string;
  tier: "free" | "starter" | "pro";
  priceMonthly: number; // in paise
  priceFormatted: string;
  /** Pre-discount price shown struck through, in paise */
  originalPriceMonthly?: number;
  originalPriceFormatted?: string;
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
    name: "Free",
    tier: "free",
    priceMonthly: 0,
    priceFormatted: "₹0 / month",
    maxProducts: 75,
    themesAllowed: ["classic-bloom"], // + free templates uploaded by the admin (Aurora Showroom)
    customDomain: false,
    maxBanners: 1,
    description: "Everything you need to start selling online today.",
    features: [
      "Up to 75 products",
      "2 themes",
      "Cash on Delivery (COD)",
      "Direct UPI payments",
      "Free subdomain (yourshop.shopersite.in)",
      "WhatsApp integration",
    ],
  },
  starter: {
    id: "starter",
    name: "Growth",
    tier: "starter",
    priceMonthly: 29900,
    priceFormatted: "₹299 / month",
    originalPriceMonthly: 49900,
    originalPriceFormatted: "₹499 / month",
    maxProducts: 200,
    themesAllowed: ["classic-bloom", "bento-tech", "botanical-wellness"],
    customDomain: false,
    maxBanners: 5,
    highlight: true,
    description: "Sell more with coupons, reviews and online payments.",
    features: [
      "Everything in Free",
      "Up to 200 products",
      "All Growth themes",
      "Discount coupons",
      "Customer reviews",
      "Payment gateway",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tier: "pro",
    priceMonthly: 99900,
    priceFormatted: "₹999 / month",
    originalPriceMonthly: 149900,
    originalPriceFormatted: "₹1,499 / month",
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
    description: "Run it like a business, on your own domain.",
    features: [
      "Everything in Growth",
      "Unlimited products",
      "Every premium theme",
      "Connect your own domain",
      "Automatic invoices to generate and download",
      "Email integration",
      "Your store as an Android app (APK)",
      "Priority WhatsApp support",
    ],
  },
};

/** Percentage saved against the original price, e.g. 40 for ₹499 → ₹299. */
export function planDiscountPercent(plan: PlanFeature): number {
  if (!plan.originalPriceMonthly || plan.originalPriceMonthly <= plan.priceMonthly) return 0;
  return Math.round((1 - plan.priceMonthly / plan.originalPriceMonthly) * 100);
}

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

/** Discount coupons: Growth and Pro. */
export function canUseCoupons(planId: string = "free"): boolean {
  return isPaidPlan(planId);
}

/** Email integration (Gmail alerts and the store newsletter): Pro only. */
export function canUseEmail(planId: string = "free"): boolean {
  return planId === "pro";
}

