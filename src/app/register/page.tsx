"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { storeService } from "@/lib/store-service";
import { siteConfig, getStoreUrl } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import {
  AuthShell,
  AuthHeading,
  AuthInput,
  AuthButton,
  PasswordToggle,
  AuthFallback,
  CollageShowcase,
} from "@/components/auth/auth-shell";
import { MOCK_PRODUCTS, unsplash } from "@/components/home/mockups";
import {
  Store,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Lock,
  Mail,
  User,
  Phone,
  QrCode,
  Check,
  ChevronDown,
  Search,
  ShoppingBag,
} from "lucide-react";

const CATEGORIES = [
  { value: "Fashion & Apparel", label: "Fashion & Apparel" },
  { value: "Footwear & Accessories", label: "Footwear & Accessories" },
  { value: "Handicrafts & Jewellery", label: "Handicrafts & Jewellery" },
  { value: "Beauty & Skincare", label: "Beauty, Cosmetics & Skincare" },
  { value: "Home & Living", label: "Home Decor & Living" },
  { value: "Gourmet & Organic Foods", label: "Sweets, Spices & Organic Food" },
];

export default function RegisterStorePage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <RegisterStoreContent />
    </Suspense>
  );
}

function RegisterStoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signUp } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storeName, setStoreName] = useState("");
  // Prefill from the home page "claim your shop" form (?subdomain=)
  const [subdomain, setSubdomain] = useState(
    () => (searchParams.get("subdomain") || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30)
  );
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
    <AuthShell
      topLink={{ text: "Already have a store?", label: "Log in", href: "/login" }}
      aside={<StorePreview storeName={storeName} subdomain={subdomain} tagline={tagline} category={category} live={step === 3} />}
    >
      {step < 3 && (
        <>
          <StepIndicator step={step} />
          <AuthHeading
            title={step === 1 ? "Name your shop." : "Set up payments."}
            text={
              step === 1
                ? "Pick a name and web address. You can change everything later."
                : "Tell buyers how to reach you and where to send their payments."
            }
          />
        </>
      )}

      {/* STEP 1: Store Profile & Subdomain */}
      {step === 1 && (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!storeName.trim() || !subdomain.trim()) {
              alert("Please provide both your store name and desired domain.");
              return;
            }
            setStep(2);
          }}
        >
          <AuthInput
            label="Store / brand name"
            icon={Store}
            placeholder="e.g. Lume Apparel"
            value={storeName}
            onChange={(e) => handleStoreNameChange(e.target.value)}
            autoFocus
            required
          />

          <AuthInput
            label="Your free web address"
            placeholder="yourstore"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
            suffix={`.${siteConfig.domain}`}
            hint={
              <>
                Your store will be live at{" "}
                <span className="font-semibold text-black">
                  {subdomain || "yourshop"}.{siteConfig.domain}
                </span>
              </>
            }
            required
          />

          <div>
            <label htmlFor="category" className="block text-sm font-semibold mb-2">
              What do you sell?
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 appearance-none rounded-[12px] border border-neutral-300 bg-white px-4 pr-10 text-[15px] focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <AuthInput
            label="Tagline (optional)"
            placeholder="e.g. Style That Moves With You"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />

          <AuthButton type="submit" className="!mt-7">
            Continue
            <ArrowRight className="w-4 h-4" />
          </AuthButton>
        </form>
      )}

      {/* STEP 2: Owner Contact & Direct UPI */}
      {step === 2 && (
        <form onSubmit={handleCreateStore} className="space-y-5">
          {user ? (
            <div className="p-3.5 rounded-[12px] bg-neutral-100 text-sm flex items-center justify-between gap-3">
              <span className="truncate">
                Logged in as <strong>{user.email}</strong>
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold bg-black text-white px-2 py-1 rounded-[7px]">
                <Check className="w-3 h-3" />
                Verified
              </span>
            </div>
          ) : (
            <p className="p-3.5 rounded-[12px] bg-neutral-100 text-sm text-neutral-600">
              We&apos;ll create your seller account with these details so you can log in to your dashboard.
            </p>
          )}

          <AuthInput
            label="Your name"
            icon={User}
            autoComplete="name"
            placeholder="e.g. Ramesh Chandra"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AuthInput
              label="WhatsApp number"
              icon={Phone}
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />
            <AuthInput
              label="Email"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@yourbrand.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              disabled={!!user}
            />
          </div>

          {!user && (
            <AuthInput
              label="Create a password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
              hint="You'll use this to log in to your seller dashboard."
              required
            />
          )}

          <AuthInput
            label="UPI ID for payments"
            icon={QrCode}
            placeholder="e.g. ramesh@okhdfcbank"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            hint={
              <span className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-black" />
                Buyers pay you directly. {siteConfig.name} never holds or pools your money.
              </span>
            }
            required
          />

          <div className="rounded-[12px] border border-neutral-200 p-4">
            <span className="text-sm font-semibold">Included free</span>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-neutral-600">
              {["10 products", "Lume Editorial theme", "UPI QR & Cash on Delivery", "WhatsApp order alerts"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-black shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 !mt-7">
            <AuthButton type="button" variant="outline" className="!w-auto px-5" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </AuthButton>
            <AuthButton type="submit" loading={isSubmitting} loadingText="Launching your shop…" className="flex-1">
              Launch my store
              <ArrowRight className="w-4 h-4" />
            </AuthButton>
          </div>
        </form>
      )}

      {/* STEP 3: Celebration & Instant Links */}
      {step === 3 && (
        <div>
          <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center">
            <CheckCircle className="w-7 h-7" />
          </div>
          <AuthHeading
            title={`${storeName} is live!`}
            text="Your store is ready with starter products, UPI checkout and the Lume Editorial theme."
          />

          <div className="rounded-[12px] border border-neutral-200 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-xs text-neutral-500">Your store address</span>
              <span className="block text-sm font-semibold truncate">
                {createdSubdomain}.{siteConfig.domain}
              </span>
            </div>
            <Link
              href={getStoreUrl(createdSubdomain)}
              target="_blank"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-neutral-300 text-sm font-semibold hover:border-black transition-colors"
            >
              Open
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            <AuthButton type="button" onClick={() => router.push(`/dashboard?store=${createdSubdomain}`)}>
              Go to my dashboard
              <ArrowRight className="w-4 h-4" />
            </AuthButton>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `We just launched our online store! Browse our catalog here: https://${createdSubdomain}.${siteConfig.domain}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full h-12 rounded-[14px] border border-neutral-300 text-[15px] font-semibold inline-flex items-center justify-center gap-2 hover:border-black transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Share on WhatsApp
            </a>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center gap-3 text-xs font-semibold">
      <span className="text-neutral-500">Step {step} of 2</span>
      <div className="flex-1 flex gap-1.5">
        {[1, 2].map((s) => (
          <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors", s <= step ? "bg-black" : "bg-neutral-200")} />
        ))}
      </div>
    </div>
  );
}

/** Live storefront preview that updates as the seller types. */
function StorePreview({
  storeName,
  subdomain,
  tagline,
  category,
  live,
}: {
  storeName: string;
  subdomain: string;
  tagline: string;
  category: string;
  live: boolean;
}) {
  const name = storeName.trim() || "Your Store";
  return (
    <CollageShowcase
      intro={
        <>
          <h2 className="text-4xl xl:text-5xl [@media(max-height:760px)]:text-3xl font-semibold leading-[1.05]">
            {live ? "Your shop is open." : "See your shop take shape."}
          </h2>
          {/* quick facts, styled like the grid boxes behind them */}
          <div className="mt-7 grid grid-cols-3 gap-3 max-w-md [@media(max-height:700px)]:hidden">
            {[
              { value: "60s", label: "to go live" },
              { value: "0%", label: "commission" },
              { value: "₹0", label: "to start" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[12px] border border-white/15 bg-white/[0.05] backdrop-blur-sm px-4 py-3.5 transition-colors duration-300 hover:bg-white/10 hover:border-white/30"
              >
                <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="mt-0.5 text-xs text-white/55">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      }
    >
      <div className="relative h-full max-h-[440px] w-full max-w-[460px] mx-auto flex flex-col">
        {/* floating cards overlapping the preview's corners */}
        <div className="absolute -top-6 -right-6 sm:-right-10 z-10 animate-float-gentle rounded-[12px] bg-white text-black shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)] px-3.5 py-2.5 flex items-center gap-2.5" style={{ rotate: "4deg" }}>
          <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </span>
          <span>
            <span className="block text-[10px] text-neutral-500">UPI received</span>
            <span className="block text-sm font-semibold">₹4,999</span>
          </span>
        </div>
        <div
          className="absolute -bottom-9 -left-8 sm:-left-14 z-10 animate-float-gentle rounded-[12px] bg-black text-white border border-white/20 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] px-3.5 py-2.5 flex items-center gap-2.5"
          style={{ rotate: "-4deg", animationDelay: "1.4s" }}
        >
          <img src={unsplash(MOCK_PRODUCTS[1].img, 80)} alt="" className="w-7 h-7 rounded-[6px] object-cover" />
          <span>
            <span className="block text-[10px] text-white/55">New order</span>
            <span className="block text-sm font-semibold">{MOCK_PRODUCTS[1].price}</span>
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-white text-black overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] transition-transform duration-500 hover:-translate-y-1 hover:rotate-[-0.5deg]">
          <div className="shrink-0 flex items-center gap-2 px-4 h-10 border-b border-neutral-200 bg-neutral-50">
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <span className="w-2 h-2 rounded-full bg-neutral-300" />
            <span className="ml-2 text-[11px] text-neutral-500 truncate">
              {subdomain || "yourshop"}.{siteConfig.domain}
            </span>
          </div>
          <div className="shrink-0 flex items-center justify-between px-6 h-12 border-b border-neutral-100">
            <span className="font-bold tracking-tight text-sm uppercase truncate max-w-[60%]">{name}</span>
            <div className="flex items-center gap-3 text-neutral-700">
              <Search className="w-3.5 h-3.5" />
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          {/* the banner takes whatever height is left, so the preview always fits the panel */}
          <div className="relative flex-1 min-h-28 overflow-hidden">
            <img src={unsplash("photo-1441986300917-64674bd600d8", 900)} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
            <div className="relative h-full flex flex-col justify-center px-5 text-white">
              <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">{category}</span>
              <span key={tagline + name} className="animate-in fade-in text-2xl font-bold tracking-tight mt-1 line-clamp-2">
                {tagline.trim() || `Welcome to ${name}`}
              </span>
            </div>
          </div>
          <div className="shrink-0 grid grid-cols-3 gap-3 p-4 [@media(max-height:700px)]:hidden">
            {MOCK_PRODUCTS.slice(0, 3).map((p) => (
              <div key={p.name} className="group/p">
                <div className="aspect-[4/3] rounded-[8px] overflow-hidden bg-neutral-100">
                  <img src={unsplash(p.img, 300)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover/p:scale-110" />
                </div>
                <div className="mt-1.5 text-[11px] font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-neutral-500">{p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollageShowcase>
  );
}
