/**
 * Site & Platform Configuration
 * Centralized place for brand name, domain, and security switches.
 */

// Production guard for Dev Mock OTP
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DEV_MOCK_OTP === "true"
) {
  throw new Error(
    "FATAL CONFIGURATION ERROR: ALLOW_DEV_MOCK_OTP cannot be set to 'true' in production mode. System startup aborted."
  );
}

export const siteConfig = {
  // Brand & Domain placeholders (overridable via environment variables)
  name: process.env.NEXT_PUBLIC_APP_NAME || "Shopper",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "shopper.in",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  description: "The modern store builder for Indian social sellers.",
  version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${process.env.NEXT_PUBLIC_APP_DOMAIN || "shopper.in"}`,

  // Help, legal and social links shown at the end of the seller dashboard.
  // Leave a value empty and its row shows "Soon" instead of linking anywhere.
  supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "", // digits with country code, e.g. 919876543210
  helpCenterUrl: process.env.NEXT_PUBLIC_HELP_CENTER_URL || "",
  legal: {
    terms: process.env.NEXT_PUBLIC_TERMS_URL || "",
    privacy: process.env.NEXT_PUBLIC_PRIVACY_URL || "",
    refunds: process.env.NEXT_PUBLIC_REFUND_POLICY_URL || "",
  },
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
    x: process.env.NEXT_PUBLIC_X_URL || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
  },

  // Dev OTP Mock configuration
  allowDevMockOtp:
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEV_MOCK_OTP === "true",
  devMockOtp: process.env.DEV_MOCK_OTP || "123456",

  // Target currency
  currency: "INR",
  currencySymbol: "₹",

  // Performance budget indicators
  maxStorefrontJsKb: 150,
  targetLcpSeconds: 2.5,

  // Plans config placeholders
  freePlanMaxProducts: 25,
  freePlanMaxStorageMb: 500,
};

export type SiteConfig = typeof siteConfig;

/**
 * Returns the public store domain e.g. "storename.shopper.in" or "storename.oursite.in"
 */
export function getStoreDomain(subdomain: string): string {
  const baseDomain = siteConfig.domain;
  return `${subdomain}.${baseDomain}`;
}

/**
 * Returns the address a store opens at: "https://storename.shopper.in" in production, or
 * "http://storename.localhost:3000" when the app itself runs on localhost, so subdomains
 * can be tried locally. `path` is appended as-is (e.g. "/products/tee" or "?view=cart").
 */
export function getStoreUrl(subdomain: string, path = ""): string {
  try {
    const app = new URL(siteConfig.url);
    if (app.hostname === "localhost" || app.hostname === "127.0.0.1") {
      return `${app.protocol}//${subdomain}.localhost${app.port ? `:${app.port}` : ""}${path}`;
    }
  } catch {
    // fall through to the public domain
  }
  return `https://${getStoreDomain(subdomain)}${path}`;
}

