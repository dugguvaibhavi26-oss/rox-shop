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
  name: process.env.NEXT_PUBLIC_APP_NAME || "shoppersite",
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
 * The store name when `host` is a store's own address, e.g. "roxtenn" for roxtenn.shopper.in or
 * roxtenn.localhost. Any other host (the main domain, www, or a deployment URL such as
 * something.vercel.app) belongs to the main app and returns null.
 */
export function getStoreSubdomainFromHost(host: string): string | null {
  const hostname = host.replace(/:\d+$/, "").toLowerCase();
  const suffixes = [`.${siteConfig.domain}`, ".localhost"];
  for (const suffix of suffixes) {
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      return sub && sub !== "www" && !sub.includes(".") ? sub : null;
    }
  }
  return null;
}

/**
 * Where a store opens, judged from the address the app is running at (`appUrl`):
 * - on the company domain: "https://storename.shopper.in"
 * - on localhost: "http://storename.localhost:3000", so subdomains can be tried locally
 * - anywhere else (e.g. a vercel.app deployment, where *.shopper.in isn't connected): "/s/storename"
 * `path` is appended as-is (e.g. "/products/tee" or "?view=cart").
 */
export function resolveStoreUrl(subdomain: string, path: string, appUrl: string): string {
  try {
    const app = new URL(appUrl);
    const host = app.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
      return `${app.protocol}//${subdomain}.localhost${app.port ? `:${app.port}` : ""}${path}`;
    }
    if (host === siteConfig.domain || host.endsWith(`.${siteConfig.domain}`)) {
      return `https://${getStoreDomain(subdomain)}${path}`;
    }
  } catch {
    // fall through to the path form
  }
  return `/s/${subdomain}${path}`;
}

/** The address a store opens at from wherever the app is currently running. */
export function getStoreUrl(subdomain: string, path = ""): string {
  const appUrl = typeof window !== "undefined" ? window.location.href : siteConfig.url;
  return resolveStoreUrl(subdomain, path, appUrl);
}

