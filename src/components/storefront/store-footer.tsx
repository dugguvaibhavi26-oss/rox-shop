"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  QrCode,
  MessageCircle,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Lock,
  Heart,
  Sparkles,
} from "lucide-react";
import { storeService, StoreData, CustomBrandTheme } from "@/lib/store-service";
import { canUseEmail } from "@/lib/plans";
import { siteConfig } from "@/lib/config/site";

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface StoreFooterProps {
  store: StoreData;
  brandTheme?: CustomBrandTheme;
}

export function StoreFooter({ store, brandTheme: brandThemeProp }: StoreFooterProps) {
  const brandTheme: CustomBrandTheme = brandThemeProp || store.customBrandTheme || {
    primary: "#111111",
    background: "#FDFBF7",
    surface: "#FFFFFF",
  };

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const categories = store.categories?.filter((c) => c.isActive) || [];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    storeService.addSubscriber(store.subdomain, newsletterEmail.trim());
    setSubscribed(true);
    setNewsletterEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer
      style={{
        backgroundColor: brandTheme.surface,
        borderTopColor: "rgba(0,0,0,0.08)",
        color: brandTheme.primary,
      }}
      className="border-t mt-auto text-neutral-800 transition-colors"
    >
      {/* 1. Value Proposition Trust Strip */}
      <div className="border-b border-neutral-100 py-8 px-4 sm:px-6 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-900">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-neutral-900">
                Free Nationwide Shipping
              </h5>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                On all orders above ₹{(store.freeDeliveryThreshold / 100).toLocaleString("en-IN")}.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-900">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-neutral-900">
                100% Direct UPI Payments
              </h5>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Pay directly to seller's VPA. Zero gateway markups.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-900">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-neutral-900">
                7-Day Easy Exchange
              </h5>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Hassle-free size and fit exchanges at doorstep.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-900">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-neutral-900">
                Verified Social Merchant
              </h5>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Certified boutique store powered by {siteConfig.domain}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Multi-Column Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Brand Story & Profile (Span 2 on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-10 w-auto max-w-[150px] object-contain rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {store.name.charAt(0)}
                </div>
              )}
              <span
                style={{ color: brandTheme.primary }}
                className="text-2xl font-extrabold tracking-tight"
              >
                {store.name}
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed max-w-sm">
              {store.tagline ||
                "Modern design, curated quality, and timeless craftsmanship. Built for discerning lifestyle seekers."}
            </p>

            {/* Direct WhatsApp Concierge Button */}
            <div className="pt-2">
              <a
                href={`https://wa.me/${store.contactPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 transition-colors text-xs font-bold border border-[#25D366]/30"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Chat with {store.name} on WhatsApp</span>
              </a>
            </div>

            {/* Seller Contact Info */}
            <div className="space-y-1.5 pt-2 text-xs text-neutral-500">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>Customer Care: {store.contactPhone}</span>
              </p>
              {store.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Email: {store.contactEmail}</span>
                </p>
              )}
              {store.instagramHandle && (
                <p className="flex items-center gap-2">
                  <InstagramIcon className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Instagram: {store.instagramHandle}</span>
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Shop by Category */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
              Shop by Category
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <Link
                  href={`/s/${store.subdomain}`}
                  className="hover:text-black hover:underline transition-colors"
                >
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/s/${store.subdomain}/category/${cat.slug}`}
                    className="hover:text-black hover:underline transition-colors flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                    {typeof cat.itemCount === "number" && cat.itemCount > 0 && (
                      <span className="text-[10px] text-neutral-400">
                        {cat.itemCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li>
                <Link
                  href="/orders/tok_sh_lume_8899aabb"
                  className="hover:text-black hover:underline transition-colors flex items-center gap-1.5"
                >
                  <span>Track Your Order</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </Link>
              </li>
              <li>
                <span className="hover:text-black transition-colors cursor-pointer">
                  Shipping & Delivery Info
                </span>
              </li>
              <li>
                <span className="hover:text-black transition-colors cursor-pointer">
                  Returns & Size Exchanges
                </span>
              </li>
              <li>
                <span className="hover:text-black transition-colors cursor-pointer">
                  Direct UPI Payment Guide
                </span>
              </li>
              <li>
                <span className="hover:text-black transition-colors cursor-pointer">
                  Privacy Policy & Terms
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter (Pro, part of email integration) & Direct UPI Guarantee */}
          <div className="space-y-4">
            {canUseEmail(store.planId) ? (
              <>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Exclusive Perks
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Subscribe to hear about new drops first.
                </p>

                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:outline-none focus:border-neutral-900 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: brandTheme.primary, color: "#FFFFFF" }}
                    className="w-full py-2 px-3 rounded-md text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {subscribed && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thank you! You'll hear about new drops first.</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                  Direct Merchant Guarantee
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  100% authentic collections sourced and dispatched directly from verified independent creators.
                </p>
              </>
            )}

            {/* Direct UPI badge */}
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct VPA: {store.upiId}</span>
              </div>
              <p className="text-[10px] text-neutral-500">
                Direct buyer-to-seller transfers protected under RBI aggregator rules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Copyright Bar */}
      <div className="border-t border-neutral-200/80 py-6 px-4 sm:px-6 text-xs text-neutral-500 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-[11px]">
              © {new Date().getFullYear()} <span className="font-bold text-neutral-900">{store.name}</span>. All rights reserved.
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Secure Direct Commerce Platform • Powered by <span className="font-semibold text-neutral-700 capitalize">{siteConfig.domain}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-500 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono">
              BHIM UPI
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono">
              Google Pay
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono">
              PhonePe
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono">
              COD Available
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
