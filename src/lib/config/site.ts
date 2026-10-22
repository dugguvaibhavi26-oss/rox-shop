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
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "shopper.site",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  description: "The modern store builder for Indian social sellers.",

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
