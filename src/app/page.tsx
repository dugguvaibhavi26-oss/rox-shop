"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { siteConfig } from "@/lib/config/site";
import { PLATFORM_PLANS } from "@/lib/plans";
import { PLATFORM_THEMES } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Zap,
  Store,
  QrCode,
  CheckCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Palette,
  CreditCard,
  MessageCircle,
  Star
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [subdomainQuery, setSubdomainQuery] = useState("");

  const handleClaimStore = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = subdomainQuery.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!clean) {
      router.push("/register");
    } else {
      router.push(`/register?subdomain=${clean}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#111111]">
      {/* Navigation */}
      <header className="border-b border-[#E5E5E5] bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs">
              S
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#111111] block leading-none">
                {siteConfig.name}
              </span>
              <span className="text-[10px] text-[#71717A] font-mono">
                {siteConfig.domain}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#71717A]">
            <a href="#features" className="hover:text-[#111111] transition-colors">
              Features
            </a>
            <a href="#themes" className="hover:text-[#111111] transition-colors">
              Themes
            </a>
            <a href="#pricing" className="hover:text-[#111111] transition-colors">
              Plans & Pricing
            </a>
            <a href="#how-it-works" className="hover:text-[#111111] transition-colors">
              How It Works
            </a>
            <Link href="/gallery" className="hover:text-[#111111] transition-colors">
              Design System
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button size="sm" className="bg-[#111111] text-white hover:bg-[#27272A] text-xs shadow-xs">
                    My Dashboard
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs text-[#71717A] hover:text-[#111111] font-medium px-2 py-1"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="outline" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-[#111111] text-white hover:bg-[#27272A] text-xs shadow-xs">
                    Launch Free Shop
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center text-center">
        <Badge variant="neutral" className="mb-4 px-3 py-1 text-xs font-semibold gap-1.5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#111111]" />
          <span>Universal Multi-Tenant Store Platform Ready</span>
        </Badge>

        <h1 className="text-3xl sm:text-6xl font-bold text-[#111111] tracking-tight max-w-4xl leading-[1.12]">
          From Social Selling to a live store at{" "}
          <span className="text-[#111111] underline decoration-[#111111]/30 decoration-2 underline-offset-6">
            yourshop.{siteConfig.domain}
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-[#71717A] max-w-2xl leading-relaxed">
          The all-in-one store builder for modern creators and brands. Start free with up to 10 products and the Lume Editorial theme, then upgrade your subscription for unlimited catalogue growth, designer themes, and full order management.
        </p>

        {/* Interactive Subdomain Claim Form */}
        <div className="mt-8 w-full max-w-lg">
          <form
            onSubmit={handleClaimStore}
            className="p-1.5 sm:p-2 rounded-lg bg-white border border-[#E5E5E5] shadow-sm flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center w-full px-3 py-1 sm:py-0">
              <input
                type="text"
                placeholder="yourshopname"
                value={subdomainQuery}
                onChange={(e) =>
                  setSubdomainQuery(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))
                }
                className="w-full text-sm sm:text-base font-mono text-[#111111] placeholder-gray-400 focus:outline-none"
              />
              <span className="text-xs sm:text-sm font-bold text-[#71717A] shrink-0 font-mono">
                .{siteConfig.domain}
              </span>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto shrink-0 bg-[#111111] text-white hover:bg-[#27272A] shadow-xs"
            >
              <span>Claim Free Store</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <p className="text-[11px] text-[#71717A] mt-2 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Zero commission • Direct UPI to your bank • 100% Free Starter Plan</span>
          </p>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="mt-14 w-full text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Direct Commerce Workflow
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#111111] mt-1">
                How Shopper Powers Your Online Store
              </h3>
            </div>
            <Link href="/register">
              <Button size="sm" className="bg-[#111111] text-white hover:bg-[#27272A] text-xs">
                <span>Start Free Shop</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-lg bg-white border border-[#E5E5E5] shadow-xs hover:border-[#111111] transition-all space-y-3">
              <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-900">
                1
              </div>
              <h4 className="text-base font-bold text-[#111111]">
                Claim Custom Subdomain
              </h4>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Launch your branded online storefront at yourshop.{siteConfig.domain} in under 60 seconds without coding or technical setup.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-lg bg-white border border-[#E5E5E5] shadow-xs hover:border-[#111111] transition-all space-y-3">
              <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-900">
                2
              </div>
              <h4 className="text-base font-bold text-[#111111]">
                100% Direct UPI Settlements
              </h4>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Enter your UPI ID. Buyers scan dynamic QR codes at checkout, transferring money directly into your bank account with 0% platform take.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-lg bg-white border border-[#E5E5E5] shadow-xs hover:border-[#111111] transition-all space-y-3">
              <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-900">
                3
              </div>
              <h4 className="text-base font-bold text-[#111111]">
                Manage Orders & Drops
              </h4>
              <p className="text-xs text-[#71717A] leading-relaxed">
                Track payments, advance fulfillment states from Placed to Delivered, and broadcast instant Gmail drop announcements to your subscribers.
              </p>
            </div>
          </div>
        </div>

        {/* Core Architecture Highlights */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-xs">
            <div className="w-10 h-10 rounded-md bg-[#F4F4F5] text-[#111111] flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Zero Money Handling (RBI Compliant)</h3>
            <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
              We never pool or hold your money. Buyers scan your direct UPI QR or pay via COD. 100% of your earnings go straight to your bank account.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-xs">
            <div className="w-10 h-10 rounded-md bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Strict PostgreSQL Tenant RLS</h3>
            <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
              Every table enforces `FORCE ROW LEVEL SECURITY` with non-superuser app isolation. Zero cross-tenant data leakage guaranteed.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-xs">
            <div className="w-10 h-10 rounded-md bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Sub-150KB Lightning Fast</h3>
            <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
              Thin client JS, instant server rendering, and zero-runtime CSS tokens for silky-smooth 60-second checkouts over weak mobile connections.
            </p>
          </div>
        </div>

        {/* Themes Showcase Section */}
        <div id="themes" className="mt-20 w-full text-left">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="neutral" className="mb-2 text-xs font-medium">
              Curated Storefront Themes
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#111111] tracking-tight">
              A Universal Theme for Every Brand
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] mt-1.5">
              Sellers get Lume Editorial included free. Upgrading unlocks our curated collection of luxury, minimalist, and artisan themes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(PLATFORM_THEMES).map((theme) => (
              <div
                key={theme.slug}
                className="p-5 rounded-lg bg-white border border-[#E5E5E5] shadow-xs hover:border-[#111111] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-10 rounded-md overflow-hidden mb-3 border border-[#E5E5E5]">
                    {theme.previewColors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-[#111111]">{theme.name}</h4>
                    <Badge
                      className={`text-[10px] ${
                        theme.tier === "free"
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : theme.tier === "starter"
                          ? "bg-[#F4F4F5] text-[#18181B]"
                          : "bg-[#FEF3C7] text-[#B45309]"
                      } border-0 uppercase font-semibold`}
                    >
                      {theme.tier} Plan
                    </Badge>
                  </div>

                  <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F4F4F5] flex items-center justify-between text-xs">
                  <span className="text-[#A1A1AA] font-mono">slug: {theme.slug}</span>
                  <Link href={`/s/lume`} className="font-bold text-[#111111] hover:underline flex items-center gap-1">
                    <span>Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription & Pricing Tiers */}
        <div id="pricing" className="mt-20 w-full text-left">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="neutral" className="mb-2 text-xs font-medium">
              Transparent SaaS Plans
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#111111] tracking-tight">
              Start Free, Scale as You Grow
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] mt-1.5">
              Launch with our free tier (up to 10 products). Pay only a flat SaaS subscription fee when you're ready to expand. Zero transaction cuts!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(PLATFORM_PLANS).map((plan) => (
              <div
                key={plan.id}
                className={`p-6 sm:p-8 rounded-lg border flex flex-col justify-between ${
                  plan.highlight
                    ? "border-[#111111] bg-white shadow-md ring-1 ring-[#111111] relative"
                    : "border-[#E5E5E5] bg-white shadow-xs"
                }`}
              >
                <div>
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-md bg-[#111111] text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
                      Most Popular
                    </span>
                  )}
                  <h4 className="text-lg font-bold text-[#111111]">{plan.name}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#111111]">
                      {plan.priceFormatted.split(" ")[0]}
                    </span>
                    <span className="text-xs text-[#71717A]">/ month</span>
                  </div>
                  <p className="text-xs text-[#71717A] mt-2">{plan.description}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-[#F4F4F5] pt-5 text-xs text-[#3F3F46]">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-[#F4F4F5]">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className={`w-full text-xs shadow-xs rounded-md ${
                        plan.highlight
                          ? "bg-[#111111] text-white hover:bg-[#27272A]"
                          : "bg-[#F4F4F5] text-[#111111] hover:bg-[#E4E4E7]"
                      }`}
                    >
                      {plan.id === "free" ? "Start Free Today" : `Choose ${plan.name}`}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white py-8 text-center text-xs text-[#71717A]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-extrabold text-sm text-[#111111] block">{siteConfig.name}</span>
            <p className="text-xs text-[#71717A] mt-0.5">
              The universal multi-tenant social commerce platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/s/lume" className="hover:text-[#111111]">Live Storefront</Link>
            <span>•</span>
            <Link href="/login" className="hover:text-[#111111]">Seller Login</Link>
            <span>•</span>
            <Link href="/register" className="hover:text-[#111111]">Register Shop</Link>
            <span>•</span>
            <Link href="/gallery" className="hover:text-[#111111]">Design System</Link>
            <span>•</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Lead Admin</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
