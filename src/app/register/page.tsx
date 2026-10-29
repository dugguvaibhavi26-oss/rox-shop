"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { storeService } from "@/lib/store-service";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Store,
  Sparkles,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Globe,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Layers,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function RegisterStorePage() {
  const router = useRouter();
  const { user, signUp } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storeName, setStoreName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [category, setCategory] = useState("Fashion & Apparel");
  const [tagline, setTagline] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [upiId, setUpiId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSubdomain, setCreatedSubdomain] = useState("");

  // Autofill user credentials if logged in
  useEffect(() => {
    if (user) {
      if (!ownerName && user.displayName) setOwnerName(user.displayName);
      if (!contactEmail && user.email) setContactEmail(user.email);
    }
  }, [user, ownerName, contactEmail]);

  // Auto-generate subdomain from store name
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    if (!subdomain || subdomain === storeName.toLowerCase().replace(/[^a-z0-9]/g, "")) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 30);
      setSubdomain(slug);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !subdomain || !ownerName || !contactPhone || !upiId) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!user) {
      if (!contactEmail) {
        alert("Please provide a valid email address for your merchant account.");
        return;
      }
      if (!accountPassword || accountPassword.length < 6) {
        alert("Please create a password with at least 6 characters for your merchant account.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let activeUser = user;
      if (!activeUser) {
        activeUser = await signUp(contactEmail, accountPassword, ownerName);
      }

      const cleanSub = subdomain.toLowerCase().trim();
      const newStore = storeService.registerStore({
        name: storeName,
        subdomain: cleanSub,
        category,
        ownerName,
        contactPhone,
        contactEmail: contactEmail || activeUser.email || undefined,
        upiId: upiId.trim(),
        tagline: tagline || `Welcome to ${storeName}`,
        ownerId: activeUser.uid,
        ownerEmail: activeUser.email || contactEmail || undefined,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("shopper_active_store", newStore.subdomain);
      }

      setCreatedSubdomain(newStore.subdomain);
      setStep(3);
    } catch (err: any) {
      console.error("Store registration error:", err);
      alert(err.message || "Failed to create store. Subdomain might be taken or account error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#111111]">
              Shopper
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#71717A] hidden sm:inline">Already have a store?</span>
            <Link href="/login">
              <Button size="sm" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wizard Form */}
      <main className="flex-1 max-w-xl mx-auto px-4 py-10 w-full">
        {step < 3 && (
          <div className="text-center mb-8">
            <Badge variant="neutral" className="mb-2 text-xs font-medium">
              Instant Online Store Setup (Free Tier)
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
              Launch Your Shop in 60 Seconds
            </h1>
            <p className="text-xs sm:text-sm text-[#71717A] mt-1.5">
              Get your custom subdomain, direct UPI checkout, and start selling with zero platform commission.
            </p>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                  step === 1 ? "bg-[#111111] text-white" : "bg-[#16A34A] text-white"
                }`}
              >
                1
              </div>
              <div className="w-12 h-0.5 bg-[#E5E5E5]" />
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                  step === 2
                    ? "bg-[#111111] text-white"
                    : "bg-[#F4F4F5] text-[#A1A1AA] border border-[#E4E4E7]"
                }`}
              >
                2
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Store Profile & Subdomain */}
        {step === 1 && (
          <div className="p-6 sm:p-8 rounded-lg bg-white border border-[#E5E5E5] shadow-sm space-y-5">
            <h2 className="text-base font-bold text-[#111111]">Step 1: Your Shop Details</h2>

            <div>
              <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                Store / Brand Name *
              </label>
              <Input
                placeholder="e.g. Lume Apparel"
                value={storeName}
                onChange={(e) => handleStoreNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                Your Free Live Web Address *
              </label>
              <div className="flex items-center rounded-md border border-[#D4D4D8] overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#111111]">
                <input
                  type="text"
                  placeholder="yourstorename"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))
                  }
                  className="flex-1 px-3.5 py-2.5 text-xs text-[#111111] font-mono focus:outline-none"
                  required
                />
                <span className="px-3.5 py-2.5 bg-[#F4F4F5] text-xs font-bold text-[#71717A] border-l border-[#E4E4E7]">
                  .{siteConfig.domain}
                </span>
              </div>
              <p className="text-[11px] text-[#71717A] mt-1">
                Preview: <span className="text-[#111111] font-semibold">{subdomain || "yourshop"}.{siteConfig.domain}</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                Primary Business Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-md border border-[#D4D4D8] text-xs text-[#18181B] bg-white focus:outline-none focus:ring-2 focus:ring-[#111111]"
              >
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Footwear & Accessories">Footwear & Accessories</option>
                <option value="Handicrafts & Jewellery">Handicrafts & Jewellery</option>
                <option value="Beauty & Skincare">Beauty, Cosmetics & Skincare</option>
                <option value="Home & Living">Home Decor & Living</option>
                <option value="Gourmet & Organic Foods">Sweets, Spices & Organic Food</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                Tagline or Slogan (Optional)
              </label>
              <Input
                placeholder="e.g. Style That Moves With You"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <Button
              className="w-full mt-4 bg-[#111111] hover:bg-[#27272A] text-white"
              onClick={() => {
                if (!storeName.trim() || !subdomain.trim()) {
                  alert("Please provide both your store name and desired domain.");
                  return;
                }
                setStep(2);
              }}
            >
              <span>Continue to Payment Setup</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* STEP 2: Owner Contact & Direct UPI */}
        {step === 2 && (
          <form
            onSubmit={handleCreateStore}
            className="p-6 sm:p-8 rounded-lg bg-white border border-[#E5E5E5] shadow-sm space-y-5"
          >
            <h2 className="text-base font-bold text-[#111111]">
              Step 2: Owner & Direct Payment Setup
            </h2>

            {user ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
                <span>Logged in as <strong>{user.email}</strong></span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">Verified Seller</span>
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-600">
                <span>Creating this store will automatically establish your secure merchant account for logging into the Seller Dashboard.</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                Owner / Merchant Name *
              </label>
              <Input
                placeholder="e.g. Ramesh Chandra"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                  WhatsApp Mobile No. *
                </label>
                <Input
                  placeholder="+91 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                  Merchant Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="seller@yourbrand.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  disabled={!!user}
                />
              </div>
            </div>

            {!user && (
              <div>
                <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                  Create Seller Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="pr-9 text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#71717A] mt-1">
                  You will use this password to sign in to your Seller Dashboard anytime.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#3F3F46] block mb-1">
                Your Direct UPI ID (for receiving buyer payments) *
              </label>
              <Input
                placeholder="e.g. ramesh@okhdfcbank or 9876543210@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
              />
              <p className="text-[11px] text-[#71717A] mt-1 flex items-start gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#111111] shrink-0 mt-0.5" />
                <span>In accordance with RBI aggregator guidelines, Shopper never holds or pools your buyer payments. All UPI payments go 100% directly into your bank account.</span>
              </p>
            </div>

            {/* Plan inclusions preview */}
            <div className="p-4 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] text-xs text-[#18181B] space-y-1.5">
              <span className="font-bold block text-[#111111]">Included on Free Tier:</span>
              <div className="flex items-center gap-1.5 text-[#52525B]">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>10 Products catalog capacity</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#52525B]">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Default Lume Editorial theme</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#52525B]">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Direct UPI QR & Cash on Delivery (COD)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#52525B]">
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Instant order notification via WhatsApp</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/3"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="w-2/3 bg-[#111111] hover:bg-[#27272A] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Launching Shop..." : "Launch My Store Free"}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Celebration & Instant Links */}
        {step === 3 && (
          <div className="p-8 rounded-lg bg-white border border-[#E5E5E5] shadow-sm text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div>
              <Badge variant="success" className="mb-2 text-xs">
                Store Live on Internet
              </Badge>
              <h2 className="text-2xl font-bold text-[#111111]">
                Congratulations, {storeName}!
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] mt-1">
                Your online storefront has been created with starter products, direct UPI payment, and the default theme.
              </p>
            </div>

            {/* Store URL Box */}
            <div className="p-4 rounded-md bg-[#F4F4F5] border border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div>
                <span className="text-[11px] text-[#71717A] block font-bold uppercase">Your Store Web Address</span>
                <span className="text-sm font-mono font-bold text-[#111111]">
                  https://{createdSubdomain}.{siteConfig.domain}
                </span>
              </div>
              <Link href={`/s/${createdSubdomain}`} target="_blank">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <span>Open Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Link href={`/dashboard?store=${createdSubdomain}`}>
                <Button size="lg" className="w-full bg-[#111111] hover:bg-[#27272A] text-white gap-2 shadow-xs">
                  <span>Go to Seller Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `We just launched our online store! Browse our catalog here: https://${createdSubdomain}.${siteConfig.domain}`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="lg" variant="secondary" className="w-full bg-[#16A34A] text-white hover:bg-[#15803D] gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Share on WhatsApp</span>
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-[#64748B]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Shopper ({siteConfig.domain}). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              RBI Aggregator Compliant
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
