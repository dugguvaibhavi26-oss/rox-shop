import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { siteConfig } from "@/lib/config/site";

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
    expect(siteConfig.domain).toBe("shopper.site");
    expect(siteConfig.currency).toBe("INR");
    expect(siteConfig.maxStorefrontJsKb).toBe(150);
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
