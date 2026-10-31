"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeService, StoreData, ProductData, OrderItemData, DEFAULT_HOMEPAGE_SECTION_IDS } from "@/lib/store-service";
import { getTheme, generateThemeCssVariables, getAllThemes } from "@/lib/themes";
import { getFontFamily } from "@/lib/fonts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  ShoppingBag,
  Search,
  Star,
  Check,
  CheckCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Share2,
  Phone,
  QrCode,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Heart,
  ChevronLeft,
  X,
  AlertCircle,
} from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { TemplateHome, TemplateHeader, TemplateFooter, TEMPLATE_HOME_LAYOUTS } from "@/components/storefront/template-layouts";
import { canUseCoupons } from "@/lib/plans";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default function StorefrontPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const subdomain = resolvedParams.subdomain;
  const router = useRouter();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistedIds, setWishlistedIds] = useState<Record<string, boolean>>({});

  // Cart state
  const [cart, setCart] = useState<OrderItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Checkout Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "payment" | "success">("details");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custStreet, setCustStreet] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custState, setCustState] = useState("");
  const [custPincode, setCustPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");
  const [paymentUtr, setPaymentUtr] = useState("");
  const [createdOrderToken, setCreatedOrderToken] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  // Banner Carousel State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  // Preview Theme Override (allows previewing any theme without plan restrictions)
  const [previewThemeSlug, setPreviewThemeSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pt = params.get("preview_theme") || params.get("theme");
      if (pt) {
        setPreviewThemeSlug(pt);
      }
      const view = params.get("view");
      if (view === "cart" || view === "bag" || params.get("cart") === "true") {
        setIsCartOpen(true);
      }
      if (view === "checkout" || params.get("checkout") === "true") {
        setIsCheckoutOpen(true);
      }
    }
  }, []);

  // Load store. On a fresh address (e.g. a store's own subdomain) nothing is cached yet, so keep
  // showing the loader until the store arrives from the cloud, the first sync says it doesn't
  // exist, or 8 seconds pass.
  useEffect(() => {
    const check = () => {
      const loaded = storeService.getStore(subdomain);
      if (loaded) {
        setStore({ ...loaded });
        setLoading(false);
      } else if (storeService.isCloudSynced()) {
        setLoading(false);
      }
    };
    check();
    const unsubscribe = storeService.subscribe(check);
    const giveUp = setTimeout(() => setLoading(false), 8000);
    return () => {
      unsubscribe();
      clearTimeout(giveUp);
    };
  }, [subdomain]);

  const refreshStore = () => {
    const loaded = storeService.getStore(subdomain);
    if (loaded) setStore({ ...loaded });
  };

  const [themeAppliedToast, setThemeAppliedToast] = useState(false);

  const handleApplyPreviewTheme = () => {
    if (!store || !previewThemeSlug) return;
    storeService.updateStore(subdomain, { activeThemeSlug: previewThemeSlug });
    refreshStore();
    setThemeAppliedToast(true);
    setTimeout(() => setThemeAppliedToast(false), 4000);
  };

  const theme = useMemo(() => {
    return getTheme(previewThemeSlug || store?.activeThemeSlug);
  }, [previewThemeSlug, store]);

  const brandTheme = useMemo(() => {
    if (previewThemeSlug) {
      return {
        primary: theme.tokens.primary,
        background: theme.tokens.background,
        surface: theme.tokens.card,
      };
    }
    return (
      store?.customBrandTheme || {
        primary: theme.tokens.primary,
        background: theme.tokens.background,
        surface: theme.tokens.card,
      }
    );
  }, [previewThemeSlug, theme, store?.customBrandTheme]);

  const themeStyles = useMemo(() => {
    return generateThemeCssVariables(
      theme,
      previewThemeSlug ? undefined : store?.customBrandTheme,
      previewThemeSlug ? theme.tokens.fontFamily : store?.fontFamily,
      Boolean(previewThemeSlug)
    );
  }, [theme, store?.customBrandTheme, store?.fontFamily, previewThemeSlug]);

  // Active Banners for Carousel
  const activeBanners = useMemo(() => {
    if (!store?.banners || store.banners.length === 0) {
      return [
        {
          id: "default-1",
          storeId: store?.id || "store",
          title: "Style That Moves With You",
          imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80",
          ctaLink: "#products",
          targetType: "category" as const,
          targetValue: "T-Shirts",
          position: 0,
          isActive: true,
        },
        {
          id: "default-2",
          storeId: store?.id || "store",
          title: "Everyday Layers",
          imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80",
          ctaLink: "#products",
          targetType: "product" as const,
          targetValue: "essential-hoodie",
          position: 1,
          isActive: true,
        },
        {
          id: "default-3",
          storeId: store?.id || "store",
          title: "Modern Denim",
          imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80",
          ctaLink: "#products",
          targetType: "category" as const,
          targetValue: "Jeans",
          position: 2,
          isActive: true,
        },
      ];
    }
    const filtered = store.banners.filter((b) => b.isActive);
    return filtered.length > 0 ? filtered : store.banners;
  }, [store?.banners, store?.id]);

  // Auto-advance Carousel
  useEffect(() => {
    if (activeBanners.length <= 1 || isBannerHovered) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length, isBannerHovered]);

  const handlePrevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleBannerClick = (banner: any) => {
    if (banner.targetType === "category" && banner.targetValue) {
      const catSlug = banner.targetValue.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      router.push(`/s/${subdomain}/category/${catSlug}`);
    } else if (banner.targetType === "product" && banner.targetValue) {
      router.push(`/s/${subdomain}/products/${banner.targetValue}`);
    } else if (banner.ctaLink) {
      if (banner.ctaLink.startsWith("http")) {
        window.open(banner.ctaLink, "_blank");
      } else if (banner.ctaLink.startsWith("#")) {
        const id = banner.ctaLink.replace("#", "");
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(banner.ctaLink);
      }
    }
  };

  // Story Circular Categories with slug linking (Child Categories only)
  const storyCategories = useMemo(() => {
    if (store?.categories && store.categories.length > 0) {
      return store.categories
        .filter((c) => c.isActive && !c.isParent)
        .map((c) => ({
          name: c.name,
          slug: c.slug,
          image: c.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80",
        }));
    }
    return [
      { name: "T-Shirts", slug: "t-shirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80" },
      { name: "Shirts", slug: "shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=200&q=80" },
      { name: "Hoodies", slug: "hoodies", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=200&q=80" },
      { name: "Jeans", slug: "jeans", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=200&q=80" },
      { name: "Jackets", slug: "jackets", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=200&q=80" },
      { name: "Dresses", slug: "dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80" },
      { name: "Tops", slug: "tops", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=200&q=80" },
    ];
  }, [store?.categories]);

  // Dynamic Parent Categories for Promotional Showcase Cards
  const parentCategories = useMemo(() => {
    if (!store?.categories) return [];
    return store.categories.filter((c) => c.isParent && (c.isActive ?? true));
  }, [store?.categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!store) return [];
    return store.products.filter((p) => {
      if (p.status !== "published") return false;
      const matchesCat =
        selectedCategory === "All" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (p.gender && p.gender.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [store, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (!store) return 0;
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= store.freeDeliveryThreshold ? 0 : store.standardDeliveryFee;
  }, [cartSubtotal, store]);

  const codFee = useMemo(() => {
    if (!store || paymentMethod !== "cod") return 0;
    return store.codFee || 0;
  }, [store, paymentMethod]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - couponDiscount + deliveryFee + codFee);
  }, [cartSubtotal, couponDiscount, deliveryFee, codFee]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: ProductData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const existing = prev.find((it) => it.productId === product.id);
      if (existing) {
        return prev.map((it) =>
          it.productId === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          image: product.images[0] || "",
          quantity: 1,
          price: product.price,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const code = couponCode.trim().toUpperCase();

    // Check custom active discounts created in seller dashboard
    const matched = store?.discounts?.find(
      (d) => d.isActive && d.code.toUpperCase() === code
    );

    if (matched) {
      if (matched.minOrderValue && cartSubtotal < matched.minOrderValue) {
        alert(
          `Minimum order value of ₹${(matched.minOrderValue / 100).toLocaleString("en-IN")} required for coupon ${matched.code}.`
        );
        return;
      }

      let discountAmount = 0;
      if (matched.type === "percentage") {
        discountAmount = Math.round((cartSubtotal * matched.value) / 100);
        if (matched.maxDiscount && discountAmount > matched.maxDiscount) {
          discountAmount = matched.maxDiscount;
        }
      } else {
        discountAmount = matched.value;
      }

      setCouponDiscount(discountAmount);
      alert(`🎉 Coupon "${matched.code}" applied successfully! You saved ₹${(discountAmount / 100).toLocaleString("en-IN")}`);
      return;
    }

    // Only codes the seller created in their dashboard are valid
    alert("Invalid promotional code. Please check your coupon code and try again.");
  };

  // Place Order
  const handlePlaceOrder = () => {
    if (!store) return;
    if (!custName || !custPhone || !custStreet || !custCity || !custPincode) {
      alert("Please fill all delivery details marked with *");
      return;
    }

    const order = storeService.createOrder(subdomain, {
      customer: {
        name: custName,
        phone: custPhone,
        email: custEmail,
      },
      address: {
        street: custStreet,
        city: custCity,
        state: custState || "India",
        pincode: custPincode,
      },
      items: cart,
      paymentMethod,
      paymentUtr: paymentMethod === "upi" ? paymentUtr : undefined,
    });

    setCreatedOrderToken(order.token);
    setCreatedOrderNumber(order.number);
    setCheckoutStep("success");
    setCart([]);
    refreshStore();
  };

  const effectiveThemeSlug = previewThemeSlug || store?.activeThemeSlug || "tokyo-minimal";

  const sectionOrder = useMemo(() => {
    if (!store) return DEFAULT_HOMEPAGE_SECTION_IDS;
    const themeOrder = store.themeSectionOrders?.[effectiveThemeSlug];
    if (themeOrder && Array.isArray(themeOrder) && themeOrder.length > 0) {
      const list = [...themeOrder];
      DEFAULT_HOMEPAGE_SECTION_IDS.forEach((id) => {
        if (!list.includes(id)) list.push(id);
      });
      return list;
    }
    if (store.homepageSections && Array.isArray(store.homepageSections) && store.homepageSections.length > 0) {
      const list = [...store.homepageSections];
      DEFAULT_HOMEPAGE_SECTION_IDS.forEach((id) => {
        if (!list.includes(id)) list.push(id);
      });
      return list;
    }
    return DEFAULT_HOMEPAGE_SECTION_IDS;
  }, [store, effectiveThemeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Opening Storefront...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center p-8 bg-neutral-50 rounded-lg border border-neutral-200">
          <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900">Store Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Store "{subdomain}" is not yet registered.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/register">
              <Button className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs">Register "{subdomain}"</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full rounded-md text-xs">Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UPI deep link
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(store.upiId)}&pn=${encodeURIComponent(
    store.name
  )}&am=${(cartTotal / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order from ${store.name}`
  )}`;

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const activeFontFamily = getFontFamily(
    previewThemeSlug ? theme.tokens.fontFamily : store?.fontFamily
  );

  const layoutType = theme.layoutType || "editorial";
  // the newer layouts draw their own header, home, product cards and footer
  const isTemplateLayout = TEMPLATE_HOME_LAYOUTS.includes(layoutType);

  return (
    <div
      style={{
        ...(themeStyles as React.CSSProperties),
        fontFamily: activeFontFamily,
        backgroundColor: brandTheme.background,
        color: brandTheme.primary,
      }}
      className="min-h-screen flex flex-col"
    >
      {/* 0. Interactive Live Theme Preview Banner (Active whenever preview_theme or theme param is in URL) */}
      {previewThemeSlug && (
        <div className="sticky top-0 z-50 bg-neutral-950 text-white px-4 py-2.5 shadow-xl border-b border-neutral-800 flex items-center justify-between text-xs font-medium backdrop-blur-md flex-wrap gap-2 animate-enter-slide-down">
          {/* Left: Live indicator, current theme name, layout badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-glow-pulse" />
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-[11px]">Live Preview:</span>
              <span className="font-bold text-white tracking-wide">{theme.name}</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/10 text-neutral-200 border border-white/10">
              {theme.tier.toUpperCase()} TIER • {theme.layoutType || "editorial"}
            </span>

            {/* Quick Switcher Dropdown */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-neutral-800">
              <span className="text-[10px] text-neutral-400">Switch Theme:</span>
              <select
                value={previewThemeSlug || ""}
                onChange={(e) => {
                  const nextSlug = e.target.value;
                  const url = new URL(window.location.href);
                  url.searchParams.set("preview_theme", nextSlug);
                  window.location.href = url.toString();
                }}
                className="bg-neutral-900 text-white text-[11px] px-2 py-1 rounded-md border border-neutral-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {getAllThemes().map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name} ({t.layoutType || "editorial"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Apply Theme, Return to Dashboard, Exit Preview */}
          <div className="flex items-center gap-2 shrink-0">
            {themeAppliedToast && (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>Theme Applied to Store!</span>
              </span>
            )}

            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg h-7 px-3 gap-1 shadow-xs cursor-pointer"
              onClick={handleApplyPreviewTheme}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Theme</span>
            </Button>

            <Link
              href="/dashboard?tab=themes"
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("preview_theme");
                url.searchParams.delete("theme");
                window.location.href = url.pathname;
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* 1. Header with Brand Logo Upload / Title */}
      {isTemplateLayout ? (
        <TemplateHeader
          layout={layoutType}
          store={store}
          categories={storyCategories}
          subdomain={subdomain}
          cartCount={cartItemCount}
          onOpenCart={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      ) : (
        <StoreHeader
          store={store}
          cartCount={cart.reduce((acc, it) => acc + it.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategorySlug={selectedCategory !== "All" ? selectedCategory.toLowerCase() : undefined}
          brandTheme={brandTheme}
        />
      )}

      {isCheckoutOpen ? (
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 animate-enter-slide-up">
          {/* Top Bar with Back Navigation */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200 mb-6">
            <button
              onClick={() => {
                if (checkoutStep === "success") {
                  setIsCheckoutOpen(false);
                  setIsCartOpen(false);
                  setCheckoutStep("details");
                } else if (checkoutStep === "payment") {
                  setCheckoutStep("details");
                } else {
                  setIsCheckoutOpen(false);
                  setIsCartOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>
                {checkoutStep === "success"
                  ? "← Back to Storefront"
                  : checkoutStep === "payment"
                  ? "← Back to Delivery Details"
                  : "← Back to Shopping Bag"}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-neutral-800">Secure Direct Checkout</span>
            </div>
          </div>

          {checkoutStep === "success" ? (
            <div className="max-w-lg mx-auto py-12 px-6 bg-white rounded-2xl border border-neutral-200 text-center space-y-6 shadow-sm animate-enter-scale">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">
                  Payment & Order Recorded
                </span>
                <h2 className="text-2xl font-extrabold text-neutral-900">Order Confirmed!</h2>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Order <span className="font-mono font-bold text-neutral-900">#{createdOrderNumber}</span> has been confirmed and placed with {store.name}.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>Customer:</span>
                  <span className="font-bold text-neutral-900">{custName}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Contact:</span>
                  <span className="font-bold text-neutral-900">{custPhone}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping Address:</span>
                  <span className="font-bold text-neutral-900 text-right">
                    {custStreet}, {custCity} - {custPincode}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600 pt-2 border-t border-neutral-200">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-neutral-900 uppercase">
                    {paymentMethod === "upi" ? "Direct UPI" : "Cash on Delivery"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a
                  href={`https://wa.me/${(store.contactPhone || store.upiId || "919876543210").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hello ${store.name}, I placed Order #${createdOrderNumber} on your online store for ₹${(cartTotal / 100).toLocaleString("en-IN")}. Please confirm receipt!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp Order Confirmation</span>
                </a>

                {createdOrderToken && (
                  <Link href={`/orders/${createdOrderToken}`} className="w-full">
                    <Button variant="outline" className="w-full text-xs rounded-xl py-2.5">
                      Track Live Order Status
                    </Button>
                  </Link>
                )}

                <Button
                  className="w-full bg-neutral-900 text-white hover:bg-black text-xs rounded-xl py-2.5"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setIsCartOpen(false);
                    setCheckoutStep("details");
                  }}
                >
                  Return to Store Catalog
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Checkout Stepper & Forms */}
              <div className="lg:col-span-7 space-y-6">
                {/* Stepper Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-xl border border-neutral-200">
                  <button
                    onClick={() => setCheckoutStep("details")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      checkoutStep === "details"
                        ? "bg-white text-black shadow-xs"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    1. Delivery Details
                  </button>
                  <button
                    onClick={() => {
                      if (!custName || !custPhone || !custStreet || !custCity || !custPincode) {
                        alert("Please fill all required delivery details first.");
                        return;
                      }
                      setCheckoutStep("payment");
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      checkoutStep === "payment"
                        ? "bg-white text-black shadow-xs"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    2. Payment Method
                  </button>
                </div>

                {checkoutStep === "details" && (
                  <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-4 text-xs animate-enter-slide-up">
                    <h3 className="font-bold text-sm text-neutral-900">Shipping & Delivery Information</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-bold block mb-1 text-neutral-800">Full Name *</label>
                        <Input
                          placeholder="e.g. Rahul Sharma"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          className="rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1 text-neutral-800">Phone Number *</label>
                        <Input
                          placeholder="+91 9876543210"
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          className="rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold block mb-1 text-neutral-800">Email Address (Optional)</label>
                      <Input
                        placeholder="yourname@example.com"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1 text-neutral-800">Street Address / House / Flat *</label>
                      <Input
                        placeholder="House / Flat No., Apartment, Street, Landmark"
                        value={custStreet}
                        onChange={(e) => setCustStreet(e.target.value)}
                        className="rounded-xl text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold block mb-1 text-neutral-800">City *</label>
                        <Input
                          placeholder="e.g. Mumbai"
                          value={custCity}
                          onChange={(e) => setCustCity(e.target.value)}
                          className="rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1 text-neutral-800">State *</label>
                        <Input
                          placeholder="e.g. Maharashtra"
                          value={custState}
                          onChange={(e) => setCustState(e.target.value)}
                          className="rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1 text-neutral-800">PIN Code *</label>
                        <Input
                          placeholder="400001"
                          value={custPincode}
                          onChange={(e) => setCustPincode(e.target.value)}
                          className="rounded-xl text-xs font-mono"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full bg-neutral-900 text-white hover:bg-black rounded-xl text-xs font-bold py-3.5 mt-2 shadow-sm"
                      onClick={() => {
                        if (!custName || !custPhone || !custStreet || !custCity || !custPincode) {
                          alert("Please fill all required delivery details marked with *");
                          return;
                        }
                        setCheckoutStep("payment");
                      }}
                    >
                      Proceed to Payment Method →
                    </Button>
                  </div>
                )}

                {checkoutStep === "payment" && (
                  <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm space-y-5 text-xs animate-enter-scale">
                    <h3 className="font-bold text-sm text-neutral-900">Select Payment Option</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          paymentMethod === "upi"
                            ? "border-black bg-neutral-50 ring-2 ring-black shadow-xs"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="w-5 h-5 text-black" />
                          <span className="font-bold text-sm text-neutral-900">Direct UPI</span>
                        </div>
                        <span className="text-[11px] text-neutral-500">Scan QR via GPay, PhonePe, Paytm, BHIM</span>
                      </button>

                      {store.codEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cod")}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            paymentMethod === "cod"
                              ? "border-black bg-neutral-50 ring-2 ring-black shadow-xs"
                              : "border-neutral-200 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-5 h-5 text-black" />
                            <span className="font-bold text-sm text-neutral-900">Cash on Delivery</span>
                          </div>
                          <span className="text-[11px] text-neutral-500">Pay cash upon delivery at your doorstep</span>
                        </button>
                      )}
                    </div>

                    {paymentMethod === "upi" && (
                      <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-neutral-800 block">
                            Scan UPI QR Code to Pay Directly
                          </span>
                          <p className="text-[11px] text-neutral-500">
                            Merchant UPI ID: <strong className="text-black font-mono">{store.upiId}</strong>
                          </p>
                        </div>

                        <div className="w-44 h-44 mx-auto p-3 bg-white rounded-xl border border-neutral-200 shadow-xs">
                          <img src={upiQrUrl} alt="UPI QR" className="w-full h-full object-contain" />
                        </div>

                        <div className="text-left pt-2 border-t border-neutral-200 space-y-1.5">
                          <label className="text-xs font-bold text-neutral-800 block">
                            Bank Reference / UTR Number (Optional, for instant verification):
                          </label>
                          <Input
                            placeholder="e.g. 428719283741 (12 digits)"
                            value={paymentUtr}
                            onChange={(e) => setPaymentUtr(e.target.value)}
                            className="rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="w-1/3 rounded-xl text-xs py-3"
                        onClick={() => setCheckoutStep("details")}
                      >
                        Back
                      </Button>
                      <Button
                        className="w-2/3 bg-neutral-900 text-white hover:bg-black rounded-xl text-xs font-bold py-3 shadow-md hover-lift press-scale cursor-pointer"
                        onClick={handlePlaceOrder}
                      >
                        Place Order (₹{(cartTotal / 100).toLocaleString("en-IN")})
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-neutral-900">Order Items ({cartItemCount})</h3>

                  <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-14 rounded-md object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-neutral-900 line-clamp-1">{item.title}</h5>
                          <span className="text-[11px] text-neutral-500">
                            Qty: {item.quantity} • ₹{(item.price / 100).toLocaleString("en-IN")} each
                          </span>
                        </div>
                        <span className="text-xs font-bold text-neutral-900 shrink-0">
                          ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-medium text-neutral-900">₹{(cartSubtotal / 100).toLocaleString("en-IN")}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Coupon Discount</span>
                        <span>-₹{(couponDiscount / 100).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee / 100}`}</span>
                    </div>
                    {codFee > 0 && (
                      <div className="flex justify-between">
                        <span>COD Handling Fee</span>
                        <span>₹{codFee / 100}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-bold text-neutral-900">
                      <span>Total Amount</span>
                      <span>₹{(cartTotal / 100).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : isCartOpen ? (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 animate-enter-scale">
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                title="Back to Catalog"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Your Shopping Bag</h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {cartItemCount} {cartItemCount === 1 ? "item" : "items"} in your cart
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-xs font-semibold hover:underline flex items-center gap-1"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">Your bag is empty</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                You haven't added any products to your shopping bag yet. Explore our curated collections to find your favorites.
              </p>
              <Button
                onClick={() => setIsCartOpen(false)}
                className="bg-[#111111] text-white hover:bg-black rounded-xl text-xs px-6 py-2.5"
              >
                Explore Catalog
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
              {/* Left Column: Items List */}
              <div className="lg:col-span-7 space-y-4">
                {/* Free Shipping Alert Pill */}
                <div className="p-3.5 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs">
                  {cartSubtotal >= store.freeDeliveryThreshold ? (
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Free shipping unlocked on this order!</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-neutral-700">
                        <span>
                          Add <strong className="text-black">₹{((store.freeDeliveryThreshold - cartSubtotal) / 100).toLocaleString("en-IN")}</strong> more for Free Shipping
                        </span>
                        <span className="font-bold text-[11px] text-neutral-500">
                          Threshold: ₹{(store.freeDeliveryThreshold / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-black h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (cartSubtotal / store.freeDeliveryThreshold) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                  {cart.map((item, idx) => (
                    <div key={idx} className={`py-4 flex items-center justify-between gap-4 animate-enter-slide-up stagger-${(idx % 6) + 1}`}>
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-20 h-24 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{item.title}</h4>
                        {item.variantName && (
                          <span className="text-[11px] text-neutral-500 block">{item.variantName}</span>
                        )}
                        <span className="text-sm font-bold text-neutral-900 block">
                          ₹{(item.price / 100).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center border border-neutral-300 rounded-lg bg-white shadow-2xs">
                          <button
                            onClick={() => updateCartQty(idx, -1)}
                            className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-l-lg transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-neutral-900">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(idx, 1)}
                            className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-r-lg transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => updateCartQty(idx, -item.quantity)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Summary & Checkout Action */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-neutral-900">Order Summary</h3>

                  {/* Promo Code Input (coupons are a Growth feature) */}
                  {canUseCoupons(store.planId) && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Discount code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="text-xs uppercase font-mono font-medium rounded-xl"
                    />
                    <Button size="sm" variant="outline" onClick={applyCoupon} className="rounded-xl text-xs font-semibold px-4">
                      Apply
                    </Button>
                  </div>
                  )}

                  <div className="space-y-2.5 pt-2 border-t border-neutral-100 text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-medium text-neutral-900">₹{(cartSubtotal / 100).toLocaleString("en-IN")}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Coupon Discount</span>
                        <span>-₹{(couponDiscount / 100).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Estimated Delivery</span>
                      <span>
                        {deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee / 100}`}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-bold text-neutral-900">
                      <span>Total Amount</span>
                      <span>₹{(cartTotal / 100).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-bold py-3.5 shadow-md flex items-center justify-center gap-2 hover-lift press-scale cursor-pointer"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                      setCheckoutStep("details");
                    }}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        <div className="w-full flex flex-col">
          {isTemplateLayout ? (
            <TemplateHome
              layout={layoutType}
              store={store}
              theme={theme}
              products={store.products.filter(
                (p) => p.status === "published" && (!searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
              )}
              categories={storyCategories}
              fallbackImage={activeBanners[0]?.imageUrl}
              subdomain={subdomain}
              onAddToCart={handleAddToCart}
            />
          ) : sectionOrder.map((sectionId) => {
            if (sectionId === "hero") {
              return (
                <React.Fragment key="hero">
                  {layoutType === "lookbook-minimal" && (
                    <section className="relative w-full h-[65vh] sm:h-[75vh] bg-neutral-950 overflow-hidden flex items-end p-6 sm:p-14 select-none animate-enter-blur theme-preview-transition">
                      <img
                        src={activeBanners[0]?.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=80"}
                        alt="Lookbook"
                        className="absolute inset-0 w-full h-full object-cover object-top opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                      <div className="relative z-10 max-w-3xl text-white space-y-3">
                        <span className="inline-block text-[11px] font-bold tracking-[0.28em] uppercase text-amber-200/90">
                          Editorial Capsule // Autumn-Winter 2026
                        </span>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight font-serif-title leading-[1.05] text-white">
                          Simplicity, Form & Movement
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl font-light leading-relaxed">
                          Quiet luxury tailoring built from organic wool, refined linework, and pure silhouettes. Crafted for those who appreciate understated elegance.
                        </p>
                        <div className="pt-2 flex items-center gap-3">
                          <a href="#products">
                            <button className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-sm">
                              View Catalog ↓
                            </button>
                          </a>
                        </div>
                      </div>
                    </section>
                  )}

                  {layoutType === "magazine-bold" && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full animate-enter-blur theme-preview-transition">
                      <div className="border-2 border-black grid grid-cols-1 lg:grid-cols-12 bg-white">
                        <div className="p-8 sm:p-12 lg:col-span-7 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-black">
                          <div className="space-y-4">
                            <div className="inline-block px-3 py-1 bg-black text-white text-[11px] font-mono uppercase font-bold tracking-widest">
                              DROP 01 // ARCHIVE 2026
                            </div>
                            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-black">
                              RAW EDGE <br /> <span className="text-[#FF4400]">URBAN</span> CULTURE
                            </h1>
                            <p className="text-xs sm:text-sm font-mono text-neutral-600 max-w-md pt-2">
                              Heavy cottons, oversized cuts & industrial hardware. Engineered for the streets. Zero compromises, zero restocks.
                            </p>
                          </div>
                          <div className="pt-8 flex items-center gap-4 flex-wrap">
                            <a href="#products">
                              <button className="px-6 py-3 bg-[#FF4400] text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-black transition-colors shadow-[4px_4px_0px_#000]">
                                Shop The Drop →
                              </button>
                            </a>
                            <span className="font-mono text-xs text-neutral-500 font-bold">
                              {store.products.length} EXCLUSIVE PIECES
                            </span>
                          </div>
                        </div>
                        <div className="lg:col-span-5 relative aspect-square sm:aspect-4/3 lg:aspect-auto overflow-hidden bg-neutral-900">
                          <img
                            src={activeBanners[0]?.imageUrl || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80"}
                            alt="Magazine Hero"
                            className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                          />
                        </div>
                      </div>

                      {/* Marquee Ticker Bar */}
                      <div className="bg-black text-white font-mono text-[11px] py-2.5 px-4 overflow-hidden border-x-2 border-b-2 border-black flex items-center justify-between">
                        <div className="flex items-center gap-6 whitespace-nowrap overflow-x-auto scrollbar-none">
                          <span className="font-bold text-[#FF4400]">✦ LIMITED EDITION RUN</span>
                          <span>✦ DIRECT UPI & CASH ON DELIVERY</span>
                          <span>✦ DISPATCHED WITHIN 24 HOURS</span>
                          <span>✦ EXCLUSIVE DROP 01</span>
                          <span>✦ NO COMMISSIONS</span>
                          <span className="font-bold text-[#FF4400]">✦ 100% VERIFIED AUTHENTIC</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {layoutType === "bento-tech" && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full animate-enter-blur theme-preview-transition">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-8 relative aspect-[16/9] sm:aspect-[2.1/1] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.12)] p-6 sm:p-10 flex flex-col justify-end group">
                          <img
                            src={activeBanners[0]?.imageUrl || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=80"}
                            alt="Tech Bento"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <div className="relative z-10 space-y-2">
                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-mono uppercase tracking-widest">
                              MODULAR HARDWARE & TECH
                            </span>
                            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                              Next-Gen Audio, Gadgets & Peripherals
                            </h1>
                            <p className="text-xs text-slate-300 max-w-md">
                              Engineered with premium mechanical parts, low-latency audio, and precision ergonomics for everyday power users.
                            </p>
                          </div>
                        </div>

                        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between backdrop-blur-md">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                              BENCHMARK TESTED
                            </span>
                            <h3 className="text-lg font-bold text-white">24h Express Dispatch</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              All gear comes in anti-static protective packaging with real-time tracking and direct UPI verification.
                            </p>
                          </div>
                          <div className="pt-4 flex items-center justify-between text-xs text-cyan-300 font-mono border-t border-slate-800/80">
                            <span>✦ INSTANT QR UPI</span>
                            <span>✦ COD ELIGIBLE</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {layoutType === "botanical-wellness" && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full animate-enter-blur theme-preview-transition">
                      <div className="rounded-3xl bg-[#EBE7DF] border border-[#E0DACF] p-8 sm:p-12 grid grid-cols-1 md:grid-cols-12 items-center gap-8">
                        <div className="md:col-span-7 space-y-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#5B756C]/15 text-[#2D3B36] border border-[#5B756C]/20">
                            <span>🌿 Pure Organic Harvest</span>
                          </span>
                          <h1 className="text-3xl sm:text-5xl font-serif text-[#2D3B36] leading-tight font-normal">
                            Cultivating Harmony, Health & Ritual
                          </h1>
                          <p className="text-xs sm:text-sm text-[#5B756C] max-w-lg leading-relaxed">
                            Small-batch artisan teas, cold-pressed botanicals, and herbal apothecary elixirs crafted with sacred patience.
                          </p>
                          <div className="pt-2">
                            <a href="#products">
                              <button className="px-6 py-2.5 rounded-full bg-[#2D3B36] text-[#F7F5F0] text-xs font-medium hover:bg-[#1C2622] transition-colors shadow-xs">
                                Explore Botanical Catalog
                              </button>
                            </a>
                          </div>
                        </div>
                        <div className="md:col-span-5 relative aspect-square sm:aspect-4/3 rounded-2xl overflow-hidden shadow-sm">
                          <img
                            src={activeBanners[0]?.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"}
                            alt="Kyoto Botanical"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="mt-4 p-4 rounded-2xl bg-white/70 border border-[#E0DACF] flex items-center justify-between gap-4 text-xs text-[#2D3B36] overflow-x-auto scrollbar-none">
                        <span className="flex items-center gap-1.5 shrink-0">🍃 100% Organically Sourced</span>
                        <span className="flex items-center gap-1.5 shrink-0">🌾 Small-Batch Artisanal</span>
                        <span className="flex items-center gap-1.5 shrink-0">💧 Cold-Pressed & Pure</span>
                        <span className="flex items-center gap-1.5 shrink-0">🌱 Zero Chemical Additives</span>
                      </div>
                    </section>
                  )}

                  {layoutType !== "lookbook-minimal" &&
                    layoutType !== "magazine-bold" &&
                    layoutType !== "bento-tech" &&
                    layoutType !== "botanical-wellness" && (
                      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full animate-enter-blur theme-preview-transition">
                        <div
                          className="relative w-full rounded-lg overflow-hidden border border-neutral-200/90 bg-neutral-100 group shadow-xs select-none cursor-pointer"
                          onMouseEnter={() => setIsBannerHovered(true)}
                          onMouseLeave={() => setIsBannerHovered(false)}
                        >
                          <div className="relative w-full aspect-[2.1/1] sm:aspect-[2.4/1] md:aspect-[2.8/1] lg:aspect-[3.2/1] overflow-hidden">
                            {activeBanners.map((banner, index) => (
                              <div
                                key={banner.id || index}
                                onClick={() => handleBannerClick(banner)}
                                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                                  index === currentBannerIndex ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                                }`}
                              >
                                <img
                                  src={banner.imageUrl}
                                  alt={banner.title || "Store Banner"}
                                  className="w-full h-full object-cover object-center"
                                />
                              </div>
                            ))}
                          </div>

                          {activeBanners.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevBanner();
                                }}
                                aria-label="Previous Slide"
                                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-neutral-900 shadow-md backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-75 sm:hover:opacity-100"
                              >
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextBanner();
                                }}
                                aria-label="Next Slide"
                                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-neutral-900 shadow-md backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-75 sm:hover:opacity-100"
                              >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                                {activeBanners.map((_, dotIdx) => (
                                  <button
                                    key={dotIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentBannerIndex(dotIdx);
                                    }}
                                    aria-label={`Go to slide ${dotIdx + 1}`}
                                    className={`transition-all ${
                                      dotIdx === currentBannerIndex
                                        ? "w-6 h-1.5 rounded-full bg-white"
                                        : "w-1.5 h-1.5 rounded-full bg-white/50 hover:bg-white/80"
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </section>
                    )}
                </React.Fragment>
              );
            }

            if (sectionId === "stories") {
              return (
                <React.Fragment key="stories">
                  {layoutType === "lookbook-minimal" && (
                    <div className="max-w-4xl mx-auto my-3 relative z-20 px-4">
                      <div className="p-1.5 rounded-full bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-md flex items-center justify-center gap-1 overflow-x-auto scrollbar-none">
                        {["All", ...storyCategories.map((c) => c.name)].map((catName) => (
                          <button
                            key={catName}
                            onClick={() => setSelectedCategory(catName)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                              selectedCategory === catName
                                ? "bg-black text-white shadow-xs"
                                : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                            }`}
                          >
                            {catName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {layoutType === "magazine-bold" && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 w-full">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {["All", ...storyCategories.map((c) => c.name)].map((catName) => (
                          <button
                            key={catName}
                            onClick={() => setSelectedCategory(catName)}
                            className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all ${
                              selectedCategory === catName
                                ? "bg-black text-white border-2 border-black"
                                : "bg-neutral-100 text-black border-2 border-neutral-300 hover:border-black"
                            }`}
                          >
                            [{catName}]
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {layoutType === "bento-tech" && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 w-full">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {["All", ...storyCategories.map((c) => c.name)].map((catName) => (
                          <button
                            key={catName}
                            onClick={() => setSelectedCategory(catName)}
                            className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
                              selectedCategory === catName
                                ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-cyan-500/50 hover:text-white"
                            }`}
                          >
                            {catName}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {layoutType === "botanical-wellness" && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 w-full">
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                        {["All", ...storyCategories.map((c) => c.name)].map((catName) => (
                          <button
                            key={catName}
                            onClick={() => setSelectedCategory(catName)}
                            className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all ${
                              selectedCategory === catName
                                ? "bg-[#2D3B36] text-white shadow-xs"
                                : "bg-[#EBE7DF] text-[#2D3B36] hover:bg-[#DFD9CD]"
                            }`}
                          >
                            {catName}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {layoutType !== "lookbook-minimal" &&
                    layoutType !== "magazine-bold" &&
                    layoutType !== "bento-tech" &&
                    layoutType !== "botanical-wellness" && (
                      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full">
                        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-3 no-scrollbar">
                          {storyCategories.map((cat, idx) => (
                            <button
                              key={idx}
                              onClick={() => router.push(`/s/${subdomain}/category/${cat.slug || cat.name.toLowerCase()}`)}
                              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
                            >
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-neutral-100 p-0.5 border border-neutral-200 group-hover:border-black group-hover:ring-2 group-hover:ring-black group-hover:ring-offset-2 transition-all shadow-2xs">
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                              </div>
                              <span className="text-[11px] font-medium text-neutral-700 group-hover:text-black group-hover:font-bold transition-colors">
                                {cat.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                </React.Fragment>
              );
            }

            if (sectionId === "featured-collections") {
              return (
                <React.Fragment key="featured-collections">
                  {parentCategories.length > 0 ? (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
                      <div
                        className={`grid grid-cols-1 ${
                          parentCategories.length === 1
                            ? "max-w-2xl mx-auto"
                            : parentCategories.length === 2
                            ? "sm:grid-cols-2"
                            : "sm:grid-cols-2 lg:grid-cols-3"
                        } gap-4 sm:gap-6`}
                      >
                        {parentCategories.map((pCat, idx) => {
                          const bgPalette = ["bg-[#EFECE6]", "bg-[#ECE7E1]", "bg-[#F3EFEA]", "bg-[#EAE6DF]"];
                          const cardBg = bgPalette[idx % bgPalette.length];
                          const animClass = idx % 2 === 0 ? "animate-wave-left" : "animate-wave-right";

                          return (
                            <div
                              key={pCat.id}
                              onClick={() => router.push(`/s/${subdomain}/category/${pCat.slug}`)}
                              className={`rounded-2xl ${cardBg} p-6 sm:p-8 flex items-center justify-between border border-neutral-200/90 cursor-pointer hover:border-neutral-400/80 shadow-2xs hover-3d-lift shimmer-card transition-all group overflow-hidden relative ${animClass}`}
                            >
                              <div className="flex-1 min-w-0 pr-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 block">
                                  Featured Collection
                                </span>
                                <h3 className="font-serif-title text-2xl sm:text-3xl text-neutral-900 font-normal leading-tight group-hover:text-black transition-colors">
                                  {pCat.name}
                                </h3>
                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                  {pCat.subtitle || pCat.description || "Curated styles for every moment."}
                                </p>

                                {/* CTA Link */}
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 mt-5 group-hover:translate-x-1 transition-transform">
                                  <span>{pCat.ctaText || `Shop ${pCat.name}`}</span>
                                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </div>

                              {/* Parent Picture on Right */}
                              {pCat.imageUrl && (
                                <div className="w-28 sm:w-36 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0 ml-2 shadow-sm border border-neutral-300/40">
                                  <img
                                    src={pCat.imageUrl}
                                    alt={pCat.name}
                                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    /* Fallback dual promo if no parent categories created yet */
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div
                          onClick={() => router.push(`/s/${subdomain}/category/jeans`)}
                          className="rounded-2xl bg-[#EFECE6] p-6 sm:p-8 flex items-center justify-between border border-neutral-200 cursor-pointer hover:border-neutral-300 transition-all group hover-3d-lift shimmer-card animate-wave-left"
                        >
                          <div>
                            <h3 className="font-serif-title text-2xl sm:text-3xl text-neutral-900 font-normal">
                              Men's Collection
                            </h3>
                            <p className="text-xs text-neutral-600 mt-1">Modern fits for everyday style.</p>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 mt-4 group-hover:underline">
                              <span>Shop Denim & Jeans</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="w-28 sm:w-36 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0 ml-4">
                            <img
                              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80"
                              alt="Men's collection"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        </div>

                        <div
                          onClick={() => router.push(`/s/${subdomain}/category/dresses`)}
                          className="rounded-2xl bg-[#ECE7E1] p-6 sm:p-8 flex items-center justify-between border border-neutral-200 cursor-pointer hover:border-neutral-300 transition-all group hover-3d-lift shimmer-card animate-wave-right"
                        >
                          <div>
                            <h3 className="font-serif-title text-2xl sm:text-3xl text-neutral-900 font-normal">
                              Women's Collection
                            </h3>
                            <p className="text-xs text-neutral-600 mt-1">Trendy styles for every you.</p>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 mt-4 group-hover:underline">
                              <span>Shop Dresses & Tops</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="w-28 sm:w-36 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0 ml-4">
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                              alt="Women's collection"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </React.Fragment>
              );
            }

            if (sectionId === "products") {
              return (
                <React.Fragment key="products">
                  {/* PRODUCT CATALOG (WITH SIDEBAR LAYOUT SUPPORT FOR ATELIER) */}
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
                    <div className={`w-full ${layoutType === "sidebar-storefront" ? "lg:flex lg:gap-8 items-start" : ""}`}>
                      {layoutType === "sidebar-storefront" && (
                        <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-6 p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              STORE DIRECTORY
                            </span>
                            <h3 className="text-lg font-bold text-neutral-900 mt-1">{store.name}</h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Curated Catalog & Atelier Collections
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-neutral-700 block mb-2">
                              Browse Categories
                            </span>
                            <button
                              onClick={() => setSelectedCategory("All")}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                                selectedCategory === "All"
                                  ? "bg-neutral-900 text-white font-bold"
                                  : "hover:bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              <span>All Products</span>
                              <span className="text-[10px] opacity-75">{store.products.length}</span>
                            </button>
                            {storyCategories.map((c) => {
                              const count = store.products.filter(
                                (p) => p.category.toLowerCase() === c.name.toLowerCase()
                              ).length;
                              return (
                                <button
                                  key={c.name}
                                  onClick={() => setSelectedCategory(c.name)}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                                    selectedCategory === c.name
                                      ? "bg-neutral-900 text-white font-bold"
                                      : "hover:bg-neutral-100 text-neutral-700"
                                  }`}
                                >
                                  <span>{c.name}</span>
                                  <span className="text-[10px] opacity-75">{count}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>Verified Direct Seller</span>
                            </div>
                            <p className="text-[11px] text-neutral-500">
                              Direct UPI & COD payments. Zero platform markup.
                            </p>
                          </div>
                        </aside>
                      )}

                      <main id="products" className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-inherit">
                              {selectedCategory === "All" ? "Best Sellers & Catalog" : selectedCategory}
                            </h3>
                            <p className="text-xs opacity-75 mt-0.5">
                              Showing {filteredProducts.length} pieces
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCategory("All");
                              setSearchQuery("");
                            }}
                            className="text-xs font-bold hover:underline flex items-center gap-1"
                          >
                            <span>View All</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {filteredProducts.length === 0 ? (
                          <div className="p-12 text-center rounded-lg bg-neutral-50/50 border border-neutral-200 my-6">
                            <ShoppingBag className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-neutral-900">No items found</h4>
                            <p className="text-xs text-neutral-500 mt-1">Try resetting your filter or search query.</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4 rounded-md text-xs"
                              onClick={() => {
                                setSelectedCategory("All");
                                setSearchQuery("");
                              }}
                            >
                              Reset Filters
                            </Button>
                          </div>
                        ) : (
                          <div className={`grid gap-4 sm:gap-6 ${
                            layoutType === "sidebar-storefront"
                              ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3"
                              : layoutType === "lookbook-minimal"
                              ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                          }`}>
                            {filteredProducts.map((product, idx) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                subdomain={subdomain}
                                planId={store.planId}
                                brandTheme={brandTheme}
                                isWishlisted={wishlistedIds[product.id]}
                                onToggleWishlist={toggleWishlist}
                                className={`animate-enter-slide-up stagger-${(idx % 8) + 1} hover-lift`}
                              />
                            ))}
                          </div>
                        )}
                      </main>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            if (sectionId === "editorial-promo") {
              return (
                <React.Fragment key="editorial-promo">
                  {/* Full-Width Editorial Promo Banner */}
                  <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
                    <div className="rounded-lg bg-[#EAE5DF] overflow-hidden border border-neutral-200 grid grid-cols-1 md:grid-cols-12 items-center">
                      <div className="p-8 sm:p-12 md:col-span-6 text-left">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1 block">
                          NEW ARRIVALS
                        </span>
                        <h3 className="font-serif-title text-3xl sm:text-4xl text-[#111111] leading-tight font-normal">
                          Fresh Fits For Brighter Days
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 mt-2 max-w-sm">
                          Light layers, bold looks, endless possibilities. Designed for everyday elevation.
                        </p>
                        <div className="mt-5">
                          <a href="#products">
                            <Button size="sm" className="bg-[#111111] text-white hover:bg-black rounded-md text-xs font-semibold px-5 py-2.5 gap-1.5">
                              <span>Shop New Arrivals</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      </div>

                      <div className="md:col-span-6 relative aspect-16/9 md:aspect-auto md:h-80 overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
                          alt="Fresh Fits Campaign"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </section>
                </React.Fragment>
              );
            }

            if (sectionId === "categories-grid") {
              return (
                <React.Fragment key="categories-grid">
                  {/* Shop by Category Grid */}
                  <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
                          Shop by Category
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Explore tailored collections with advanced filters and sorts
                        </p>
                      </div>
                      <Link
                        href={`/s/${subdomain}/category/all`}
                        className="text-xs font-bold text-neutral-900 hover:underline flex items-center gap-1"
                      >
                        <span>View All Collections</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      {(store.categories && store.categories.length > 0
                        ? store.categories.filter((c) => c.isActive)
                        : [
                            { name: "T-Shirts", slug: "t-shirts", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80" },
                            { name: "Shirts", slug: "shirts", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" },
                            { name: "Jeans", slug: "jeans", imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80" },
                            { name: "Hoodies", slug: "hoodies", imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80" },
                            { name: "Dresses", slug: "dresses", imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80" },
                          ]
                      ).slice(0, 5).map((cat, i) => (
                        <div
                          key={i}
                          onClick={() => router.push(`/s/${subdomain}/category/${cat.slug}`)}
                          className="group relative aspect-3/4 rounded-lg overflow-hidden border border-neutral-200 cursor-pointer shadow-2xs hover:shadow-md transition-all hover-lift"
                        >
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3.5 text-white">
                            <span className="font-bold text-xs sm:text-sm tracking-tight">{cat.name}</span>
                            <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </React.Fragment>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Rich Multi-Column Store Footer */}
      {isTemplateLayout ? (
        <TemplateFooter layout={layoutType} store={store} categories={storyCategories} subdomain={subdomain} />
      ) : (
        <StoreFooter store={store} brandTheme={brandTheme} />
      )}
    </div>
  );
}
