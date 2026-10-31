import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { siteConfig, getStoreDomain, getStoreUrl } from "@/lib/config/site";

describe("Configuration & Security Settings", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads placeholder defaults for brand name and domain", () => {
    expect(siteConfig.name).toBe("Shopper");
    expect(siteConfig.domain).toBe("shopper.in");
    expect(siteConfig.currency).toBe("INR");
    expect(siteConfig.maxStorefrontJsKb).toBe(150);
  });

  it("gives every store its own subdomain of the company domain", () => {
    expect(getStoreDomain("roxten")).toBe("roxten.shopper.in");
  });

  it("opens stores on their subdomain, using *.localhost when the app runs locally", () => {
    const appUrl = siteConfig.url;
    try {
      siteConfig.url = "https://shopper.in";
      expect(getStoreUrl("roxten")).toBe("https://roxten.shopper.in");
      expect(getStoreUrl("roxten", "/products/tee")).toBe("https://roxten.shopper.in/products/tee");

      siteConfig.url = "http://localhost:3000";
      expect(getStoreUrl("roxten")).toBe("http://roxten.localhost:3000");
      expect(getStoreUrl("roxten", "?view=cart")).toBe("http://roxten.localhost:3000?view=cart");
    } finally {
      siteConfig.url = appUrl;
    }
  });

  it("crashes startup if ALLOW_DEV_MOCK_OTP is enabled in production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.ALLOW_DEV_MOCK_OTP = "true";

    await expect(async () => {
      // Re-importing site config dynamically to simulate app boot
      await import("@/lib/config/site");
    }).rejects.toThrow(/FATAL CONFIGURATION ERROR/);
  });
});
