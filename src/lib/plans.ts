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
  priceYearly?: number; // in paise
  priceYearlyFormatted?: string;
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
    priceYearly: 299000,
    priceYearlyFormatted: "₹2,990 / year",
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
    priceYearly: 999000,
    priceYearlyFormatted: "₹9,990 / year",
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

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export interface BillingCycleOption {
  id: BillingCycle;
  label: string;
  shortLabel: string;
  months: number;
  discountPercent: number;
  tag: string;
}

export const BILLING_CYCLES: BillingCycleOption[] = [
  { id: "monthly", label: "Billed Monthly", shortLabel: "Monthly", months: 1, discountPercent: 0, tag: "" },
  { id: "quarterly", label: "Billed Quarterly", shortLabel: "Quarterly", months: 3, discountPercent: 5, tag: "Save 5%" },
  { id: "yearly", label: "Billed Annually", shortLabel: "Annually", months: 12, discountPercent: 10, tag: "Save 10%" },
];

export interface PlanPricingBreakdown {
  totalPaise: number;
  totalRupees: number;
  monthlyEquivalentRupees: number;
  discountPercent: number;
  savedRupees: number;
  cycleLabel: string;
  formattedTotal: string;
  formattedMonthly: string;
  billingText: string;
}

export function calculatePlanPrice(
  planId: string,
  cycle: BillingCycle = "monthly"
): PlanPricingBreakdown {
  const plan = PLATFORM_PLANS[planId] || PLATFORM_PLANS.free;
  if (plan.priceMonthly === 0) {
    return {
      totalPaise: 0,
      totalRupees: 0,
      monthlyEquivalentRupees: 0,
      discountPercent: 0,
      savedRupees: 0,
      cycleLabel: "Free forever",
      formattedTotal: "₹0",
      formattedMonthly: "₹0",
      billingText: "Free forever",
    };
  }

  const cycleConfig = BILLING_CYCLES.find((c) => c.id === cycle) || BILLING_CYCLES[0];
  const months = cycleConfig.months;
  const discountPercent = cycleConfig.discountPercent;

  const baseMonthlyRupees = plan.priceMonthly / 100;
  const rawBaseTotal = baseMonthlyRupees * months;
  const discountedTotal = Math.round(rawBaseTotal * (1 - discountPercent / 100));
  const totalPaise = discountedTotal * 100;
  const monthlyEquivalentRupees = Math.round(discountedTotal / months);
  const savedRupees = rawBaseTotal - discountedTotal;

  let billingText = "Billed monthly";
  if (cycle === "quarterly") {
    billingText = `Billed quarterly (₹${discountedTotal.toLocaleString("en-IN")}/3 mos · Save 5%)`;
  } else if (cycle === "yearly") {
    billingText = `Billed annually (₹${discountedTotal.toLocaleString("en-IN")}/yr · Save 10%)`;
  }

  return {
    totalPaise,
    totalRupees: discountedTotal,
    monthlyEquivalentRupees,
    discountPercent,
    savedRupees,
    cycleLabel: cycleConfig.label,
    formattedTotal: `₹${discountedTotal.toLocaleString("en-IN")}`,
    formattedMonthly: `₹${monthlyEquivalentRupees.toLocaleString("en-IN")}`,
    billingText,
  };
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

