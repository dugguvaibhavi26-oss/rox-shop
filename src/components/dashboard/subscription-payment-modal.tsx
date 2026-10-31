"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Lock,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Smartphone,
  QrCode,
  Store,
  LayoutDashboard,
  Palette,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { PLATFORM_PLANS, PlanFeature, calculatePlanPrice, BILLING_CYCLES, type BillingCycle } from "@/lib/plans";
import { siteConfig } from "@/lib/config/site";
import { storeService, StoreData, SubscriptionRequest } from "@/lib/store-service";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: StoreData;
  initialPlanId?: "starter" | "pro";
  initialBillingCycle?: BillingCycle;
  onSuccess?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenSetupWizard?: () => void;
}

type ModalStep = "review" | "payment" | "verifying";

export function SubscriptionPaymentModal({
  isOpen,
  onClose,
  store,
  initialPlanId = "starter",
  initialBillingCycle = "monthly",
  onSuccess,
  onNavigateTab,
  onOpenSetupWizard,
}: SubscriptionPaymentModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<"starter" | "pro">(initialPlanId);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [step, setStep] = useState<ModalStep>("review");
  const [paymentUtr, setPaymentUtr] = useState("");
  const [utrError, setUtrError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<SubscriptionRequest | null>(
    store?.pendingSubscription || null
  );
  const [simulatingVerification, setSimulatingVerification] = useState(false);

  // If there is already a pending subscription for this store, show the verifying step by default
  useEffect(() => {
    if (store?.pendingSubscription) {
      setSubmittedRequest(store.pendingSubscription);
      setStep("verifying");
    } else {
      setSelectedPlanId(initialPlanId);
      setStep("review");
    }
  }, [isOpen, store?.pendingSubscription, initialPlanId]);

  if (!isOpen) return null;

  const currentPlan = PLATFORM_PLANS[selectedPlanId] || PLATFORM_PLANS.starter;
  const pricing = calculatePlanPrice(selectedPlanId, billingCycle);
  const amountRupees = pricing.totalRupees;
  // Strictly format to 2 decimal places so UPI apps receive a fixed, non-editable amount
  const fixedAmountStr = amountRupees.toFixed(2);

  const platformUpiId = siteConfig.platformUpiId || "shopper.pay@okicici";
  const platformMerchant = siteConfig.platformMerchantName || "Shopper Platforms India";
  const transactionRef = submittedRequest?.referenceId || `REF-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
  const transactionNote = `Sub ${currentPlan.name} - ${store.subdomain}`.slice(0, 48);

  // UPI deep link specification: &am=<fixed> locks the amount field in compliant UPI apps
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(platformUpiId)}&pn=${encodeURIComponent(
    platformMerchant
  )}&am=${fixedAmountStr}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${encodeURIComponent(
    transactionRef
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(platformUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(fixedAmountStr);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleOpenUpiApp = () => {
    // Open the UPI intent scheme on mobile/tablet devices
    window.location.href = upiPayUrl;
  };

  const handleSubmitPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUtr = paymentUtr.trim();

    if (cleanUtr && cleanUtr.length < 6) {
      setUtrError("Please enter a valid 12-digit UPI reference / UTR number.");
      return;
    }

    setUtrError("");
    const req = storeService.createSubscriptionPayment(store.subdomain, {
      planId: selectedPlanId,
      billingCycle,
      paymentUtr: cleanUtr || undefined,
      referenceId: transactionRef,
      payeeUpiId: platformUpiId,
    });

    setSubmittedRequest(req);
    setStep("verifying");
    if (onSuccess) onSuccess();
  };

  const handleSimulateInstantVerification = () => {
    setSimulatingVerification(true);
    setTimeout(() => {
      const res = storeService.verifySubscriptionPayment(store.subdomain);
      setSimulatingVerification(false);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    }, 1200);
  };

  const handleCancelPending = () => {
    if (confirm("Are you sure you want to cancel this pending subscription request?")) {
      storeService.cancelSubscriptionRequest(store.subdomain);
      setSubmittedRequest(null);
      setStep("review");
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-neutral-200 transition-all text-neutral-900 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Upgrade Subscription</h2>
              <p className="text-xs text-neutral-500">
                For store: <span className="font-semibold text-neutral-800">{store.name}</span> (
                <span className="font-mono text-[11px]">{store.subdomain}.{siteConfig.domain}</span>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progression Indicators */}
        <div className="border-b border-neutral-100 bg-neutral-50/70 px-6 py-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div
              className={`flex items-center gap-1.5 ${
                step === "review" ? "text-neutral-950 font-bold" : "text-emerald-700"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  step === "review"
                    ? "bg-neutral-900 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {step === "review" ? "1" : <Check className="h-3 w-3" />}
              </span>
              <span>1. Choose Plan</span>
            </div>
            <div className="h-px w-8 bg-neutral-200" />
            <div
              className={`flex items-center gap-1.5 ${
                step === "payment"
                  ? "text-neutral-950 font-bold"
                  : step === "verifying"
                  ? "text-emerald-700"
                  : "text-neutral-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  step === "payment"
                    ? "bg-neutral-900 text-white"
                    : step === "verifying"
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {step === "verifying" ? <Check className="h-3 w-3" /> : "2"}
              </span>
              <span>2. UPI Payment</span>
            </div>
            <div className="h-px w-8 bg-neutral-200" />
            <div
              className={`flex items-center gap-1.5 ${
                step === "verifying" ? "text-amber-800 font-bold" : "text-neutral-400"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  step === "verifying"
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                3
              </span>
              <span>3. Verification</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: REVIEW & PLAN SELECTION */}
          {step === "review" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Billing Cycle Toggle (Monthly, Quarterly save 5%, Annually save 10%) */}
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex flex-wrap items-center justify-center rounded-xl bg-neutral-100 p-1 text-xs font-semibold gap-1">
                  {BILLING_CYCLES.map((cycleOption) => {
                    const isCycleSelected = billingCycle === cycleOption.id;
                    return (
                      <button
                        key={cycleOption.id}
                        type="button"
                        onClick={() => setBillingCycle(cycleOption.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                          isCycleSelected
                            ? "bg-white text-neutral-900 shadow-xs"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        <span>{cycleOption.shortLabel}</span>
                        {cycleOption.tag && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                              cycleOption.id === "yearly"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {cycleOption.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier Cards Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(["starter", "pro"] as const).map((planKey) => {
                  const p = PLATFORM_PLANS[planKey];
                  const isSelected = selectedPlanId === planKey;
                  const cardPricing = calculatePlanPrice(planKey, billingCycle);

                  return (
                    <div
                      key={planKey}
                      onClick={() => setSelectedPlanId(planKey)}
                      className={`relative cursor-pointer rounded-2xl border p-4.5 transition-all ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-950 text-white shadow-lg ring-2 ring-neutral-950"
                          : "border-neutral-200 bg-white hover:border-neutral-300 text-neutral-900"
                      }`}
                    >
                      {p.highlight && (
                        <span
                          className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? "bg-amber-400 text-neutral-950"
                              : "bg-neutral-900 text-white"
                          }`}
                        >
                          Most Popular
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold">{p.name}</span>
                        <div
                          className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-amber-400 bg-amber-400 text-neutral-950"
                              : "border-neutral-300 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">
                          {cardPricing.formattedMonthly}
                        </span>
                        <span
                          className={`text-xs ${
                            isSelected ? "text-neutral-400" : "text-neutral-500"
                          }`}
                        >
                          /month
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[11px] ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                          {billingCycle === "monthly" ? "Billed monthly" : `Billed ${billingCycle === "quarterly" ? "quarterly" : "annually"} (${cardPricing.formattedTotal})`}
                        </span>
                        {cardPricing.discountPercent > 0 && (
                          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${isSelected ? "bg-amber-400 text-neutral-950" : "bg-emerald-100 text-emerald-800"}`}>
                            Save {cardPricing.discountPercent}%
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-1.5 text-xs line-clamp-2 ${
                          isSelected ? "text-neutral-300" : "text-neutral-600"
                        }`}
                      >
                        {p.description}
                      </p>

                      <ul className="mt-3.5 space-y-1.5 border-t pt-3 text-xs">
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-emerald-600"
                            }`}
                          />
                          <span>
                            {p.maxProducts >= 999999
                              ? "Unlimited products in catalog"
                              : `Up to ${p.maxProducts} products in catalog`}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-emerald-600"
                            }`}
                          />
                          <span>
                            {planKey === "pro"
                              ? "All 5+ designer templates"
                              : "3 designer themes (Bento, Botanical)"}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-amber-400" : "text-emerald-600"
                            }`}
                          />
                          <span>
                            {planKey === "pro"
                              ? "Custom domain support (yourbrand.in)"
                              : "Discount coupons & marketing banners"}
                          </span>
                        </li>
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary Box */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Billing Summary
                </span>
                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-700">
                    <span>
                      {currentPlan.name} ({pricing.cycleLabel})
                    </span>
                    <span className="font-semibold text-neutral-900 font-mono">
                      ₹{((currentPlan.priceMonthly / 100) * (billingCycle === "yearly" ? 12 : billingCycle === "quarterly" ? 3 : 1)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {pricing.savedRupees > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>{pricing.cycleLabel} Savings ({pricing.discountPercent}%)</span>
                      <span className="font-mono">-₹{pricing.savedRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-700">
                    <span className="inline-flex items-center gap-1">
                      <span>GST & Platform Processing Fees</span>
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                        Inclusive
                      </span>
                    </span>
                    <span className="font-semibold text-neutral-900">₹0.00</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-2 flex justify-between text-sm font-bold text-neutral-900">
                    <span>Total Payable:</span>
                    <span className="text-base text-emerald-700 font-mono">
                      {pricing.formattedTotal}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Proceed CTA */}
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="w-full h-12 rounded-xl bg-neutral-900 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md cursor-pointer hover:translate-y-[-1px]"
              >
                <span>Proceed to UPI Payment (₹{amountRupees.toLocaleString("en-IN")})</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: UPI PAYMENT (SCANNER + DIRECT UPI APP BUTTON WITH FIXED AMOUNT) */}
          {step === "payment" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Back to plan selection */}
              <button
                type="button"
                onClick={() => setStep("review")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Plan</span>
              </button>

              {/* Amount Fixed Banner */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-emerald-950 flex items-start gap-3">
                <Lock className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block text-sm">
                    Amount Locked: ₹{fixedAmountStr} (Non-Editable)
                  </span>
                  <span>
                    Per standard UPI protocol, the subscription charge is hardcoded to prevent
                    accidental overpayment or incorrect edits.
                  </span>
                </div>
              </div>

              {/* UPI Device Deep Link Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleOpenUpiApp}
                  className="w-full h-13 rounded-2xl bg-neutral-950 text-white font-bold text-sm inline-flex items-center justify-center gap-2.5 shadow-lg hover:bg-neutral-800 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Smartphone className="h-5 w-5 text-amber-400" />
                  <span>Pay with Installed UPI App</span>
                  <ExternalLink className="h-4 w-4 text-neutral-400" />
                </button>
                <p className="text-[11px] text-center text-neutral-500">
                  Opens Google Pay, PhonePe, Paytm, BHIM, or CRED directly on your phone with amount locked.
                </p>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Or Scan QR Code
                </span>
              </div>

              {/* QR Scanner Section */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-700 shadow-2xs border border-neutral-200">
                  <QrCode className="h-3.5 w-3.5 text-neutral-900" />
                  <span>Scan using any UPI App</span>
                </div>

                {/* QR Code Container */}
                <div className="mx-auto w-48 h-48 rounded-2xl border-2 border-neutral-200 bg-white p-3 shadow-sm flex items-center justify-center relative overflow-hidden group">
                  <img
                    src={qrCodeUrl}
                    alt={`UPI QR Code for ₹${fixedAmountStr}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Verified Merchant & Copy Controls */}
                <div className="space-y-1.5 max-w-sm mx-auto text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-white border border-neutral-200 px-3 py-2">
                    <span className="text-neutral-500">UPI ID:</span>
                    <span className="font-mono font-semibold text-neutral-900 truncate mx-2">
                      {platformUpiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 hover:text-black shrink-0"
                    >
                      {copiedUpi ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedUpi ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white border border-neutral-200 px-3 py-2">
                    <span className="text-neutral-500">Exact Amount:</span>
                    <span className="font-mono font-bold text-neutral-900">₹{fixedAmountStr}</span>
                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 hover:text-black shrink-0"
                    >
                      {copiedAmount ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedAmount ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirmation / UTR Entry */}
              <form onSubmit={handleSubmitPayment} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800 block">
                    12-digit UPI Reference / UTR Number (from your payment app):
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="e.g. 428919283741"
                    value={paymentUtr}
                    onChange={(e) => {
                      setPaymentUtr(e.target.value.replace(/[^0-9a-zA-Z]/g, ""));
                      setUtrError("");
                    }}
                    className="w-full h-11 rounded-xl border border-neutral-300 px-3.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-neutral-950"
                  />
                  {utrError && <p className="text-xs text-rose-600 font-medium">{utrError}</p>}
                  <p className="text-[11px] text-neutral-500">
                    Found in your UPI app receipt or SMS as &quot;Bank Ref / UTR / Transaction ID&quot;.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>I Have Paid — Submit for Verification</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: VERIFICATION IN PROGRESS (Reassurance + "You can quit now" + Productive options) */}
          {step === "verifying" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Radar Status Badge */}
              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 text-center space-y-3">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
                  <Clock className="h-8 w-8 animate-spin-slow" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600" />
                  </span>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Verification Underway</span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
                    Payment Submitted for Verification
                  </h3>
                </div>

                {/* Prominent "You can quit now" Alert Box */}
                <div className="rounded-2xl border border-amber-300/80 bg-white p-4 text-left space-y-1.5 text-xs text-neutral-800 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>You can safely quit or close this window now</span>
                  </div>
                  <p className="leading-relaxed text-neutral-600 pl-6">
                    Bank verification and automated reconciliation may take up to{" "}
                    <b className="text-neutral-900">1–2 hours</b> during peak banking hours. You don&apos;t
                    need to wait on this screen — your plan limits and features will activate
                    automatically the moment verification clears.
                  </p>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left pt-1">
                  <div className="rounded-xl bg-white border border-neutral-200/80 p-2.5">
                    <span className="block text-[10px] text-neutral-500 uppercase">Plan</span>
                    <span className="font-bold text-xs truncate block text-neutral-900">
                      {submittedRequest?.planName || currentPlan.name}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-neutral-200/80 p-2.5">
                    <span className="block text-[10px] text-neutral-500 uppercase">Amount</span>
                    <span className="font-bold text-xs font-mono text-emerald-700 block">
                      {submittedRequest?.amountFormatted || `₹${fixedAmountStr}`}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white border border-neutral-200/80 p-2.5 col-span-2 sm:col-span-1">
                    <span className="block text-[10px] text-neutral-500 uppercase">Reference</span>
                    <span className="font-mono font-bold text-xs truncate block text-neutral-900">
                      {submittedRequest?.referenceId || transactionRef}
                    </span>
                  </div>
                </div>

                {submittedRequest?.paymentUtr && (
                  <p className="text-[11px] text-neutral-500 text-left font-mono">
                    Bank UTR: <span className="font-semibold text-neutral-800">{submittedRequest.paymentUtr}</span>
                  </p>
                )}
              </div>

              {/* "While you wait: explore and stay productive" */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold tracking-tight text-neutral-900">
                    What you can do while we verify:
                  </h4>
                  <span className="text-xs text-neutral-500">Pick any task</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Setup store */}
                  <div
                    onClick={() => {
                      onClose();
                      if (onOpenSetupWizard) onOpenSetupWizard();
                      else if (onNavigateTab) onNavigateTab("settings");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-105">
                      <Store className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Complete Store Setup
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Add store logo, shipping rates, and WhatsApp number.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Option 2: Explore Dashboard */}
                  <div
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) onNavigateTab("overview");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-transform group-hover:scale-105">
                      <LayoutDashboard className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Explore Dashboard
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Check live orders, view stats, and configure alerts.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Option 3: Designer themes */}
                  <div
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) onNavigateTab("themes");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                      <Palette className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Browse Designer Themes
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Preview Bento Tech, Kyoto Botanical, and Lookbook.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Option 4: Add Products */}
                  <div
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) onNavigateTab("products");
                    }}
                    className="group cursor-pointer rounded-2xl border border-neutral-200 p-3.5 transition-all hover:border-neutral-950 hover:bg-neutral-50 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                      <Package className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-neutral-900 group-hover:text-black">
                        Draft & Organize Products
                      </span>
                      <span className="block text-[11px] text-neutral-500 line-clamp-2">
                        Add photos, organize categories, and set stock counts.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-neutral-900 transition-all shrink-0 mt-1" />
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Dev Sandbox Helper */}
              <div className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-neutral-900 text-white font-semibold text-xs hover:bg-black transition-colors"
                >
                  Close & Return to Dashboard
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelPending}
                    className="text-xs text-neutral-500 hover:text-rose-600 transition-colors"
                  >
                    Cancel request
                  </button>

                  {/* Instant Verification Simulation for Demo / Dev */}
                  <button
                    type="button"
                    onClick={handleSimulateInstantVerification}
                    disabled={simulatingVerification}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                    title="For demonstration/testing: instantly confirms payment without waiting 1-2 hours"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>{simulatingVerification ? "Verifying..." : "Instant Test Verify"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

