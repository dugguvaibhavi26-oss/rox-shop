import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Smartphone, ShieldCheck, Zap, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-base shadow-xs">
              S
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#0F172A]">
              {siteConfig.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/gallery">
              <Button size="sm" variant="outline">
                Component Gallery
              </Button>
            </Link>
            <Link href="/gallery">
              <Button size="sm">
                Explore Design System
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
        <Badge variant="primary" className="mb-6 px-3 py-1 text-xs">
          Milestone 1 Completed: Foundation & Design System
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-black text-[#0F172A] tracking-tight max-w-3xl leading-[1.15]">
          The store builder designed for{" "}
          <span className="text-[#1E3A8A] underline decoration-[#D97706] decoration-4 underline-offset-6">
            Indian Social Sellers
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#64748B] max-w-2xl leading-relaxed">
          From Instagram DM to a live storefront in under 10 minutes. Zero commission, direct UPI & COD payments, and lightning-fast pages under 150 KB.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/gallery" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 shadow-md">
              <span>Open Interactive Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto"
          >
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              View Source & Tests
            </Button>
          </a>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-white shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Mobile-First 360px</h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              Every component and screen is designed thumb-friendly for 360 px width first with 44px minimum touch targets.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-white shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Strict PostgreSQL RLS</h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              Non-superuser app role with FORCE ROW LEVEL SECURITY. Zero cross-tenant leakage guaranteed.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-[#E2E8F0] bg-white shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Sub-150KB Budget</h3>
            <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
              Thin client JS, server components, and native CSS variables for instant 60-second buyer checkouts over weak 4G.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 {siteConfig.name} ({siteConfig.domain}). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/gallery" className="hover:text-[#0F172A]">Gallery</Link>
            <span>•</span>
            <span className="text-[#15803D] font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#15803D] inline-block" />
              WCAG 2.2 AA Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
