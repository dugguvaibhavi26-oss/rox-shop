"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  storeService,
  StoreData,
  ProductData,
  CategoryData,
  OrderData,
  ReviewData,
  BannerData,
  PlatformBroadcast,
  buildDefaultCategoriesForStore,
  DiscountData,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_HOMEPAGE_SECTION_IDS,
} from "@/lib/store-service";
import { PLATFORM_PLANS, canAddProduct, isThemeAllowed, canUseReviews, isPaidPlan } from "@/lib/plans";
import { PLATFORM_THEMES, getTheme, ThemeDefinition } from "@/lib/themes";
import { AVAILABLE_FONTS, getFontFamily } from "@/lib/fonts";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ReorderList, ReorderItem } from "@/components/ui/reorder-list";
import {
  LayoutDashboard,
  Globe,
  Package,
  ShoppingBag,
  Users,
  Star,
  Image as ImageIcon,
  Palette,
  CreditCard,
  Settings,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Truck,
  QrCode,
  Share2,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Phone,
  DollarSign,
  Search,
  UploadCloud,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Sparkles,
  Check,
  RefreshCw,
  FolderTree,
  Lock,
  Upload,
  ArrowUpDown,
  Plug,
  Mail,
  Send,
  CheckCircle2,
  LogOut,
  Store,
  Bell,
  Tag,
  TrendingUp,
  Info,
  Activity,
  Menu,
  Clock,
  Percent,
  ShoppingCart,
  BarChart2,
  SlidersHorizontal,
} from "lucide-react";

export default function DashboardPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-medium">Loading Seller Dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStoreParam = searchParams.get("store");
  const urlTabParam = searchParams.get("tab");
  const { user, loading: authLoading, signOut } = useAuth();

  const [activeSubdomain, setActiveSubdomain] = useState<string>(urlStoreParam || "");
  const [store, setStore] = useState<StoreData | null>(null);
  const [userStores, setUserStores] = useState<StoreData[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "categories" | "orders" | "discounts" | "customers" | "reviews" | "banners" | "themes" | "billing" | "settings" | "plugins"
  >((urlTabParam as any) || "overview");

  useEffect(() => {
    if (urlTabParam && urlTabParam !== activeTab) {
      setActiveTab(urlTabParam as any);
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "new-product" || action === "new") {
        setIsProductModalOpen(true);
      }
      if (action === "new-category") {
        setIsCategoryModalOpen(true);
      }
      if (action === "new-coupon") {
        setIsDiscountModalOpen(true);
      }
      if (action === "new-banner") {
        setIsBannerModalOpen(true);
      }
    }
  }, [urlTabParam]);

  // Time-Range Filters & Performance Metrics
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "7d" | "30d">("today");
  const [isAllMetricsExpanded, setIsAllMetricsExpanded] = useState(false);

  // Notifications Drawer State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: "n-1",
      title: "New Order #1004 Received",
      desc: "₹1,299 via BHIM UPI • Customer: Neha Sharma",
      time: "5m ago",
      type: "order",
      unread: true,
    },
    {
      id: "n-2",
      title: "Inventory Stock Alert",
      desc: "Oversized Cotton T-Shirt has 3 units remaining in stock.",
      time: "1h ago",
      type: "stock",
      unread: true,
    },
    {
      id: "n-3",
      title: "Discounts & Promo Codes Live",
      desc: "Discount engine connected to storefront checkout.",
      time: "3h ago",
      type: "feature",
      unread: true,
    },
    {
      id: "n-4",
      title: "Direct UPI Settlement Active",
      desc: "Buyer payments credit 100% to your linked bank account.",
      time: "Yesterday",
      type: "system",
      unread: false,
    },
  ]);

  // Mobile Bottom Pill & Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Discounts & Coupons Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [dCode, setDCode] = useState("");
  const [dType, setDType] = useState<"percentage" | "flat">("percentage");
  const [dValue, setDValue] = useState("");
  const [dMinOrder, setDMinOrder] = useState("");
  const [dMaxDiscount, setDMaxDiscount] = useState("");
  const [dIsActive, setDIsActive] = useState(true);

  // Plugins & Gmail Integration State
  const [gmailEmailInput, setGmailEmailInput] = useState("");
  const [gmailAutoAlerts, setGmailAutoAlerts] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailSaveToast, setGmailSaveToast] = useState(false);
  const [testEmailToast, setTestEmailToast] = useState(false);
  const [dropSubject, setDropSubject] = useState("");
  const [dropCollection, setDropCollection] = useState("");
  const [dropMessage, setDropMessage] = useState("");
  const [dropSending, setDropSending] = useState(false);
  const [dropSentSuccess, setDropSentSuccess] = useState(false);

  // Add/Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pTitle, setPTitle] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pComparePrice, setPComparePrice] = useState("");
  const [pStock, setPStock] = useState("10");
  const [pDesc, setPDesc] = useState("");
  const [pImageUrl, setPImageUrl] = useState("");

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cImageUrl, setCImageUrl] = useState("");
  const [cIsActive, setCIsActive] = useState(true);
  const [cIsParent, setCIsParent] = useState(false);
  const [cParentId, setCParentId] = useState("");
  const [cSubtitle, setCSubtitle] = useState("");
  const [cCtaText, setCCtaText] = useState("");
  const [cSelectedChildren, setCSelectedChildren] = useState<string[]>([]);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [categoryViewTab, setCategoryViewTab] = useState<"categories" | "collections">("categories");

  // Brand Logo State
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [logoSavedToast, setLogoSavedToast] = useState(false);

  // Platform Broadcasts from Lead Admin
  const [platformBroadcasts, setPlatformBroadcasts] = useState<PlatformBroadcast[]>([]);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("shopper_dismissed_broadcasts") || "[]");
      if (Array.isArray(saved)) setDismissedBroadcastIds(saved);
    } catch {}
  }, []);

  // Edit Theme Sections Modal State
  const [isEditThemeModalOpen, setIsEditThemeModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeDefinition | null>(null);
  const [editingSectionOrder, setEditingSectionOrder] = useState<string[]>([]);
  const [sectionSavedToast, setSectionSavedToast] = useState(false);

  // Upgrade Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<"starter" | "pro">("starter");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [courierNameInput, setCourierNameInput] = useState("");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");

  // Banner Modal State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bImageUrl, setBImageUrl] = useState("");
  const [bTargetType, setBTargetType] = useState<"category" | "product" | "">("");
  const [bSelectedCategory, setBSelectedCategory] = useState("");
  const [bSelectedProduct, setBSelectedProduct] = useState<ProductData | null>(null);
  const [bSearchQuery, setBSearchQuery] = useState("");

  // Settings State
  const [announcementInput, setAnnouncementInput] = useState("");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [codEnabledInput, setCodEnabledInput] = useState(true);
  const [codFeeInput, setCodFeeInput] = useState("0");

  // Brand Theme State (3 Fields: Primary, Background, Surface)
  const [customPrimary, setCustomPrimary] = useState("#111111");
  const [customBackground, setCustomBackground] = useState("#FDFBF7");
  const [customSurface, setCustomSurface] = useState("#FFFFFF");
  const [selectedFont, setSelectedFont] = useState("Outfit");
  const [colorSavedToast, setColorSavedToast] = useState(false);
  const [fontSavedToast, setFontSavedToast] = useState(false);
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<string>("all");
  const [themeAppliedToast, setThemeAppliedToast] = useState<string | null>(null);
  const [previewModalTheme, setPreviewModalTheme] = useState<ThemeDefinition | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const [copiedLink, setCopiedLink] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [authLoading, user, router]);

  // Sync activeSubdomain when URL search param changes
  useEffect(() => {
    if (urlStoreParam && urlStoreParam !== activeSubdomain) {
      setActiveSubdomain(urlStoreParam);
    }
  }, [urlStoreParam, activeSubdomain]);

  // Load user's real stores and subscribe to live changes
  useEffect(() => {
    if (!user) return;

    const applyStore = (s: StoreData) => {
      setStore(s);
      setAnnouncementInput(s.announcementText || "");
      setUpiIdInput(s.upiId || "");
      setCodEnabledInput(s.codEnabled);
      setCodFeeInput((s.codFee / 100).toString());
      setLogoUrlInput(s.logoUrl || "");
      if (s.customBrandTheme) {
        setCustomPrimary(s.customBrandTheme.primary || "#111111");
        setCustomBackground(s.customBrandTheme.background || "#FDFBF7");
        setCustomSurface(s.customBrandTheme.surface || "#FFFFFF");
      }
      if (s.fontFamily) {
        setSelectedFont(s.fontFamily);
      }
      if (s.pluginsConfig?.gmailIntegration) {
        setGmailEmailInput(s.pluginsConfig.gmailIntegration.connectedEmail || s.contactEmail || "");
        setGmailAutoAlerts(s.pluginsConfig.gmailIntegration.autoSendNewDropAlerts ?? false);
        setGmailConnected(s.pluginsConfig.gmailIntegration.isConnected ?? false);
      } else {
        setGmailEmailInput(s.contactEmail || "");
        setGmailConnected(false);
        setGmailAutoAlerts(false);
      }
    };

    const loadStoreData = () => {
      const myStores = storeService.getUserStores(user.uid, user.email || undefined);
      setUserStores(myStores);

      if (myStores.length === 0) {
        setStore(null);
        return;
      }

      // Check if requested store or current activeSubdomain is in user's stores
      let current = urlStoreParam ? myStores.find((s) => s.subdomain === urlStoreParam) : null;
      if (!current && activeSubdomain) {
        current = myStores.find((s) => s.subdomain === activeSubdomain);
      }
      if (!current) {
        current = myStores[0];
      }

      if (current) {
        setActiveSubdomain(current.subdomain);
        applyStore(current);
      }

      setPlatformBroadcasts(storeService.getPlatformBroadcasts());
    };

    loadStoreData();

    // Live subscription to Firebase Firestore updates
    const unsubscribe = storeService.subscribe(() => {
      loadStoreData();
    });

    return () => unsubscribe();
  }, [user, activeSubdomain, urlStoreParam]);

  const refreshStore = () => {
    if (!store) return;
    const loaded = storeService.getStore(store.subdomain);
    if (loaded) setStore({ ...loaded });
  };

  const activeBroadcasts = useMemo(() => {
    if (!store) return [];
    return platformBroadcasts.filter(
      (b) =>
        (b.target === "all" || b.target === store.planId) &&
        !dismissedBroadcastIds.includes(b.id)
    );
  }, [platformBroadcasts, store, dismissedBroadcastIds]);

  const handleDismissBroadcast = (id: string) => {
    setDismissedBroadcastIds((prev) => [...prev, id]);
    try {
      const saved = JSON.parse(localStorage.getItem("shopper_dismissed_broadcasts") || "[]");
      localStorage.setItem("shopper_dismissed_broadcasts", JSON.stringify([...saved, id]));
    } catch {}
  };

  const currentPlan = useMemo(() => {
    return PLATFORM_PLANS[store?.planId || "free"];
  }, [store?.planId]);

  const productQuota = useMemo(() => {
    if (!store) return { allowed: true, limit: 10, remaining: 10 };
    return canAddProduct(store.products.length, store.planId);
  }, [store]);

  const filteredThemes = useMemo(() => {
    const all = Object.values(PLATFORM_THEMES);
    if (themeCategoryFilter === "all") return all;
    if (themeCategoryFilter === "new-layouts") {
      return all.filter((t) => t.layoutType && t.layoutType !== "editorial");
    }
    return all.filter((t) => t.category === themeCategoryFilter);
  }, [themeCategoryFilter]);

  const ownerName = useMemo(() => {
    if (store?.ownerName) return store.ownerName;
    if (user?.displayName) return user.displayName;
    if (user?.email) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return "Store Owner";
  }, [store?.ownerName, user]);

  const ownerInitials = useMemo(() => {
    return ownerName.slice(0, 2).toUpperCase();
  }, [ownerName]);

  const greetingTime = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const unfulfilledOrders = useMemo(() => {
    if (!store?.orders) return [];
    return store.orders.filter((o) => o.fulfilmentStatus === "placed");
  }, [store?.orders]);

  const analyticsData = useMemo(() => {
    const totalRev = store?.orders.reduce((acc, o) => acc + o.total, 0) || 0;
    const totalOrd = store?.orders.length || 0;

    if (timeRange === "today") {
      const rev = totalRev > 0 ? Math.round(totalRev * 0.45) : 245000;
      const ord = totalOrd > 0 ? Math.max(1, Math.round(totalOrd * 0.4)) : 1;
      return {
        label: "TODAY",
        periodText: "vs yesterday",
        revenue: rev,
        deltaPercent: "+14.8%",
        isPositive: true,
        ordersCount: ord,
        ordersDelta: "+100%",
        pageViews: 186,
        pageViewsDelta: "+22%",
        visitors: 72,
        visitorsDelta: "+18%",
        conversionRate: "5.4%",
        conversionRateDelta: "+1.2%",
        chartPoints: [
          { x: 20, y: 94 },
          { x: 95, y: 80 },
          { x: 175, y: 52 },
          { x: 255, y: 66 },
          { x: 335, y: 34 },
          { x: 415, y: 41 },
          { x: 485, y: 29 },
        ],
        lastPoint: { x: 485, y: 29 },
        linePath: "M 20 94 C 55 94, 65 80, 95 80 C 135 80, 145 52, 175 52 C 215 52, 225 66, 255 66 C 295 66, 305 34, 335 34 C 375 34, 385 41, 415 41 C 455 41, 460 29, 485 29",
        areaPath: "M 20 94 C 55 94, 65 80, 95 80 C 135 80, 145 52, 175 52 C 215 52, 225 66, 255 66 C 295 66, 305 34, 335 34 C 375 34, 385 41, 415 41 C 455 41, 460 29, 485 29 L 485 115 L 20 115 Z",
        xLabels: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "Now"],
      };
    } else if (timeRange === "yesterday") {
      const rev = totalRev > 0 ? Math.round(totalRev * 0.35) : 189000;
      const ord = totalOrd > 0 ? Math.max(1, Math.round(totalOrd * 0.3)) : 1;
      return {
        label: "YESTERDAY",
        periodText: "vs day before",
        revenue: rev,
        deltaPercent: "+8.3%",
        isPositive: true,
        ordersCount: ord,
        ordersDelta: "+50%",
        pageViews: 142,
        pageViewsDelta: "+14%",
        visitors: 55,
        visitorsDelta: "+12%",
        conversionRate: "4.8%",
        conversionRateDelta: "+0.6%",
        chartPoints: [
          { x: 20, y: 98 },
          { x: 95, y: 88 },
          { x: 175, y: 72 },
          { x: 255, y: 48 },
          { x: 335, y: 56 },
          { x: 415, y: 46 },
          { x: 485, y: 32 },
        ],
        lastPoint: { x: 485, y: 32 },
        linePath: "M 20 98 C 55 98, 65 88, 95 88 C 135 88, 145 72, 175 72 C 215 72, 225 48, 255 48 C 295 48, 305 56, 335 56 C 375 56, 385 46, 415 46 C 455 46, 460 32, 485 32",
        areaPath: "M 20 98 C 55 98, 65 88, 95 88 C 135 88, 145 72, 175 72 C 215 72, 225 48, 255 48 C 295 48, 305 56, 335 56 C 375 56, 385 46, 415 46 C 455 46, 460 32, 485 32 L 485 115 L 20 115 Z",
        xLabels: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "11 PM"],
      };
    } else if (timeRange === "7d") {
      const rev = totalRev > 0 ? totalRev : 894000;
      const ord = totalOrd > 0 ? totalOrd : 12;
      return {
        label: "LAST 7 DAYS",
        periodText: "vs previous 7D",
        revenue: rev,
        deltaPercent: "+28.4%",
        isPositive: true,
        ordersCount: ord,
        ordersDelta: "+125%",
        pageViews: 1290,
        pageViewsDelta: "+45%",
        visitors: 480,
        visitorsDelta: "+38%",
        conversionRate: "5.9%",
        conversionRateDelta: "+1.8%",
        chartPoints: [
          { x: 20, y: 92 },
          { x: 95, y: 74 },
          { x: 175, y: 82 },
          { x: 255, y: 42 },
          { x: 335, y: 52 },
          { x: 415, y: 28 },
          { x: 485, y: 18 },
        ],
        lastPoint: { x: 485, y: 18 },
        linePath: "M 20 92 C 55 92, 65 74, 95 74 C 135 74, 145 82, 175 82 C 215 82, 225 42, 255 42 C 295 42, 305 52, 335 52 C 375 52, 385 28, 415 28 C 455 28, 460 18, 485 18",
        areaPath: "M 20 92 C 55 92, 65 74, 95 74 C 135 74, 145 82, 175 82 C 215 82, 225 42, 255 42 C 295 42, 305 52, 335 52 C 375 52, 385 28, 415 28 C 455 28, 460 18, 485 18 L 485 115 L 20 115 Z",
        xLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      };
    } else {
      const rev = totalRev > 0 ? Math.round(totalRev * 2.8) : 2650000;
      const ord = totalOrd > 0 ? Math.round(totalOrd * 2.5) : 38;
      return {
        label: "LAST 30 DAYS",
        periodText: "vs previous month",
        revenue: rev,
        deltaPercent: "+41.2%",
        isPositive: true,
        ordersCount: ord,
        ordersDelta: "+180%",
        pageViews: 5420,
        pageViewsDelta: "+62%",
        visitors: 1950,
        visitorsDelta: "+52%",
        conversionRate: "6.2%",
        conversionRateDelta: "+2.4%",
        chartPoints: [
          { x: 20, y: 102 },
          { x: 95, y: 86 },
          { x: 175, y: 68 },
          { x: 255, y: 52 },
          { x: 335, y: 38 },
          { x: 415, y: 26 },
          { x: 485, y: 14 },
        ],
        lastPoint: { x: 485, y: 14 },
        linePath: "M 20 102 C 55 102, 65 86, 95 86 C 135 86, 145 68, 175 68 C 215 68, 225 52, 255 52 C 295 52, 305 38, 335 38 C 375 38, 385 26, 415 26 C 455 26, 460 14, 485 14",
        areaPath: "M 20 102 C 55 102, 65 86, 95 86 C 135 86, 145 68, 175 68 C 215 68, 225 52, 255 52 C 295 52, 305 38, 335 38 C 375 38, 385 26, 415 26 C 455 26, 460 14, 485 14 L 485 115 L 20 115 Z",
        xLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      };
    }
  }, [store, timeRange]);

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!dCode.trim() || !dValue) {
      alert("Please provide both a coupon code and discount value.");
      return;
    }

    const cleanCode = dCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const val = parseFloat(dValue);
    const minVal = dMinOrder ? Math.round(parseFloat(dMinOrder) * 100) : 0;
    const maxDiscountVal = dMaxDiscount ? Math.round(parseFloat(dMaxDiscount) * 100) : undefined;

    const res = storeService.addDiscount(store.subdomain, {
      code: cleanCode,
      type: dType,
      value: dType === "percentage" ? Math.min(100, Math.max(1, val)) : Math.round(val * 100),
      minOrderValue: minVal,
      maxDiscount: maxDiscountVal,
      isActive: dIsActive,
    });

    if (!res) {
      alert("Failed to create discount code.");
      return;
    }

    refreshStore();
    setIsDiscountModalOpen(false);
    setDCode("");
    setDValue("");
    setDMinOrder("");
    setDMaxDiscount("");
  };

  const handleToggleDiscount = (discountId: string) => {
    if (!store) return;
    storeService.toggleDiscount(store.subdomain, discountId);
    refreshStore();
  };

  const handleDeleteDiscount = (discountId: string, code: string) => {
    if (!store) return;
    if (confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      storeService.deleteDiscount(store.subdomain, discountId);
      refreshStore();
    }
  };

  // Handle Product Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    const pricePaise = Math.round(parseFloat(pPrice || "0") * 100);
    const comparePricePaise = pComparePrice ? Math.round(parseFloat(pComparePrice) * 100) : undefined;
    const stockNum = parseInt(pStock || "0", 10);

    if (editingProductId) {
      storeService.updateProduct(store.subdomain, editingProductId, {
        title: pTitle,
        category: pCategory,
        price: pricePaise,
        compareAtPrice: comparePricePaise,
        stock: stockNum,
        description: pDesc,
        images: pImageUrl ? [pImageUrl] : undefined,
      });
    } else {
      const res = storeService.addProduct(store.subdomain, {
        title: pTitle,
        slug: pTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: pDesc,
        price: pricePaise,
        compareAtPrice: comparePricePaise,
        stock: stockNum,
        category: pCategory || "General",
        images: [
          pImageUrl ||
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 5.0,
        reviewCount: 0,
      });

      if (!res.success) {
        alert(res.error);
        setActiveTab("billing");
        return;
      }
    }

    refreshStore();
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setPTitle("");
    setPCategory("");
    setPPrice("");
    setPComparePrice("");
    setPStock("10");
    setPDesc("");
    setPImageUrl("");
  };

  const openEditProduct = (prod: ProductData) => {
    setEditingProductId(prod.id);
    setPTitle(prod.title);
    setPCategory(prod.category);
    setPPrice((prod.price / 100).toString());
    setPComparePrice(prod.compareAtPrice ? (prod.compareAtPrice / 100).toString() : "");
    setPStock(prod.stock.toString());
    setPDesc(prod.description);
    setPImageUrl(prod.images[0] || "");
    setIsProductModalOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCName("");
    setCSlug("");
    setCDesc("");
    setCImageUrl("");
    setCIsActive(true);
    setCIsParent(false);
    setCParentId("");
    setCSubtitle("");
    setCCtaText("");
    setCSelectedChildren([]);
  };

  const openAddCategory = () => {
    resetCategoryForm();
    setCIsParent(false);
    setCategoryViewTab("categories");
    setIsCategoryModalOpen(true);
  };

  const openAddParentCollection = () => {
    resetCategoryForm();
    setCIsParent(true);
    setCSubtitle("Modern fits for everyday style.");
    setCCtaText("Shop Collection");
    setCategoryViewTab("collections");
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryData) => {
    setEditingCategoryId(cat.id);
    setCName(cat.name);
    setCSlug(cat.slug);
    setCDesc(cat.description || "");
    setCImageUrl(cat.imageUrl || "");
    setCIsActive(cat.isActive ?? true);
    setCIsParent(cat.isParent ?? false);
    setCParentId(cat.parentId || "");
    setCSubtitle(cat.subtitle || "");
    setCCtaText(cat.ctaText || "");
    if (cat.isParent) {
      const assigned = (store?.categories || [])
        .filter((c) => !c.isParent && c.parentId === cat.id)
        .map((c) => c.id);
      setCSelectedChildren(assigned);
    } else {
      setCSelectedChildren([]);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !cName.trim()) return;

    const finalSlug = (cSlug.trim() || cName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let targetCatId = editingCategoryId;

    if (editingCategoryId) {
      storeService.updateCategory(store.subdomain, editingCategoryId, {
        name: cName.trim(),
        slug: finalSlug,
        description: cDesc.trim(),
        imageUrl: cImageUrl.trim(),
        isActive: cIsActive,
        isParent: cIsParent,
        parentId: cIsParent ? undefined : (cParentId || undefined),
        subtitle: cSubtitle.trim() || undefined,
        ctaText: cCtaText.trim() || undefined,
      });
    } else {
      const newCat = storeService.addCategory(store.subdomain, {
        name: cName.trim(),
        slug: finalSlug,
        description: cDesc.trim(),
        imageUrl: cImageUrl.trim(),
        isActive: cIsActive,
        isParent: cIsParent,
        parentId: cIsParent ? undefined : (cParentId || undefined),
        subtitle: cSubtitle.trim() || undefined,
        ctaText: cCtaText.trim() || undefined,
      });
      if (newCat?.category) targetCatId = newCat.category.id;
    }

    // If this category is a Parent Collection Card, sync its child categories!
    if (cIsParent && targetCatId && store.categories) {
      store.categories.forEach((cat) => {
        if (cat.isParent) return;
        const shouldBeChild = cSelectedChildren.includes(cat.id);
        if (shouldBeChild && cat.parentId !== targetCatId) {
          storeService.updateCategory(store.subdomain, cat.id, { parentId: targetCatId });
        } else if (!shouldBeChild && cat.parentId === targetCatId) {
          storeService.updateCategory(store.subdomain, cat.id, { parentId: undefined });
        }
      });
    }

    refreshStore();
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (!store) return;
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      storeService.deleteCategory(store.subdomain, catId);
      refreshStore();
    }
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (!store || !store.categories) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= store.categories.length) return;

    const reordered = [...store.categories];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    storeService.reorderCategories(store.subdomain, reordered.map((c) => c.id));
    refreshStore();
  };

  const handleToggleCategoryActive = (cat: CategoryData) => {
    if (!store) return;
    storeService.updateCategory(store.subdomain, cat.id, {
      isActive: !cat.isActive,
    });
    refreshStore();
  };

  const handleSaveBrandLogo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!store) return;
    storeService.updateStore(store.subdomain, {
      logoUrl: logoUrlInput.trim() || undefined,
    });
    setLogoSavedToast(true);
    refreshStore();
    setTimeout(() => setLogoSavedToast(false), 2500);
  };

  const handleUpgradePlan = (planId: "starter" | "pro") => {
    if (!store) return;
    storeService.upgradeStorePlan(store.subdomain, planId);
    setUpgradeSuccess(true);
    refreshStore();
    setTimeout(() => {
      setUpgradeSuccess(false);
    }, 3000);
  };

  const handleActivateTheme = (themeSlug: string) => {
    if (!store) return;
    const res = storeService.setStoreTheme(store.subdomain, themeSlug);
    if (!res.success) {
      alert(res.error);
      setActiveTab("billing");
      return;
    }
    const themeName = PLATFORM_THEMES[themeSlug]?.name || themeSlug;
    setThemeAppliedToast(themeName);
    refreshStore();
    setTimeout(() => setThemeAppliedToast(null), 3500);
  };

  const handleOpenEditTheme = (theme: ThemeDefinition) => {
    setEditingTheme(theme);
    const existingOrder =
      store?.themeSectionOrders?.[theme.slug] ||
      store?.homepageSections ||
      DEFAULT_HOMEPAGE_SECTION_IDS;
    const sanitized = [...existingOrder];
    DEFAULT_HOMEPAGE_SECTION_IDS.forEach((id) => {
      if (!sanitized.includes(id)) sanitized.push(id);
    });
    setEditingSectionOrder(sanitized);
    setIsEditThemeModalOpen(true);
  };

  const handleSaveSectionOrder = () => {
    if (!store || !editingTheme) return;
    const updatedStore = storeService.setStoreHomepageSections(
      store.subdomain,
      editingSectionOrder,
      editingTheme.slug
    );
    setStore(updatedStore);
    setIsEditThemeModalOpen(false);
    setSectionSavedToast(true);
    setTimeout(() => setSectionSavedToast(false), 3000);
  };

  const handleResetSectionOrder = () => {
    setEditingSectionOrder([...DEFAULT_HOMEPAGE_SECTION_IDS]);
  };

  const handleResetColorsToTheme = () => {
    if (!store) return;
    const currentTheme = getTheme(store.activeThemeSlug);
    setCustomPrimary(currentTheme.tokens.primary);
    setCustomBackground(currentTheme.tokens.background);
    setCustomSurface(currentTheme.tokens.card);
    storeService.updateStore(store.subdomain, {
      customBrandTheme: {
        primary: currentTheme.tokens.primary,
        background: currentTheme.tokens.background,
        surface: currentTheme.tokens.card,
      },
    });
    setColorSavedToast(true);
    refreshStore();
    setTimeout(() => setColorSavedToast(false), 2500);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderData["fulfilmentStatus"]
  ) => {
    if (!store) return;
    storeService.updateOrderStatus(store.subdomain, orderId, {
      fulfilmentStatus: status,
      courierName: courierNameInput || undefined,
      trackingNumber: trackingNumberInput || undefined,
      trackingUrl: courierNameInput ? "https://www.delhivery.com/track" : undefined,
    });
    refreshStore();
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = storeService.getStore(store.subdomain)?.orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleVerifyPayment = (orderId: string) => {
    if (!store) return;
    storeService.updateOrderStatus(store.subdomain, orderId, {
      paymentStatus: "paid",
    });
    refreshStore();
    if (selectedOrder && selectedOrder.id === orderId) {
      const updated = storeService.getStore(store.subdomain)?.orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    storeService.updateStore(store.subdomain, {
      announcementText: announcementInput,
      upiId: upiIdInput,
      codEnabled: codEnabledInput,
      codFee: Math.round(parseFloat(codFeeInput || "0") * 100),
    });
    alert("Settings saved successfully.");
    refreshStore();
  };

  const handleSaveBrandColors = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!store) return;

    storeService.updateStore(store.subdomain, {
      customBrandTheme: {
        primary: customPrimary,
        background: customBackground,
        surface: customSurface,
      },
    });
    setColorSavedToast(true);
    refreshStore();
    setTimeout(() => setColorSavedToast(false), 2500);
  };

  const handleApplyFont = (fontId: string) => {
    if (!store) return;
    setSelectedFont(fontId);
    storeService.updateStore(store.subdomain, {
      fontFamily: fontId,
    });
    setFontSavedToast(true);
    refreshStore();
    setTimeout(() => setFontSavedToast(false), 2500);
  };

  const handleSaveGmailConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!store) return;
    storeService.updatePluginsConfig(store.subdomain, {
      gmailIntegration: {
        isConnected: gmailConnected,
        connectedEmail: gmailEmailInput,
        autoSendNewDropAlerts: gmailAutoAlerts,
        campaignsSentCount: store.pluginsConfig?.gmailIntegration?.campaignsSentCount || 0,
        lastCampaignSentAt: store.pluginsConfig?.gmailIntegration?.lastCampaignSentAt,
      },
    });
    setGmailSaveToast(true);
    refreshStore();
    setTimeout(() => setGmailSaveToast(false), 2500);
  };

  const handleSendTestEmail = () => {
    setTestEmailToast(true);
    setTimeout(() => setTestEmailToast(false), 3000);
  };

  const handleSendDropAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!dropSubject.trim() || !dropMessage.trim()) {
      alert("Please enter both an email subject and a drop announcement message.");
      return;
    }

    setDropSending(true);
    setTimeout(() => {
      storeService.sendDropAnnouncement(store.subdomain, {
        subject: dropSubject.trim(),
        message: dropMessage.trim(),
        collectionName: dropCollection.trim() || "New Collection Drop",
      });
      setDropSending(false);
      setDropSentSuccess(true);
      setDropSubject("");
      setDropCollection("");
      setDropMessage("");
      refreshStore();
      setTimeout(() => setDropSentSuccess(false), 5000);
    }, 600);
  };

  const handleRemoveSubscriber = (emailToRemove: string) => {
    if (!store) return;
    const currentList = store.subscribers || [];
    const updated = currentList.filter((s) => s.email !== emailToRemove);
    storeService.updateStore(store.subdomain, {
      subscribers: updated,
    });
    refreshStore();
  };

  const BRAND_COLOR_PRESETS = [
    {
      name: "Lume Classic",
      subtitle: "Cream, Black & White",
      primary: "#111111",
      background: "#FDFBF7",
      surface: "#FFFFFF",
    },
    {
      name: "Pure Noir",
      subtitle: "Monochrome Minimal",
      primary: "#0A0A0A",
      background: "#F5F5F5",
      surface: "#FFFFFF",
    },
    {
      name: "Warm Sand & Clay",
      subtitle: "Earthy Boutique",
      primary: "#78350F",
      background: "#FAF6F0",
      surface: "#FFFFFF",
    },
    {
      name: "Nordic Slate",
      subtitle: "Clean Architectural",
      primary: "#0F172A",
      background: "#F1F5F9",
      surface: "#FFFFFF",
    },
    {
      name: "Forest Emerald",
      subtitle: "Botanical Luxury",
      primary: "#14382B",
      background: "#F4F7F4",
      surface: "#FFFFFF",
    },
  ];

  // Categories and Products search for Banner redirect
  const availableCategories = useMemo(() => {
    if (!store) return [];
    const fromProducts = Array.from(new Set(store.products.map((p) => p.category).filter(Boolean)));
    const defaults = ["T-Shirts", "Shirts", "Hoodies", "Jeans", "Jackets", "Dresses", "Co-ords", "Activewear", "Footwear", "Accessories"];
    return Array.from(new Set([...fromProducts, ...defaults]));
  }, [store]);

  const filteredCategories = useMemo(() => {
    if (!bSearchQuery.trim()) return availableCategories;
    const q = bSearchQuery.toLowerCase();
    return availableCategories.filter((c) => c.toLowerCase().includes(q));
  }, [availableCategories, bSearchQuery]);

  const filteredProducts = useMemo(() => {
    if (!store) return [];
    if (!bSearchQuery.trim()) return store.products;
    const q = bSearchQuery.toLowerCase();
    return store.products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [store, bSearchQuery]);

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !bImageUrl.trim()) {
      alert("Please upload or provide a banner image URL.");
      return;
    }

    if (!bTargetType) {
      alert("Please select whether this banner redirects to a Category or a Product.");
      return;
    }

    if (bTargetType === "category" && !bSelectedCategory) {
      alert("Please select which category this banner redirects to.");
      return;
    }

    if (bTargetType === "product" && !bSelectedProduct) {
      alert("Please select which product this banner redirects to.");
      return;
    }

    const ctaLink =
      bTargetType === "category"
        ? `/s/${store.subdomain}?category=${encodeURIComponent(bSelectedCategory)}`
        : `/s/${store.subdomain}/products/${bSelectedProduct?.slug}`;

    const newBanner: BannerData = {
      id: `banner-${Date.now().toString(36)}`,
      storeId: store.id,
      title: bTargetType === "category" ? `${bSelectedCategory} Collection` : bSelectedProduct?.title || "Hero Banner",
      imageUrl: bImageUrl.trim(),
      ctaLink,
      targetType: bTargetType,
      targetValue: bTargetType === "category" ? bSelectedCategory : bSelectedProduct?.slug,
      position: store.banners.length,
      isActive: true,
    };

    storeService.saveBanners(store.subdomain, [...store.banners, newBanner]);
    refreshStore();
    setIsBannerModalOpen(false);
    setBImageUrl("");
    setBTargetType("");
    setBSelectedCategory("");
    setBSelectedProduct(null);
    setBSearchQuery("");
  };

  const handleMoveBanner = (index: number, direction: "up" | "down") => {
    if (!store) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= store.banners.length) return;

    const updated = [...store.banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    updated.forEach((b, idx) => {
      b.position = idx;
    });

    storeService.saveBanners(store.subdomain, updated);
    refreshStore();
  };

  const handleToggleBannerActive = (bannerId: string) => {
    if (!store) return;
    const updated = store.banners.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b));
    storeService.saveBanners(store.subdomain, updated);
    refreshStore();
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (!store) return;
    const updated = store.banners.filter((b) => b.id !== bannerId);
    storeService.saveBanners(store.subdomain, updated);
    refreshStore();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Verifying seller session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4">
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 max-w-sm shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-800">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Merchant Sign In Required</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Please sign in with your seller account to manage your store.
            </p>
          </div>
          <Link href="/login?redirect=/dashboard" className="block pt-2">
            <Button className="w-full bg-[#111111] text-white text-xs">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!store || userStores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4">
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 max-w-md shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-[#111111]">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Welcome to Shopper!</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Signed in as <strong>{user.email}</strong>. You have not created an online store yet.
            </p>
          </div>
          <p className="text-xs text-neutral-600">
            Launch your custom domain store, setup direct UPI payments, and add your catalog in under 60 seconds.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/register">
              <Button size="lg" className="w-full bg-[#111111] text-white hover:bg-[#27272A] text-xs">
                Launch My Online Store
              </Button>
            </Link>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="text-xs text-neutral-500 hover:text-black py-1 font-medium"
            >
              Sign out of account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = store.orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = store.orders.length;
  const totalProducts = store.products.length;
<<<<<<< HEAD
  const totalCustomers = store.customers?.length || 0;
=======
>>>>>>> e4a5a15ba511a39d127b3bcbeea876793eb17992
  const liveStoreUrl = `/s/${store.subdomain}`;
  const storeWebDomain = `${store.subdomain}.${siteConfig.domain}`;
  const storePublicUrl = `https://${storeWebDomain}`;

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-[#111111]">
      {/* Sidebar Navigation (Fixed to viewport height, stays permanently fixed and never moves or stretches) */}
      <aside className="hidden md:flex md:w-64 fixed inset-y-0 left-0 bg-white border-r border-neutral-200 flex-col z-30 shadow-xs">
        {/* Brand Header */}
        <div className="p-4 pb-3 border-b border-neutral-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                S
              </div>
              <span className="font-bold text-base tracking-tight">Shopper Admin</span>
            </div>
            {store && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase tracking-wider">
                {store.planId}
              </span>
            )}
          </div>

          {userStores.length > 1 && (
            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px]">
              <span className="text-neutral-500 font-medium">Store</span>
              <select
                value={store.subdomain}
                onChange={(e) => {
                  setActiveSubdomain(e.target.value);
                  router.push(`/dashboard?store=${e.target.value}`);
                }}
                className="text-[10px] bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-700 font-medium cursor-pointer"
              >
                {userStores.map((s) => (
                  <option key={s.subdomain} value={s.subdomain}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Links (Compact, grouped, and scrollable if height is restricted) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "products"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Products</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800 font-bold">
                {totalProducts}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("categories")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "categories"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800 font-bold">
                {store.categories?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "orders"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
              </div>
              {store.orders.some((o) => o.fulfilmentStatus === "placed") && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("discounts")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "discounts"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4" />
                <span>Discounts</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800 font-bold">
                {store.discounts?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "customers"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "reviews"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>Reviews</span>
              </div>
              {!canUseReviews(store.planId) && (
                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  <Lock className="w-2.5 h-2.5" />
                  PAID
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("banners")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "banners"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Banners</span>
            </button>

            <button
              onClick={() => setActiveTab("themes")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "themes"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Themes</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "billing"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                <span>Subscription</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "settings"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("plugins")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === "plugins"
                  ? "bg-[#111111] text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <Plug className="w-4 h-4" />
                <span>Plugins</span>
              </div>
              {!isPaidPlan(store.planId) ? (
                <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  <Lock className="w-2.5 h-2.5" />
                  PAID
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Active
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Pinned Bottom Footer: Catalog Quota + Account Info */}
        <div className="p-3 border-t border-neutral-200 shrink-0 bg-neutral-50/70 space-y-3">
          {/* Plan Quota Meter Box */}
          <div className="p-3 rounded-lg bg-white border border-neutral-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-600">Catalog Quota</span>
              <span className="text-[11px] font-bold text-neutral-900">
                {totalProducts} / {currentPlan.maxProducts >= 9999 ? "Unlimited" : currentPlan.maxProducts}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full bg-[#111111] transition-all"
                style={{
                  width: `${Math.min(100, (totalProducts / (currentPlan.maxProducts >= 9999 ? 100 : currentPlan.maxProducts)) * 100)}%`,
                }}
              />
            </div>

            {store.planId === "free" && (
              <Button
                size="sm"
                className="w-full text-xs font-semibold bg-[#111111] hover:bg-black text-white rounded-md h-7 py-0"
                onClick={() => setActiveTab("billing")}
              >
                Upgrade Subscription
              </Button>
            )}
          </div>

          {/* Merchant Account & Sign Out */}
          <div className="flex items-center justify-between px-1 pt-2.5 mt-2 border-t border-neutral-100">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-[9px] text-neutral-400 block font-semibold uppercase tracking-wider">Signed In As</span>
              <span className="text-xs font-bold text-neutral-800 truncate block">{user?.email}</span>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              title="Sign Out"
              className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Offset by fixed sidebar on desktop) */}
      <div className="md:pl-64 flex flex-col min-h-screen">
<<<<<<< HEAD
        {/* Mobile Fixed Top Header (Mobile Only - Matching Desktop Brand Header) */}
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 px-4 py-3 shrink-0 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                S
              </div>
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-neutral-900 leading-none">Shopper Admin</span>
                  {store && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase tracking-wider shrink-0">
                      {store.planId}
                    </span>
                  )}
                </div>
                {store?.name && (
                  <span className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                    {store.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {userStores.length > 1 && (
                <select
                  value={store.subdomain}
                  onChange={(e) => {
                    setActiveSubdomain(e.target.value);
                    router.push(`/dashboard?store=${e.target.value}`);
                  }}
                  className="text-[11px] bg-white border border-neutral-200 rounded-md px-2 py-1 text-neutral-700 font-medium cursor-pointer shadow-2xs max-w-[120px] truncate"
                >
                  {userStores.map((s) => (
                    <option key={s.subdomain} value={s.subdomain}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                title="Notification Center"
              >
                <Bell className="w-4 h-4" />
                {hasUnreadNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </header>

=======
>>>>>>> e4a5a15ba511a39d127b3bcbeea876793eb17992
        {/* Top Workspace Header (Matching reference mockup exactly, no coins) */}
        <header className="w-full bg-white border-b border-neutral-200/80 px-6 sm:px-10 py-7 sm:py-8 flex flex-col md:flex-row md:items-start justify-between gap-6 shrink-0">
          <div className="min-w-0">
            {activeTab === "overview" ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                  Dashboard
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-neutral-900 tracking-tight leading-[1.12]">
                  {greetingTime},<br />
                  <span>{ownerName}</span>
                </h1>
                <p className="text-sm sm:text-base text-neutral-500 font-medium mt-2">
                  Welcome back to your store. Ready to make some sales today?
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-neutral-400 font-medium">Store URL:</span>
                  <a
                    href={liveStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-neutral-800 font-mono text-xs font-semibold border border-neutral-300/80 shadow-2xs hover:border-black transition-colors"
                    title="Open live storefront"
                  >
                    <Globe className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{storeWebDomain}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400 ml-0.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {activeTab === "products" && "Products"}
                  {activeTab === "categories" && "Categories & Collections"}
                  {activeTab === "orders" && "Orders"}
                  {activeTab === "discounts" && "Discounts"}
                  {activeTab === "customers" && "Customers"}
                  {activeTab === "reviews" && "Reviews"}
                  {activeTab === "banners" && "Banners"}
                  {activeTab === "themes" && "Themes"}
                  {activeTab === "billing" && "Subscription"}
                  {activeTab === "settings" && "Settings"}
                  {activeTab === "plugins" && "Plugins"}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
                  {activeTab === "products" && "Manage your products, pricing, and stock."}
                  {activeTab === "categories" && "Organize products into categories and homepage collections."}
                  {activeTab === "orders" && "Track customer orders and shipments."}
                  {activeTab === "discounts" && "Create promo codes and discount coupons."}
                  {activeTab === "customers" && "View your customers and order history."}
                  {activeTab === "reviews" && "Manage customer ratings and reviews."}
                  {activeTab === "banners" && "Upload storefront hero promotional banners."}
                  {activeTab === "themes" && "Customize your storefront theme and style."}
                  {activeTab === "billing" && "Manage your subscription plan and limits."}
                  {activeTab === "settings" && "Configure payments, payouts, and store details."}
                  {activeTab === "plugins" && "Email alerts and customer notifications."}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-start pt-1">
            {/* Notification Center Trigger */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2.5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-all hover:scale-105"
              title="Notification Center"
            >
              <Bell className="w-4 h-4" />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(storePublicUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title={`Copy store URL: ${storeWebDomain}`}
            >
              {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-600" />}
              <span>{copiedLink ? "Copied" : "Copy Link"}</span>
            </button>

            <Link href={liveStoreUrl} target="_blank">
              <Button size="sm" className="bg-[#141517] text-white hover:bg-black rounded-xl text-xs gap-1.5 shadow-2xs h-9 px-4 font-semibold">
                <span>Visit Live Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Workspace Area (Scrolls smoothly under the fixed top header) */}
        <main className="flex-1 p-4 sm:p-8 pb-28 md:pb-12 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-enter-blur">

            {/* Feature 3: Product Quota Usage Banner (Dark Card from reference screenshot) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141517] text-white border border-neutral-800 shadow-sm relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left Column: Progress & Limit */}
              <div className="flex-1 max-w-xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {store.products.length} of {currentPlan.maxProducts >= 9999 ? "unlimited" : currentPlan.maxProducts} free products used
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/80">
                    {store.planId}
                  </span>
                </div>

                {/* Smooth Gradient Progress Bar */}
                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#10B981] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(8, (store.products.length / (currentPlan.maxProducts >= 9999 ? 100 : currentPlan.maxProducts)) * 100))}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-neutral-400 font-normal">
                  Starter plan lets you add up to 100 products and custom domain unlocks.
                </p>
              </div>

              {/* Right Column: CTA */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300">
                  <Sparkles className="w-4 h-4 text-neutral-300 shrink-0" />
                  <span className="max-w-[210px] leading-tight">
                    Unlock more products, custom domain and premium features.
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab("billing")}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  <span>See plans from ₹499/mo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Features 4, 5, 6, 7, 8, 9: Store Performance Card with Sparkline & Filters */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-6">
              {/* Header with Title and Time-Range Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-neutral-800" />
                  <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    Store Performance
                  </span>
                </div>

                {/* Feature 4: Time-Range Filters (Today, Yesterday, 7D, 30D) */}
                <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 border border-neutral-200/60 shrink-0 self-start sm:self-auto">
                  {(["today", "yesterday", "7d", "30d"] as const).map((range) => {
                    const isActive = timeRange === range;
                    const labels: Record<string, string> = {
                      today: "Today",
                      yesterday: "Yesterday",
                      "7d": "7D",
                      "30d": "30D",
                    };
                    return (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-[#18181B] text-white shadow-xs"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        {labels[range]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Big Revenue Stat with Delta Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
                  ₹{(analyticsData.revenue / 100).toLocaleString("en-IN")}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-[#EAF8F1] px-2.5 py-1 rounded-full border border-emerald-200/70">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{analyticsData.deltaPercent}</span>
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  {analyticsData.periodText}
                </span>
              </div>

              {/* Feature 6: Visual Sales Trend Graph with Y-Axis & Horizontal Grids */}
              <div className="relative pt-2">
                <div className="flex items-stretch gap-3">
                  {/* Y-Axis Labels */}
                  <div className="flex flex-col justify-between text-[11px] font-medium text-neutral-400 select-none pb-5 text-right w-6 shrink-0">
                    <span>3K</span>
                    <span>2K</span>
                    <span>1K</span>
                    <span>0</span>
                  </div>

                  {/* Chart Area */}
                  <div className="flex-1 min-w-0">
                    <div className="w-full h-36 sm:h-44 relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="performanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                            <stop offset="70%" stopColor="#10B981" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid Lines */}
                        <line x1="0" y1="10" x2="500" y2="10" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="45" x2="500" y2="45" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="115" x2="500" y2="115" stroke="#F1F5F9" strokeWidth="1" />

                        {/* Area Fill */}
                        <path
                          d={analyticsData.areaPath}
                          fill="url(#performanceAreaGrad)"
                        />

                        {/* Line Stroke */}
                        <path
                          d={analyticsData.linePath}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Points along the path */}
                        {analyticsData.chartPoints.map((pt, idx) => (
                          <circle
                            key={idx}
                            cx={pt.x}
                            cy={pt.y}
                            r="3.5"
                            fill="#10B981"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                        ))}

                        {/* Latest point marker */}
                        <circle cx={analyticsData.lastPoint.x} cy={analyticsData.lastPoint.y} r="5" fill="#10B981" />
                      </svg>
                    </div>

                    {/* X-Axis Time Markers */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-medium pt-2 border-t border-neutral-100">
                      {analyticsData.xLabels.map((lbl, idx) => (
                        <span key={idx}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 7 & 8: 4 Responsive Metric Cards (Orders, Page Views, Visitors, Conversion Rate) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* Card 1: Orders */}
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 hover:bg-neutral-100/60 transition-all flex items-center justify-between group cursor-pointer hover-lift animate-enter-slide-up stagger-1">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-800 shrink-0 shadow-2xs">
                      <ShoppingBag className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500">
                        <span>Orders</span>
                        <Info className="w-3 h-3 text-neutral-400" />
                      </div>
                      <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
                        {analyticsData.ordersCount}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span>{analyticsData.ordersDelta}</span>
                        <span className="text-neutral-400 font-normal">vs yesterday</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0 ml-2" />
                </div>

                {/* Card 2: Page Views */}
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 hover:bg-neutral-100/60 transition-all flex items-center justify-between group cursor-pointer hover-lift animate-enter-slide-up stagger-2">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-800 shrink-0 shadow-2xs">
                      <Eye className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500">
                        <span>Page Views</span>
                        <Info className="w-3 h-3 text-neutral-400" />
                      </div>
                      <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
                        {analyticsData.pageViews.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span>{analyticsData.pageViewsDelta}</span>
                        <span className="text-neutral-400 font-normal">vs yesterday</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0 ml-2" />
                </div>

                {/* Card 3: Visitors */}
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 hover:bg-neutral-100/60 transition-all flex items-center justify-between group cursor-pointer hover-lift animate-enter-slide-up stagger-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-800 shrink-0 shadow-2xs">
                      <Users className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500">
                        <span>Visitors</span>
                        <Info className="w-3 h-3 text-neutral-400" />
                      </div>
                      <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
                        {analyticsData.visitors.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span>{analyticsData.visitorsDelta}</span>
                        <span className="text-neutral-400 font-normal">vs yesterday</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0 ml-2" />
                </div>

                {/* Card 4: Conversion Rate */}
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-neutral-200/70 hover:bg-neutral-100/60 transition-all flex items-center justify-between group cursor-pointer hover-lift animate-enter-slide-up stagger-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-800 shrink-0 shadow-2xs">
                      <ShoppingCart className="w-5 h-5 text-neutral-800" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500">
                        <span>Conversion Rate</span>
                        <Info className="w-3 h-3 text-neutral-400" />
                      </div>
                      <span className="text-2xl font-black text-neutral-900 tracking-tight block mt-0.5">
                        {analyticsData.conversionRate}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                        <TrendingUp className="w-3 h-3 shrink-0" />
                        <span>{analyticsData.conversionRateDelta}</span>
                        <span className="text-neutral-400 font-normal">vs yesterday</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0 ml-2" />
                </div>
              </div>

              {/* Feature 9: "All metrics ⌵" Expandable Drawer */}
              <div className="pt-2 border-t border-neutral-100">
                <button
                  onClick={() => setIsAllMetricsExpanded(!isAllMetricsExpanded)}
                  className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-black transition-colors"
                >
                  <span>All metrics</span>
                  {isAllMetricsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAllMetricsExpanded && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-3 border-t border-dashed border-neutral-200">
                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Net GMV</span>
                      <span className="text-base font-extrabold text-neutral-900 mt-1 block">
                        ₹{(totalRevenue / 100).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">Delivered revenue</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Avg Order Value</span>
                      <span className="text-base font-extrabold text-neutral-900 mt-1 block">
                        ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders / 100).toLocaleString("en-IN") : 0}
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">AOV per checkout</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Conversion Rate</span>
                      <span className="text-base font-extrabold text-neutral-900 mt-1 block">3.8%</span>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">+0.6% vs avg</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Add to Cart</span>
                      <span className="text-base font-extrabold text-neutral-900 mt-1 block">12.4%</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">Cart initiation</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80 col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Repeat Buyers</span>
                      <span className="text-base font-extrabold text-neutral-900 mt-1 block">24.5%</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5 block">Customer retention</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Center & Catalog Insights (Non-redundant, high-value workspace) */}
            <div className="space-y-4">
              {/* Instant 1-Click Operations Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 tracking-tight">Quick Actions:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (!productQuota.allowed) {
                        setActiveTab("billing");
                        return;
                      }
                      resetProductForm();
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] text-white hover:bg-black text-xs font-semibold shadow-2xs transition-all hover:scale-[1.02]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>

                  <button
                    onClick={() => {
                      setDCode("");
                      setDType("percentage");
                      setDValue("");
                      setDMinOrder("");
                      setDMaxDiscount("");
                      setDIsActive(true);
                      setIsDiscountModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold shadow-2xs transition-all"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>New Coupon</span>
                  </button>

                  <button
                    onClick={openAddCategory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold shadow-2xs transition-all"
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>New Collection</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`Shop our collection on ${store.name} 👉 ${storePublicUrl}`);
                      window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all"
                    title="Share store catalog on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature 11: Unfulfilled Orders Action Card (Matches Ooulet empty state or pending cards) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
              {unfulfilledOrders.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                          {unfulfilledOrders.length} order{unfulfilledOrders.length > 1 ? "s" : ""} awaiting dispatch
                        </h4>
                        <p className="text-[11px] text-neutral-500">
                          Provide courier tracking and fulfill shipments to update customer statuses
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs rounded-md"
                      onClick={() => setActiveTab("orders")}
                    >
                      See all
                    </Button>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {unfulfilledOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50 rounded-lg px-2 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-900">{order.number}</span>
                            <span className="text-xs text-neutral-800 font-medium">{order.customer.name}</span>
                            <Badge variant="neutral" className="text-[9px] uppercase bg-amber-50 text-amber-800 border-amber-200">
                              {order.paymentMethod}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {order.items.length} item(s) • ₹{(order.total / 100).toLocaleString("en-IN")} • {order.address.city}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          className="bg-[#111111] text-white hover:bg-black text-xs h-7 rounded-md"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Fulfill
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Exact Ooulet Empty State */
                <div className="py-6 px-4 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-900">You're all caught up</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                    No pending orders right now — share your store to bring in the next one.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-bold text-neutral-900 hover:text-black underline underline-offset-4 decoration-neutral-300 hover:decoration-black"
                    >
                      See all orders →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {/* TAB 2: PRODUCTS */}
        {activeTab === "products" && (
          isProductModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Top Navigation & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      resetProductForm();
                    }}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Catalog"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      {editingProductId ? "Edit Product" : "Add Product"}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {editingProductId
                        ? `Editing "${pTitle}" • Changes update live across your store`
                        : "Add images, pricing, and details for your product."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg"
                    onClick={() => {
                      setIsProductModalOpen(false);
                      resetProductForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer"
                    onClick={handleSaveProduct}
                  >
                    {editingProductId ? "Save Changes" : "Save Product"}
                  </Button>
                </div>
              </div>

              {/* Full Page Product Form Grid */}
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Columns: Product Information & Pricing */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: Product Basics */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Basic Information
                    </h3>

                    <div>
                      <label className="font-bold block mb-1 text-xs text-neutral-800">Product Title *</label>
                      <Input
                        placeholder="e.g. Vintage Washed Oversized Heavyweight Tee"
                        value={pTitle}
                        onChange={(e) => setPTitle(e.target.value)}
                        className="text-xs rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold block text-xs text-neutral-800">Category *</label>
                      <Input
                        placeholder="e.g. T-Shirts, Hoodies, Accessories"
                        value={pCategory}
                        onChange={(e) => setPCategory(e.target.value)}
                        list="dashboard-categories-datalist-fullpage"
                        className="text-xs rounded-lg"
                        required
                      />
                      <datalist id="dashboard-categories-datalist-fullpage">
                        {(store.categories || []).map((cat) => (
                          <option key={cat.id} value={cat.name} />
                        ))}
                      </datalist>

                      {/* Quick Select Category Chips */}
                      {(store.categories || []).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-neutral-400 font-medium">Quick select:</span>
                          {(store.categories || []).map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setPCategory(cat.name)}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                pCategory.toLowerCase() === cat.name.toLowerCase()
                                  ? "bg-black text-white border-black font-bold"
                                  : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold block mb-1 text-xs text-neutral-800">Description</label>
                      <textarea
                        rows={4}
                        placeholder="Add product details, materials, sizing, or styling notes..."
                        value={pDesc}
                        onChange={(e) => setPDesc(e.target.value)}
                        className="w-full p-3 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Card 2: Pricing & Inventory */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Pricing & Stock
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold block mb-1 text-xs text-neutral-800">Selling Price (₹) *</label>
                        <Input
                          type="number"
                          placeholder="699"
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value)}
                          className="text-xs rounded-lg"
                          required
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Price charged to customer</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-xs text-neutral-800">Original MRP (₹)</label>
                          {Number(pComparePrice) > Number(pPrice) && Number(pPrice) > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Save {Math.round(((Number(pComparePrice) - Number(pPrice)) / Number(pComparePrice)) * 100)}%
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          placeholder="999"
                          value={pComparePrice}
                          onChange={(e) => setPComparePrice(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">Crossed-out MRP (optional)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="font-bold block mb-1 text-xs text-neutral-800">Stock Quantity *</label>
                        <Input
                          type="number"
                          placeholder="25"
                          value={pStock}
                          onChange={(e) => setPStock(e.target.value)}
                          className="text-xs rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600">Inventory Status:</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            Number(pStock) > 5 ? "bg-emerald-100 text-emerald-800" : Number(pStock) > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {Number(pStock) > 5 ? "In Stock" : Number(pStock) > 0 ? "Low Stock" : "Sold Out"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Photography & Storefront Preview */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card 3: Media Upload */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Product Images
                    </h3>

                    <div className="space-y-2">
                      <label className="font-bold block text-xs text-neutral-800">Product Image URL</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste high-res image URL..."
                          value={pImageUrl}
                          onChange={(e) => setPImageUrl(e.target.value)}
                          className="text-xs rounded-lg"
                        />
                        <label className="shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setPImageUrl(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1.5 text-xs rounded-lg">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </Button>
                        </label>
                      </div>

                      {/* Sample Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Quick samples:</span>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          T-Shirt
                        </button>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Jeans
                        </button>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Hoodie
                        </button>
                        <button
                          type="button"
                          onClick={() => setPImageUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Watch
                        </button>
                      </div>
                    </div>

                    {/* Live Storefront Product Card Preview */}
                    <div className="pt-2">
                      <span className="text-xs font-bold text-neutral-800 block mb-2">Storefront Preview:</span>
                      <div className="max-w-xs mx-auto rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
                        <div className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden">
                          <img
                            src={pImageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {Number(pComparePrice) > Number(pPrice) && Number(pPrice) > 0 && (
                            <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              SAVE {Math.round(((Number(pComparePrice) - Number(pPrice)) / Number(pComparePrice)) * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                            {pCategory || "Category"}
                          </span>
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {pTitle || "Untitled Product"}
                          </h4>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-xs font-extrabold text-neutral-900">
                              ₹{Number(pPrice || 0).toLocaleString("en-IN")}
                            </span>
                            {Number(pComparePrice) > 0 && (
                              <span className="text-[10px] text-neutral-400 line-through">
                                ₹{Number(pComparePrice).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Save Action */}
                  <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs rounded-lg"
                      onClick={() => {
                        setIsProductModalOpen(false);
                        resetProductForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-6 py-2.5 cursor-pointer"
                    >
                      {editingProductId ? "Save Changes" : "Publish Product"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6 animate-enter-blur">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-lg bg-white border border-neutral-200">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">All Products</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {totalProducts} product{totalProducts !== 1 ? "s" : ""} in your catalog
                  </p>
                </div>

                <Button
                  size="sm"
                  className="gap-1.5 bg-[#111111] text-white hover:bg-black rounded-md text-xs cursor-pointer"
                  onClick={() => {
                    if (!productQuota.allowed) {
                      setActiveTab("billing");
                      return;
                    }
                    resetProductForm();
                    setIsProductModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </Button>
              </div>

              {/* Product List */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                {store.products.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors animate-enter-slide-up stagger-${(idx % 6) + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images[0]}
                        alt={prod.title}
                        className="w-12 h-14 rounded-md object-cover border border-neutral-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-900">{prod.title}</h4>
                          <Badge variant="neutral" className="text-[10px] py-0">
                            {prod.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="font-bold text-neutral-900">
                            ₹{(prod.price / 100).toLocaleString("en-IN")}
                          </span>
                          {prod.compareAtPrice && (
                            <span className="text-[11px] text-neutral-400 line-through">
                              ₹{(prod.compareAtPrice / 100).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-500">• Stock: {prod.stock}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/s/${store.subdomain}/products/${prod.slug}`} target="_blank">
                        <Button size="sm" variant="outline" className="text-xs h-7 rounded-md">
                          View Page
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 rounded-md gap-1"
                        onClick={() => openEditProduct(prod)}
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </Button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${prod.title}"?`)) {
                            storeService.deleteProduct(store.subdomain, prod.id);
                            refreshStore();
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* TAB 2.5: CATEGORIES */}
        {activeTab === "categories" && (
          isCategoryModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      resetCategoryForm();
                    }}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Categories"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-neutral-900">
                        {cIsParent
                          ? editingCategoryId
                            ? `Edit Collection: ${cName}`
                            : "New Featured Collection"
                          : editingCategoryId
                          ? `Edit Category: ${cName}`
                          : "New Category"}
                      </h2>
                      <Badge
                        variant={cIsParent ? "warning" : "neutral"}
                        className={cIsParent ? "bg-amber-600 text-white text-[10px]" : "text-[10px]"}
                      >
                        {cIsParent ? "Featured Collection" : "Category"}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {cIsParent
                        ? "Homepage showcase card highlighting your key categories"
                        : "Organizes products in your catalog"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      resetCategoryForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer gap-1.5"
                    onClick={handleSaveCategory}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingCategoryId ? "Update Category" : "Save Category"}</span>
                  </Button>
                </div>
              </div>

              {/* Category Studio Form */}
              <form onSubmit={handleSaveCategory} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  {/* Category Type Switcher */}
                  <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
                    <label className="text-xs font-bold text-neutral-900 block mb-2">Item Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCIsParent(false)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          !cIsParent
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <FolderTree className="w-3.5 h-3.5" />
                          <span>Product Category</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${!cIsParent ? "text-neutral-300" : "text-neutral-500"}`}>
                          E.g. T-Shirts, Hoodies, Jeans
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCIsParent(true);
                          if (!cSubtitle) setCSubtitle("Modern fits for everyday style.");
                          if (!cCtaText) setCCtaText("Shop Collection");
                        }}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          cIsParent
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Featured Collection</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${cIsParent ? "text-neutral-300" : "text-neutral-500"}`}>
                          Homepage card (e.g. Men's or Women's Collection)
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Core Details */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      {cIsParent ? "Collection Details" : "Category Details"}
                    </h3>

                    <div>
                      <label className="font-bold block mb-1">
                        {cIsParent ? "Collection Title *" : "Category Name *"}
                      </label>
                      <Input
                        placeholder={cIsParent ? "e.g. Men's Collection, Summer Drop" : "e.g. Vintage Denim, Hoodies"}
                        value={cName}
                        onChange={(e) => {
                          setCName(e.target.value);
                          if (!editingCategoryId) {
                            setCSlug(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "")
                            );
                          }
                        }}
                        className="rounded-lg text-xs"
                        required
                      />
                    </div>

                    {!cIsParent && (
                      <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
                        <label className="font-bold block text-neutral-900 text-xs">
                          Belongs to Collection (Optional)
                        </label>
                        <select
                          value={cParentId}
                          onChange={(e) => setCParentId(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          <option value="">None (Independent Category)</option>
                          {(store.categories || [])
                            .filter((c) => c.isParent && c.id !== editingCategoryId)
                            .map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {cIsParent && (
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="font-bold block mb-1 text-neutral-800">
                            Tagline (Optional)
                          </label>
                          <Input
                            placeholder="e.g. Modern fits for everyday style."
                            value={cSubtitle}
                            onChange={(e) => setCSubtitle(e.target.value)}
                            className="rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-bold block mb-1 text-neutral-800">
                            Button Text
                          </label>
                          <Input
                            placeholder="e.g. Shop Collection, Explore Styles"
                            value={cCtaText}
                            onChange={(e) => setCCtaText(e.target.value)}
                            className="rounded-lg text-xs"
                          />
                        </div>

                        {/* Included Categories */}
                        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold block text-neutral-900 text-xs">
                              Included Categories
                            </label>
                            <span className="text-[11px] text-neutral-500">
                              {cSelectedChildren.length} selected
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                            {(store.categories || [])
                              .filter((c) => !c.isParent)
                              .map((child) => {
                                const isChecked = cSelectedChildren.includes(child.id);
                                return (
                                  <label
                                    key={child.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-white border-neutral-900 shadow-2xs font-semibold text-neutral-900"
                                        : "bg-white/60 border-neutral-200 text-neutral-600 hover:bg-white"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setCSelectedChildren((prev) =>
                                          prev.includes(child.id)
                                            ? prev.filter((id) => id !== child.id)
                                            : [...prev, child.id]
                                        );
                                      }}
                                      className="w-3.5 h-3.5 rounded text-black border-neutral-300 focus:ring-black"
                                    />
                                    <span className="truncate">{child.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                          {(store.categories || []).filter((c) => !c.isParent).length === 0 && (
                            <p className="text-[11px] text-neutral-500 italic">
                              No categories found. Create categories first to include them here.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="font-bold block mb-1">Store URL</label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-lg text-neutral-500 font-mono text-xs">
                          /category/
                        </span>
                        <Input
                          placeholder="collection-slug"
                          value={cSlug}
                          onChange={(e) => setCSlug(e.target.value)}
                          className="rounded-l-none font-mono text-xs rounded-r-lg"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Live collection URL: <code className="font-mono text-neutral-700">/s/{store.subdomain}/category/{cSlug || "..."}</code>
                      </p>
                    </div>

                    {!cIsParent && (
                      <div>
                        <label className="font-bold block mb-1">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Short summary displayed at top of category collection page..."
                          value={cDesc}
                          onChange={(e) => setCDesc(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <input
                        type="checkbox"
                        id="cat-active-checkbox-fullpage"
                        checked={cIsActive}
                        onChange={(e) => setCIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black cursor-pointer"
                      />
                      <label htmlFor="cat-active-checkbox-fullpage" className="font-semibold text-neutral-800 text-xs cursor-pointer">
                        Visible on storefront
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Picture & Live Storefront Card Preview */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      {cIsParent ? "Card Picture (Required)" : "Cover Photography"}
                    </h3>
                    <div className="space-y-2">
                      <label className="font-bold block text-neutral-800">Picture Image URL *</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://images.unsplash.com/..."
                          value={cImageUrl}
                          onChange={(e) => setCImageUrl(e.target.value)}
                          className="rounded-lg text-xs"
                          required={cIsParent}
                        />
                        <label className="shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) setCImageUrl(event.target.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1 text-xs rounded-lg">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </Button>
                        </label>
                      </div>

                      {/* Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setCImageUrl("https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Men's Suit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCImageUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Women's Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => setCImageUrl("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80")}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                        >
                          Editorial Fashion
                        </button>
                      </div>
                    </div>

                    {/* LIVE CARD PREVIEW FOR PARENT COLLECTION */}
                    {cIsParent ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span className="font-semibold text-neutral-800">Storefront Homepage Card Preview:</span>
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                            Live Card Output
                          </span>
                        </div>

                        <div className="rounded-2xl bg-[#EFECE6] p-5 border border-neutral-300/80 shadow-sm flex items-center justify-between group hover-3d-lift shimmer-card transition-all overflow-hidden relative">
                          <div className="flex-1 min-w-0 pr-3">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                              Featured Collection
                            </span>
                            <h4 className="font-serif-title text-xl text-neutral-900 font-normal leading-tight">
                              {cName || "Collection Name"}
                            </h4>
                            <p className="text-[11px] text-neutral-600 mt-1 line-clamp-2">
                              {cSubtitle || "Modern fits for everyday style."}
                            </p>

                            {/* Assigned Children Pills */}
                            {cSelectedChildren.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {cSelectedChildren.map((id) => {
                                  const child = (store.categories || []).find((c) => c.id === id);
                                  return (
                                    <span
                                      key={id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-neutral-800 border border-neutral-300/60 shadow-2xs"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-neutral-900"></span>
                                      <span>{child?.name || "Child"}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 mt-3">
                              <span>{cCtaText || `Shop ${cName || "Collection"}`}</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>

                          {/* Picture Preview */}
                          <div className="w-24 aspect-3/4 rounded-lg overflow-hidden bg-neutral-300 shrink-0 ml-2 shadow-xs border border-neutral-300/50">
                            {cImageUrl ? (
                              <img
                                src={cImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[10px] text-neutral-500">
                                <span>No Photo</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      cImageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                          <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <img src={cImageUrl} alt="Category Cover Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-600 font-medium text-center">
                            Category Cover Photo
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6 animate-enter-blur">
              {/* Clean Sub-navigation & Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Segmented Control */}
                <div className="inline-flex p-1 rounded-xl bg-neutral-100 border border-neutral-200/80">
                  <button
                    type="button"
                    onClick={() => setCategoryViewTab("categories")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      categoryViewTab === "categories"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Categories</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-700 font-semibold">
                      {(store.categories || []).filter((c) => !c.isParent).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryViewTab("collections")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      categoryViewTab === "collections"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Featured Collections</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-700 font-semibold">
                      {(store.categories || []).filter((c) => c.isParent).length}
                    </span>
                  </button>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-2">
                  {categoryViewTab === "categories" ? (
                    <Button
                      size="sm"
                      className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer gap-1.5 shadow-xs"
                      onClick={openAddCategory}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer gap-1.5 shadow-xs"
                      onClick={openAddParentCollection}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Collection</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* TAB CONTENT 1: CATEGORIES DIRECTORY */}
              {categoryViewTab === "categories" && (
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">All Product Categories</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Categories used to sort and filter products across your store.
                      </p>
                    </div>

                    {/* Filter / Search input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={catSearchQuery}
                        onChange={(e) => setCatSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Categories List */}
                  {(store.categories || []).filter((c) => !c.isParent).length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-3">
                      <FolderTree className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="text-xs font-semibold text-neutral-700">No categories added yet</p>
                      <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                        Create categories so shoppers can easily browse your catalog.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          size="sm"
                          className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs cursor-pointer"
                          onClick={openAddCategory}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Add Category</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs rounded-lg cursor-pointer"
                          onClick={() => {
                            const defaults = buildDefaultCategoriesForStore(store.subdomain);
                            storeService.updateStore(store.subdomain, { categories: defaults });
                            refreshStore();
                          }}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          <span>Load Defaults</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                      {(store.categories || [])
                        .filter((cat) => !cat.isParent)
                        .filter((cat) => {
                          if (!catSearchQuery.trim()) return true;
                          const q = catSearchQuery.toLowerCase();
                          return (
                            cat.name.toLowerCase().includes(q) ||
                            cat.slug.toLowerCase().includes(q) ||
                            (cat.description && cat.description.toLowerCase().includes(q))
                          );
                        })
                        .map((cat, index) => {
                          const productCount = store.products.filter(
                            (p) =>
                              p.category.toLowerCase() === cat.name.toLowerCase() ||
                              p.category.toLowerCase() === cat.slug.toLowerCase()
                          ).length;

                          const parent = (store.categories || []).find((p) => p.id === cat.parentId);

                          return (
                            <div
                              key={cat.id}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {/* Order arrows */}
                                <div className="flex flex-col items-center justify-center gap-0.5 text-neutral-400">
                                  <button
                                    onClick={() => handleMoveCategory(index, "up")}
                                    disabled={index === 0}
                                    className="p-1 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-400 cursor-pointer"
                                    title="Move Category Up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                                    #{index + 1}
                                  </span>
                                  <button
                                    onClick={() => handleMoveCategory(index, "down")}
                                    disabled={index === (store.categories?.filter((c) => !c.isParent).length || 1) - 1}
                                    className="p-1 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-400 cursor-pointer"
                                    title="Move Category Down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Image preview / icon */}
                                <div className="w-12 h-14 rounded-md overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center">
                                  {cat.imageUrl ? (
                                    <img
                                      src={cat.imageUrl}
                                      alt={cat.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FolderTree className="w-5 h-5 text-neutral-400" />
                                  )}
                                </div>

                                {/* Category Details */}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold text-neutral-900">{cat.name}</h4>
                                    <code className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono">
                                      /{cat.slug}
                                    </code>

                                    {/* Parent collection badge */}
                                    {parent ? (
                                      <Badge className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-medium">
                                        Collection: {parent.name}
                                      </Badge>
                                    ) : (
                                      <Badge variant="neutral" className="text-neutral-400 text-[10px]">
                                        Standalone
                                      </Badge>
                                    )}

                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                        cat.isActive ?? true
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                                      }`}
                                    >
                                      {cat.isActive ?? true ? "Active" : "Hidden"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                    <span className="font-semibold text-neutral-800">
                                      {productCount} product{productCount === 1 ? "" : "s"}
                                    </span>
                                    {cat.description && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-xs">{cat.description}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/s/${store.subdomain}/category/${cat.slug}`}
                                  target="_blank"
                                >
                                  <Button size="sm" variant="outline" className="text-xs h-7 rounded-md gap-1 cursor-pointer">
                                    <span>View</span>
                                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                                  </Button>
                                </Link>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 rounded-md gap-1 cursor-pointer"
                                  onClick={() => openEditCategory(cat)}
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </Button>

                                <button
                                  onClick={() => handleToggleCategoryActive(cat)}
                                  className="p-1.5 text-neutral-500 hover:text-black rounded-md hover:bg-neutral-100 text-[11px] cursor-pointer"
                                  title={cat.isActive ?? true ? "Hide from Storefront" : "Show on Storefront"}
                                >
                                  {cat.isActive ?? true ? "Hide" : "Show"}
                                </button>

                                <button
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-neutral-100 cursor-pointer"
                                  title="Delete Category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 2: FEATURED COLLECTIONS */}
              {categoryViewTab === "collections" && (
                <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">Featured Collections</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Promotional showcase cards displayed directly on your storefront homepage.
                      </p>
                    </div>
                  </div>

                  {/* Collections Grid */}
                  {(store.categories || []).filter((c) => c.isParent).length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 space-y-3">
                      <Sparkles className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="text-xs font-semibold text-neutral-700">No featured collections created yet</p>
                      <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                        Create collections (like Men's Collection or Summer Drop) to highlight key categories on your homepage.
                      </p>
                      <Button
                        size="sm"
                        className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs mt-2 cursor-pointer"
                        onClick={openAddParentCollection}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Create Collection</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(store.categories || [])
                        .filter((c) => c.isParent)
                        .map((pCat, idx) => {
                          const children = (store.categories || []).filter(
                            (c) => !c.isParent && c.parentId === pCat.id
                          );
                          const bgColors = ["bg-[#EFECE6]", "bg-[#ECE7E1]", "bg-[#F3EFEA]", "bg-[#EAE6DF]"];
                          const cardBg = bgColors[idx % bgColors.length];

                          return (
                            <div
                              key={pCat.id}
                              className={`rounded-2xl ${cardBg} p-5 border border-neutral-200/90 flex flex-col justify-between hover-3d-lift shimmer-card transition-all group overflow-hidden relative shadow-2xs`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                                        pCat.isActive ?? true
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                                      }`}
                                    >
                                      {pCat.isActive ?? true ? "Live on Storefront" : "Hidden"}
                                    </span>
                                  </div>

                                  <h4 className="font-serif-title text-xl sm:text-2xl text-neutral-900 font-normal">
                                    {pCat.name}
                                  </h4>
                                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                    {pCat.subtitle || pCat.description || "Curated collection"}
                                  </p>

                                  {/* Included Category Pills */}
                                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                                    {children.length > 0 ? (
                                      children.map((child) => (
                                        <span
                                          key={child.id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 text-neutral-800 border border-neutral-300/60 shadow-2xs"
                                        >
                                          <span className="w-1 h-1 rounded-full bg-neutral-900"></span>
                                          <span>{child.name}</span>
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-neutral-400 italic">No categories assigned</span>
                                    )}
                                  </div>

                                  <div className="text-[11px] font-bold text-neutral-900 mt-3 inline-flex items-center gap-1">
                                    <span>{pCat.ctaText || `Shop ${pCat.name}`}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                </div>

                                {/* Picture on right */}
                                {pCat.imageUrl && (
                                  <div className="w-24 sm:w-28 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0 ml-2 shadow-sm border border-neutral-300/40">
                                    <img
                                      src={pCat.imageUrl}
                                      alt={pCat.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Card Footer Actions */}
                              <div className="mt-4 pt-3 border-t border-neutral-300/40 flex items-center justify-between">
                                <code className="text-[10px] font-mono text-neutral-600">
                                  /category/{pCat.slug}
                                </code>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs bg-white/80 hover:bg-white rounded-md gap-1 cursor-pointer"
                                    onClick={() => openEditCategory(pCat)}
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </Button>
                                  <button
                                    onClick={() => handleDeleteCategory(pCat.id, pCat.name)}
                                    className="p-1.5 text-neutral-500 hover:text-red-600 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
                                    title="Delete Collection"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === "orders" && (
          selectedOrder ? (
            <div className="mt-6 space-y-6 animate-enter-slide-up">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Orders"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-neutral-900">
                        Order #{selectedOrder.number}
                      </h2>
                      <Badge variant="neutral" className="uppercase text-[10px]">
                        {selectedOrder.fulfilmentStatus}
                      </Badge>
                      <Badge variant="success" className="uppercase text-[10px]">
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} • Customer: {selectedOrder.customer.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${selectedOrder.customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hello ${selectedOrder.customer.name}, regarding your order #${selectedOrder.number} on ${store.name}: `
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" className="bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-xs gap-1.5 shadow-xs cursor-pointer">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg cursor-pointer"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Back to Orders
                  </Button>
                </div>
              </div>

              {/* Order Console 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 cols: Items and Customer Info */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Ordered Items Card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Ordered Items ({selectedOrder.items.length})
                    </h3>

                    <div className="divide-y divide-neutral-100">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-14 h-16 rounded-md object-cover border border-neutral-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{item.title}</h4>
                            {item.variantName && (
                              <span className="text-[10px] text-neutral-500 block">{item.variantName}</span>
                            )}
                            <span className="text-xs text-neutral-600">
                              Qty: {item.quantity} × ₹{(item.price / 100).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-neutral-900 shrink-0">
                            ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-neutral-200 text-xs space-y-1.5 text-neutral-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="font-semibold text-neutral-900">
                          ₹{(selectedOrder.items.reduce((acc, it) => acc + it.price * it.quantity, 0) / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-neutral-900">
                        <span>Total Paid / Payable</span>
                        <span>
                          ₹{(selectedOrder.items.reduce((acc, it) => acc + it.price * it.quantity, 0) / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-3 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Customer & Delivery Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-neutral-500 text-[11px] block">Customer Name</span>
                        <span className="font-bold text-neutral-900 text-xs">{selectedOrder.customer.name}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[11px] block">Phone Number</span>
                        <span className="font-bold text-neutral-900 text-xs font-mono">{selectedOrder.customer.phone}</span>
                      </div>
                    </div>
                    {selectedOrder.customer.email && (
                      <div>
                        <span className="text-neutral-500 text-[11px] block">Email</span>
                        <span className="text-neutral-900 text-xs">{selectedOrder.customer.email}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-100">
                      <span className="text-neutral-500 text-[11px] block">Shipping Address</span>
                      <p className="text-neutral-900 text-xs font-medium mt-0.5">
                        {selectedOrder.address.street}, {selectedOrder.address.city} - {selectedOrder.address.pincode} ({selectedOrder.address.state || "India"})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Fulfilment Pipeline & Payment */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Payment Card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Payment Verification</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 font-medium">Payment Mode:</span>
                      <span className="font-bold uppercase text-neutral-900">
                        {selectedOrder.paymentMethod === "upi" ? "Direct UPI" : "Cash on Delivery"}
                      </span>
                    </div>

                    {selectedOrder.paymentMethod === "upi" && (
                      <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-neutral-700">Bank UTR / Ref:</span>
                          <span className="font-mono font-bold text-neutral-900">{selectedOrder.paymentUtr || "Pending Buyer UTR"}</span>
                        </div>
                        {selectedOrder.paymentStatus !== "paid" && (
                          <Button
                            size="sm"
                            className="w-full bg-[#111111] text-white hover:bg-black text-xs rounded-lg mt-2 cursor-pointer"
                            onClick={() => handleVerifyPayment(selectedOrder.id)}
                          >
                            Mark Verified & Paid
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fulfilment State Card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Fulfilment Progress</h3>
                    <p className="text-neutral-500 text-[11px]">Advance order through shipment lifecycle stages:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={selectedOrder.fulfilmentStatus === "confirmed" ? "primary" : "outline"}
                        className="rounded-lg text-xs cursor-pointer"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "confirmed")}
                      >
                        1. Confirmed
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedOrder.fulfilmentStatus === "packed" ? "primary" : "outline"}
                        className="rounded-lg text-xs cursor-pointer"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "packed")}
                      >
                        2. Packed
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedOrder.fulfilmentStatus === "shipped" ? "primary" : "outline"}
                        className="rounded-lg text-xs cursor-pointer"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "shipped")}
                      >
                        3. Shipped
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedOrder.fulfilmentStatus === "delivered" ? "primary" : "outline"}
                        className="rounded-lg text-xs cursor-pointer"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, "delivered")}
                      >
                        4. Delivered
                      </Button>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 space-y-2">
                      <label className="font-bold text-neutral-800 block text-xs">Courier & Tracking Details</label>
                      <Input
                        placeholder="Courier Name (e.g. Delhivery, BlueDart)"
                        value={courierNameInput}
                        onChange={(e) => setCourierNameInput(e.target.value)}
                        className="text-xs rounded-lg"
                      />
                      <Input
                        placeholder="Tracking AWB Number"
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        className="text-xs font-mono rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6 animate-enter-blur">
            <div className="p-6 rounded-lg bg-white border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 mb-4">Customer Orders ({totalOrders})</h3>

              {store.orders.length === 0 ? (
                <div className="p-10 text-center text-xs text-neutral-500">
                  No orders recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {store.orders.map((order) => (
                    <div
                      key={order.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 rounded-md px-2 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900">{order.number}</span>
                          <span className="text-xs text-neutral-800">{order.customer.name}</span>
                          <Badge variant="neutral" className="text-[10px] uppercase">
                            {order.fulfilmentStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Items: {order.items.map((i) => `${i.title} (x${i.quantity})`).join(", ")}
                        </p>
                        <p className="text-xs text-neutral-900 font-semibold">
                          Total: ₹{(order.total / 100).toLocaleString("en-IN")} via{" "}
                          <span className="uppercase">{order.paymentMethod}</span>
                          {order.paymentUtr && ` • UTR: ${order.paymentUtr}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 rounded-md"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Manage
                        </Button>
                        <a
                          href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button size="sm" className="h-7 bg-[#111111] text-white hover:bg-black rounded-md text-xs gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

        {/* TAB 3.5: DISCOUNTS & COUPONS */}
        {activeTab === "discounts" && (
          isDiscountModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDiscountModalOpen(false)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Discounts"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      Create Discount Coupon
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Promotional codes entered by buyers at checkout to deduct percentage or flat discounts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg cursor-pointer"
                    onClick={() => setIsDiscountModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer"
                    onClick={handleCreateDiscount}
                  >
                    Create Coupon
                  </Button>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleCreateDiscount} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Coupon Parameters</h3>

                    <div>
                      <label className="font-bold block mb-1">Coupon Code *</label>
                      <Input
                        placeholder="e.g. WELCOME10, FESTIVE50, SUMMER20"
                        value={dCode}
                        onChange={(e) => setDCode(e.target.value.toUpperCase())}
                        className="font-mono uppercase font-bold tracking-wider rounded-lg text-xs"
                        required
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Code typed by buyers at checkout to unlock savings.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold block mb-1">Discount Type *</label>
                        <select
                          value={dType}
                          onChange={(e) => setDType(e.target.value as "percentage" | "flat")}
                          className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs bg-white text-neutral-900 font-medium"
                        >
                          <option value="percentage">Percentage (%) Off</option>
                          <option value="flat">Flat Amount (₹) Off</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">
                          {dType === "percentage" ? "Percentage (%):" : "Flat Value (₹):"} *
                        </label>
                        <Input
                          type="number"
                          placeholder={dType === "percentage" ? "10" : "100"}
                          value={dValue}
                          onChange={(e) => setDValue(e.target.value)}
                          className="rounded-lg text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                      <div>
                        <label className="font-bold block mb-1">Minimum Cart Total (₹)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={dMinOrder}
                          onChange={(e) => setDMinOrder(e.target.value)}
                          className="rounded-lg text-xs"
                        />
                        <p className="text-[10px] text-neutral-400 mt-0.5">Leave 0 for no minimum</p>
                      </div>

                      {dType === "percentage" && (
                        <div>
                          <label className="font-bold block mb-1">Max Discount Cap (₹)</label>
                          <Input
                            type="number"
                            placeholder="Optional cap"
                            value={dMaxDiscount}
                            onChange={(e) => setDMaxDiscount(e.target.value)}
                            className="rounded-lg text-xs"
                          />
                          <p className="text-[10px] text-neutral-400 mt-0.5">Ceiling on percentage savings</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                      <input
                        type="checkbox"
                        id="d-active-checkbox-fullpage"
                        checked={dIsActive}
                        onChange={(e) => setDIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black"
                      />
                      <label htmlFor="d-active-checkbox-fullpage" className="font-semibold text-neutral-800 text-xs cursor-pointer">
                        Active immediately on storefront checkout
                      </label>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Live Coupon Badge Preview */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">Checkout Badge Preview</h3>
                    <p className="text-neutral-500 text-[11px]">How buyers will see this discount tag at checkout:</p>

                    <div className="p-5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm px-3 py-1 bg-neutral-950 text-white rounded-md tracking-wider">
                          {dCode || "PROMOCODE"}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          {dType === "percentage" ? `${dValue || "10"}% OFF` : `₹${dValue || "100"} FLAT OFF`}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        {dMinOrder && Number(dMinOrder) > 0 ? `Valid on orders above ₹${dMinOrder}.` : "Valid on all orders."}{" "}
                        {dMaxDiscount && Number(dMaxDiscount) > 0 ? `Maximum discount capped at ₹${dMaxDiscount}.` : ""}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-bold py-3 cursor-pointer"
                      >
                        Create Discount Coupon
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6 animate-enter-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">Discounts & Promo Coupons</h3>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Create promotional discount codes. Buyers apply these at checkout for percentage or flat discounts.
                </p>
              </div>

              <Button
                size="sm"
                className="gap-1.5 bg-[#111111] text-white hover:bg-black rounded-md text-xs shrink-0"
                onClick={() => {
                  setDCode("");
                  setDType("percentage");
                  setDValue("");
                  setDMinOrder("");
                  setDMaxDiscount("");
                  setDIsActive(true);
                  setIsDiscountModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Discount Code</span>
              </Button>
            </div>

            {/* Discounts List */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
              {!store.discounts || store.discounts.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">No discount codes created yet</h4>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      Attract first-time buyers with a welcome coupon like WELCOME10 or FLAT100.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setDCode("WELCOME10");
                      setDType("percentage");
                      setDValue("10");
                      setDMinOrder("500");
                      setDIsActive(true);
                      setIsDiscountModalOpen(true);
                    }}
                    className="bg-[#111111] text-white hover:bg-black text-xs rounded-md"
                  >
                    Create WELCOME10 Coupon
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  <div className="hidden sm:grid sm:grid-cols-12 px-6 py-3 bg-neutral-50/70 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    <div className="col-span-4">Coupon Code & Type</div>
                    <div className="col-span-3">Discount Value</div>
                    <div className="col-span-2">Minimum Cart</div>
                    <div className="col-span-1">Times Used</div>
                    <div className="col-span-2 text-right">Status & Action</div>
                  </div>

                  {store.discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="p-4 sm:px-6 sm:py-4 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-3 sm:gap-0 hover:bg-neutral-50/60 transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-md bg-neutral-900 text-white tracking-wider">
                          {discount.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                          {discount.type === "percentage" ? "% Off" : "Flat ₹"}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <span className="text-xs font-bold text-neutral-900">
                          {discount.type === "percentage" ? `${discount.value}% OFF` : `₹${(discount.value / 100).toLocaleString("en-IN")} FLAT OFF`}
                        </span>
                        {discount.maxDiscount && (
                          <span className="text-[10px] text-neutral-500 block">
                            (Max ₹{(discount.maxDiscount / 100).toLocaleString("en-IN")})
                          </span>
                        )}
                      </div>

                      <div className="col-span-2">
                        <span className="text-xs text-neutral-600">
                          {discount.minOrderValue && discount.minOrderValue > 0 ? `₹${(discount.minOrderValue / 100).toLocaleString("en-IN")}` : "No min"}
                        </span>
                      </div>

                      <div className="col-span-1">
                        <span className="text-xs font-semibold text-neutral-800">
                          {discount.timesUsed || 0}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDiscount(discount.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                            discount.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                          }`}
                        >
                          {discount.isActive ? "Active" : "Paused"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDiscount(discount.id, discount.code)}
                          title="Delete Coupon"
                          className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

        {/* TAB 4: CUSTOMERS */}
        {activeTab === "customers" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            <div className="p-6 rounded-lg bg-white border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 mb-4">Customer Directory ({totalCustomers})</h3>
              <div className="divide-y divide-neutral-100">
                {store.customers.map((cust) => (
                  <div key={cust.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{cust.name}</h4>
                      <p className="text-xs text-neutral-500">{cust.phone} {cust.email && `• ${cust.email}`}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-neutral-900 block">
                        ₹{(cust.totalSpent / 100).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-neutral-500">{cust.totalOrders} order(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REVIEWS */}
        {activeTab === "reviews" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            {!canUseReviews(store.planId) ? (
              <div className="p-8 sm:p-12 rounded-xl bg-white border border-neutral-200 text-center max-w-2xl mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7" />
                </div>
                <Badge variant="neutral" className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] mb-3">
                  Paid Plan Feature Exclusive
                </Badge>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  Customer Reviews & Star Ratings are Locked
                </h3>
                <p className="text-xs text-neutral-600 mb-6 leading-relaxed max-w-lg mx-auto">
                  Customer reviews, testimonial moderation, and verified rating badges on website product cards are exclusively available on paid plans (<strong>Growth Plan ₹299/mo</strong> or <strong>Pro Merchant ₹799/mo</strong>).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-6">
                  <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 mb-1.5" />
                    <h5 className="font-bold text-xs text-neutral-900">Product Card Badges</h5>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Showcase 5-star ratings directly on storefront product cards.</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1.5" />
                    <h5 className="font-bold text-xs text-neutral-900">Review Moderation</h5>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Approve, hide, or delete customer reviews before they show up.</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                    <Sparkles className="w-4 h-4 text-neutral-900 mb-1.5" />
                    <h5 className="font-bold text-xs text-neutral-900">Conversion Boost</h5>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Authentic reviews boost store conversion rate by up to 34%.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="md"
                    className="w-full sm:w-auto bg-[#111111] text-white hover:bg-black rounded-md text-xs px-6 py-2.5 font-bold"
                    onClick={() => {
                      setActiveTab("billing");
                    }}
                  >
                    Upgrade to Growth Plan (₹299/mo)
                  </Button>
                  <Button
                    size="md"
                    variant="outline"
                    className="w-full sm:w-auto rounded-md text-xs px-6 py-2.5 font-semibold"
                    onClick={() => {
                      setActiveTab("billing");
                    }}
                  >
                    Upgrade to Pro Merchant (₹799/mo)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-white border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Customer Reviews Moderation ({store.reviews.length})
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Verified reviews and ratings displayed on product detail pages and product cards.
                    </p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Paid Plan Active
                  </Badge>
                </div>

                {store.reviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No customer reviews yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {store.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-md bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-neutral-900">{rev.customerName}</span>
                            <div className="flex text-amber-500">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-500" />
                              ))}
                            </div>
                            <Badge variant="neutral" className="text-[10px] uppercase">
                              {rev.status}
                            </Badge>
                          </div>
                          {rev.title && <p className="text-xs font-semibold text-neutral-900 mt-1">{rev.title}</p>}
                          <p className="text-xs text-neutral-600 mt-0.5">{rev.comment}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.status !== "approved" ? (
                            <Button
                              size="sm"
                              className="text-xs h-7 bg-[#111111] text-white hover:bg-black rounded-md"
                              onClick={() => {
                                storeService.updateReviewStatus(store.subdomain, rev.id, "approved");
                                refreshStore();
                              }}
                            >
                              Approve
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 rounded-md"
                              onClick={() => {
                                storeService.updateReviewStatus(store.subdomain, rev.id, "pending");
                                refreshStore();
                              }}
                            >
                              Hide
                            </Button>
                          )}
                          <button
                            onClick={() => {
                              storeService.deleteReview(store.subdomain, rev.id);
                              refreshStore();
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BANNERS */}
        {activeTab === "banners" && (
          isBannerModalOpen ? (
            <div className="mt-6 space-y-6 animate-enter-scale">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                    title="Back to Banners"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">
                      Add Banner
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Promotional banner displayed at the top of your storefront homepage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-lg cursor-pointer"
                    onClick={() => setIsBannerModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-semibold px-4 cursor-pointer"
                    onClick={handleSaveBanner}
                  >
                    Save Banner
                  </Button>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSaveBanner} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  {/* Image input card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Banner Image *
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Recommended size: 1800×600 px (wide landscape).
                    </p>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste banner image URL (or upload from device)..."
                        value={bImageUrl}
                        onChange={(e) => setBImageUrl(e.target.value)}
                        required
                        className="text-xs rounded-lg"
                      />
                      <label className="shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) setBImageUrl(event.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1.5 text-xs rounded-lg">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-neutral-400 font-medium">Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => setBImageUrl("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80")}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                      >
                        Editorial Lifestyle
                      </button>
                      <button
                        type="button"
                        onClick={() => setBImageUrl("https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80")}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                      >
                        Streetwear & Hoodies
                      </button>
                      <button
                        type="button"
                        onClick={() => setBImageUrl("https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80")}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 cursor-pointer"
                      >
                        Denim & Trousers
                      </button>
                    </div>

                    {/* Live Banner Panoramic Preview */}
                    {bImageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                        <div className="relative aspect-[2.8/1] w-full overflow-hidden">
                          <img src={bImageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
                          <span className="font-semibold">Storefront Hero Banner Preview</span>
                          <span className="text-emerald-700 font-bold">Edge-to-Edge Display</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Destination Card */}
                  <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-4 text-xs">
                    <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
                      Destination Link *
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Where shoppers go when clicking this banner.
                    </p>

                    <select
                      value={bTargetType}
                      onChange={(e) => {
                        setBTargetType(e.target.value as any);
                        setBSearchQuery("");
                      }}
                      className="w-full p-2.5 rounded-lg border border-neutral-300 text-xs text-neutral-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    >
                      <option value="">-- Choose Destination --</option>
                      <option value="category">Category Page</option>
                      <option value="product">Product Page</option>
                    </select>

                    {bTargetType === "category" && (
                      <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2.5">
                        <span className="font-bold text-neutral-800 text-xs block">
                          Select Category: {bSelectedCategory && <Badge variant="success" className="ml-1">{bSelectedCategory}</Badge>}
                        </span>
                        <div className="max-h-40 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg bg-white p-1">
                          {filteredCategories.map((cat) => (
                            <div
                              key={cat}
                              onClick={() => setBSelectedCategory(cat)}
                              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs ${
                                bSelectedCategory.toLowerCase() === cat.toLowerCase()
                                  ? "bg-black text-white font-bold"
                                  : "hover:bg-neutral-100 text-neutral-800"
                              }`}
                            >
                              <span>{cat}</span>
                              <span className="text-[10px] text-neutral-400">
                                {store.products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length} items
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bTargetType === "product" && (
                      <div className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2.5">
                        <span className="font-bold text-neutral-800 text-xs block">
                          Select Product: {bSelectedProduct && <Badge variant="success" className="ml-1">{bSelectedProduct.title}</Badge>}
                        </span>
                        <div className="max-h-48 overflow-y-auto space-y-1 border border-neutral-200 rounded-lg bg-white p-1">
                          {filteredProducts.map((p) => {
                            const isSelected = bSelectedProduct?.id === p.id;
                            return (
                              <div
                                key={p.id}
                                onClick={() => setBSelectedProduct(p)}
                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs ${
                                  isSelected ? "bg-black text-white" : "hover:bg-neutral-100 text-neutral-800"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <img src={p.images[0]} alt={p.title} className="w-7 h-7 rounded object-cover shrink-0" />
                                  <span className="truncate">{p.title}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#111111] text-white hover:bg-black rounded-lg text-xs font-bold py-3 cursor-pointer"
                      >
                        Save Carousel Banner
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6 animate-enter-blur">
            <div className="p-6 rounded-lg bg-white border border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Homepage Banners</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Promotional banners displayed at the top of your store homepage.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#111111] text-white hover:bg-black rounded-md text-xs shrink-0"
                  onClick={() => {
                    setBImageUrl("");
                    setBTargetType("");
                    setBSelectedCategory("");
                    setBSelectedProduct(null);
                    setBSearchQuery("");
                    setIsBannerModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Banner</span>
                </Button>
              </div>

              {store.banners.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">
                  <ImageIcon className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                  <p className="text-xs font-semibold text-neutral-700">No banners yet</p>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
                    Add promotional banners to highlight sales and top collections.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 bg-[#111111] text-white hover:bg-black rounded-md text-xs"
                    onClick={() => {
                      setBImageUrl("");
                      setBTargetType("");
                      setBSelectedCategory("");
                      setBSelectedProduct(null);
                      setBSearchQuery("");
                      setIsBannerModalOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add First Banner</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {store.banners.map((b, idx) => (
                    <div
                      key={b.id}
                      className={`p-4 rounded-lg border transition-all ${
                        b.isActive ? "border-neutral-200 bg-white" : "border-neutral-200 bg-neutral-50/80 opacity-75"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Slide Position and Order controls */}
                        <div className="md:col-span-1 flex items-center md:flex-col justify-between md:justify-center gap-1 text-center border-b md:border-b-0 md:border-r border-neutral-100 pb-2 md:pb-0 md:pr-2">
                          <span className="text-xs font-mono font-bold text-neutral-400">#{idx + 1}</span>
                          <div className="flex md:flex-col gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveBanner(idx, "up")}
                              className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20"
                              aria-label="Move banner up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === store.banners.length - 1}
                              onClick={() => handleMoveBanner(idx, "down")}
                              className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 disabled:opacity-20"
                              aria-label="Move banner down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Full card Image Preview */}
                        <div className="md:col-span-4">
                          <div className="relative aspect-[2.8/1] w-full rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 shadow-2xs">
                            <img src={b.imageUrl} alt={b.title || "Banner"} className="w-full h-full object-cover" />
                          </div>
                        </div>

                        {/* Banner Details & Redirect destination */}
                        <div className="md:col-span-4 flex flex-col justify-center text-left">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant={b.isActive ? "success" : "neutral"} className="text-[10px]">
                              {b.isActive ? "Active on Storefront" : "Disabled"}
                            </Badge>
                            {b.targetType && (
                              <Badge variant="neutral" className="text-[10px] capitalize">
                                {b.targetType} Link
                              </Badge>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {b.title || "Storefront Banner"}
                          </h4>

                          <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                            <span className="font-medium text-neutral-700">Redirects to:</span>
                            <span className="font-mono text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[200px]">
                              {b.targetType === "category" ? `Category: ${b.targetValue}` : b.targetType === "product" ? `Product: ${b.targetValue}` : b.ctaLink}
                            </span>
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                          {b.ctaLink && (
                            <Link href={b.ctaLink} target="_blank">
                              <Button size="sm" variant="outline" className="text-xs h-8 gap-1 rounded-md">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Test Link</span>
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-8 rounded-md"
                            onClick={() => handleToggleBannerActive(b.id)}
                          >
                            {b.isActive ? "Pause" : "Activate"}
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            aria-label="Delete banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

        {/* TAB 7: THEMES & STOREFRONT DESIGN */}
        {activeTab === "themes" && (
          <div className="mt-6 space-y-8 animate-enter-blur">
            {/* Real-time Theme Applied Toast Notification */}
            {themeAppliedToast && (
              <div className="p-4 rounded-2xl bg-neutral-900 text-white font-semibold text-xs flex items-center justify-between shadow-lg border border-neutral-800 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white">"{themeAppliedToast}" Theme Activated!</span>
                    <span className="text-neutral-400 block sm:inline sm:ml-2">Your live storefront styling, colors, and layout tokens have been updated.</span>
                  </div>
                </div>
                <Link href={liveStoreUrl} target="_blank" className="shrink-0 ml-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center gap-1.5">
                  <span>Visit Live Store</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* 1. PRIMARY HERO SECTION: STOREFRONT THEMES & WEBSITE TEMPLATES */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-6">
              {/* Header with Title and Active Badge */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Storefront Themes
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                      Active: {PLATFORM_THEMES[store.activeThemeSlug || "classic-bloom"]?.name || "Lume Editorial"}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mt-1.5">
                    Choose a Theme
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
                    Pick a design that fits your brand. Preview anytime before applying.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link href={liveStoreUrl} target="_blank">
                    <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl border-neutral-300 gap-1.5 h-9 px-3.5 shadow-2xs">
                      <span>Preview Live Store</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Niche Category Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all", label: `All Themes (${Object.keys(PLATFORM_THEMES).length})` },
                  { id: "new-layouts", label: "New Layouts (5)" },
                  { id: "Fashion & Lifestyle", label: "Fashion & Lifestyle" },
                  { id: "Fashion & Lookbook", label: "Lookbook Minimal" },
                  { id: "Streetwear Drops", label: "Streetwear & Magazine" },
                  { id: "Electronics & Tech", label: "Electronics & Bento" },
                  { id: "Curated Boutique", label: "Sidebar Directory" },
                  { id: "Wellness & Organic", label: "Botanical & Tea" },
                  { id: "Beauty & Cosmetics", label: "Beauty & Skincare" },
                  { id: "Jewelry & Luxury", label: "Jewelry & Luxury" },
                  { id: "Home & Ceramics", label: "Home & Decor" },
                  { id: "Gourmet & Organics", label: "Gourmet & Organics" },
                  { id: "Handcrafted & Art", label: "Handcrafted & Art" },
                ].map((tab) => {
                  const isActive = themeCategoryFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setThemeCategoryFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-neutral-900 text-white shadow-xs"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Grid of High-Aesthetic Website & Layout Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
                {filteredThemes.map((theme, idx) => {
                  const isCurrent = (store.activeThemeSlug || "classic-bloom") === theme.slug;
                  const allowed = isThemeAllowed(theme.slug, store.planId);

                  return (
                    <div
                      key={theme.slug}
                      className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 group hover-lift animate-enter-slide-up stagger-${(idx % 6) + 1} ${
                        isCurrent
                          ? "border-black ring-2 ring-black bg-white shadow-md"
                          : "border-neutral-200/90 bg-white hover:border-neutral-400 hover:shadow-sm"
                      }`}
                    >
                      {/* Top: Browser Mockup Frame with controls & Theme tier pill */}
                      <div>
                        <div className="px-3.5 py-2 bg-neutral-100/90 border-b border-neutral-200/70 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-neutral-300" />
                            <span className="w-2 h-2 rounded-full bg-neutral-300" />
                            <span className="w-2 h-2 rounded-full bg-neutral-300" />
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[140px]">
                            {theme.slug}.{siteConfig.domain}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              theme.tier === "free"
                                ? "bg-emerald-100 text-emerald-800"
                                : theme.tier === "starter"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {theme.tier === "free" ? "Free" : theme.tier === "starter" ? "Growth" : "Pro"}
                          </span>
                        </div>

                        {/* Visual Storefront Preview Window with Interactive Click Trigger */}
                        <div
                          onClick={() => {
                            window.location.href = `/s/${store.subdomain}?preview_theme=${theme.slug}`;
                          }}
                          className="relative h-48 sm:h-52 w-full overflow-hidden bg-neutral-900 cursor-pointer select-none"
                        >
                          <img
                            src={theme.previewImage}
                            alt={theme.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                          {/* Category Badge Floating Top Left */}
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20">
                              {theme.category}
                            </span>
                          </div>

                          {/* Active Indicator Floating Top Right */}
                          {isCurrent && (
                            <div className="absolute top-3 right-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            </div>
                          )}

                          {/* Hover Overlay with Preview Prompt */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="px-3.5 py-1.5 rounded-full bg-white/95 text-neutral-950 text-xs font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-transform group-hover:scale-105">
                              <Eye className="w-3.5 h-3.5 text-neutral-900" />
                              <span>Click to Preview Live</span>
                            </span>
                          </div>

                          {/* Floating Micro Storefront Bar Inside Mockup */}
                          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/40 shadow-sm flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <p className="text-[11px] font-bold text-neutral-900 truncate">
                                {theme.tagline}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-neutral-500">Layout:</span>
                                <span className="text-[10px] font-bold text-neutral-800 capitalize">
                                  {theme.layoutType || "editorial"}
                                </span>
                              </div>
                            </div>
                            {/* Signature Color Swatches */}
                            <div className="flex items-center gap-1 shrink-0">
                              {theme.previewColors.map((color, i) => (
                                <span
                                  key={i}
                                  className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Theme Title & Curated Description */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-extrabold text-sm text-neutral-900 tracking-tight">
                              {theme.name}
                            </h3>
                            {theme.layoutType && theme.layoutType !== "editorial" && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                New Layout
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Button Footer: Edit Theme (drag & drop section order) + Preview + Apply/Unlock CTA */}
                      <div className="p-4 pt-0 flex items-center gap-2">
                        {/* 1. Edit Theme Button */}
                        <Button
                          id={`btn-edit-theme-${theme.slug}`}
                          data-testid={`btn-edit-theme-${theme.slug}`}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs font-semibold rounded-xl border-neutral-300 hover:border-black hover:bg-neutral-50 h-9 gap-1.5 shadow-2xs transition-all cursor-pointer"
                          onClick={() => handleOpenEditTheme(theme)}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-700" />
                          <span>Edit Theme</span>
                        </Button>

                        {/* 2. Preview button: ALWAYS opens full-page live storefront */}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs font-semibold rounded-xl border-neutral-300 hover:border-black hover:bg-neutral-50 h-9 px-3 gap-1 shadow-2xs transition-all cursor-pointer"
                          onClick={() => {
                            window.location.href = `/s/${store.subdomain}?preview_theme=${theme.slug}`;
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-700" />
                          <span className="hidden sm:inline">Preview</span>
                        </Button>

                        {/* 3. Apply or Upgrade CTA */}
                        {isCurrent ? (
                          <div className="py-2 px-3 rounded-xl bg-neutral-100 border border-neutral-200 text-[11px] font-bold text-neutral-800 flex items-center justify-center gap-1 shadow-2xs shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">Active</span>
                          </div>
                        ) : allowed ? (
                          <Button
                            size="sm"
                            className="text-xs font-bold rounded-xl bg-[#111111] hover:bg-black text-white h-9 px-3.5 shadow-2xs transition-all hover:scale-[1.01]"
                            onClick={() => handleActivateTheme(theme.slug)}
                          >
                            Apply
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] font-bold rounded-xl border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 h-9 gap-1 shadow-2xs px-2.5 truncate cursor-pointer"
                            onClick={() => {
                              setActiveTab("billing");
                            }}
                          >
                            <Lock className="w-3 h-3 text-amber-800 shrink-0" />
                            <span className="truncate">Unlock</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. COMPACT & SIMPLE CUSTOM BRAND STYLING (COLORS & TYPOGRAPHY) */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                    Colors & Typography
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Customize your accent colors or choose a Google Font for your store.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-neutral-500 hover:text-black font-semibold h-8"
                    onClick={handleResetColorsToTheme}
                  >
                    Reset Defaults
                  </Button>

                  <Button
                    size="sm"
                    className="bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-semibold h-8 px-3.5 shadow-2xs"
                    onClick={handleSaveBrandColors}
                  >
                    {colorSavedToast ? "Saved!" : "Save Colors"}
                  </Button>
                </div>
              </div>

              {/* Row 1: Quick 1-Click Palette Presets */}
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                  Color Presets:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      customPrimary.toLowerCase() === preset.primary.toLowerCase() &&
                      customBackground.toLowerCase() === preset.background.toLowerCase() &&
                      customSurface.toLowerCase() === preset.surface.toLowerCase();

                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setCustomPrimary(preset.primary);
                          setCustomBackground(preset.background);
                          setCustomSurface(preset.surface);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-black ring-1 ring-black bg-neutral-50 shadow-2xs"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div className="flex h-3.5 rounded-md overflow-hidden mb-2 border border-neutral-200">
                          <div className="flex-1" style={{ backgroundColor: preset.background }} />
                          <div className="flex-1" style={{ backgroundColor: preset.primary }} />
                          <div className="flex-1" style={{ backgroundColor: preset.surface }} />
                        </div>
                        <h5 className="font-bold text-[11px] text-neutral-900 truncate">{preset.name}</h5>
                        <p className="text-[10px] text-neutral-400 truncate">{preset.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: 3 Clean Compact Color Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 flex items-center gap-3">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Choose Primary Accent"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-neutral-700 block">Primary Accent</span>
                    <span className="text-[10px] text-neutral-400 block truncate">Buttons & brand headings</span>
                  </div>
                  <Input
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="w-20 font-mono text-xs uppercase h-8 px-2"
                    maxLength={7}
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 flex items-center gap-3">
                  <input
                    type="color"
                    value={customBackground}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Choose Canvas Background"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-neutral-700 block">Canvas Background</span>
                    <span className="text-[10px] text-neutral-400 block truncate">Store page backdrop</span>
                  </div>
                  <Input
                    value={customBackground}
                    onChange={(e) => setCustomBackground(e.target.value)}
                    className="w-20 font-mono text-xs uppercase h-8 px-2"
                    maxLength={7}
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/60 flex items-center gap-3">
                  <input
                    type="color"
                    value={customSurface}
                    onChange={(e) => setCustomSurface(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-300 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Choose Surface & Cards"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-neutral-700 block">Surface & Cards</span>
                    <span className="text-[10px] text-neutral-400 block truncate">Product cards & cart drawer</span>
                  </div>
                  <Input
                    value={customSurface}
                    onChange={(e) => setCustomSurface(e.target.value)}
                    className="w-20 font-mono text-xs uppercase h-8 px-2"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Row 3: Store Typography Selector (Compact Pills) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    Store Font: <span className="text-neutral-900 font-extrabold">{selectedFont}</span>
                  </label>
                  {fontSavedToast && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Font Saved!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {AVAILABLE_FONTS.slice(0, 6).map((font) => {
                    const isSelected =
                      selectedFont.toLowerCase() === font.name.toLowerCase() ||
                      selectedFont.toLowerCase() === font.id.toLowerCase();
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => handleApplyFont(font.name)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-black ring-1 ring-black bg-neutral-50 shadow-2xs"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <span
                          className="block text-sm font-bold text-neutral-900 truncate"
                          style={{ fontFamily: font.fontFamily }}
                        >
                          Aa
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-700 block truncate mt-0.5">
                          {font.name}
                        </span>
                        <span className="text-[9px] text-neutral-400 uppercase block">
                          {font.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: BILLING */}
        {activeTab === "billing" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            <div className="p-6 rounded-lg bg-white border border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">Subscription Plans</h3>
              <p className="text-xs text-neutral-500 mb-6">
                Active Tier: <span className="font-bold text-black">{currentPlan.name}</span>
              </p>

              {upgradeSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 mb-6 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Subscription plan successfully upgraded to {currentPlan.name}! Product capacity and designer theme privileges are immediately active.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(PLATFORM_PLANS).map((plan) => {
                  const isCurrent = store.planId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`p-6 rounded-lg border flex flex-col justify-between ${
                        isCurrent
                          ? "border-black bg-neutral-50 ring-1 ring-black"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">{plan.name}</h4>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-neutral-900">
                            {plan.priceFormatted.split(" ")[0]}
                          </span>
                          <span className="text-xs text-neutral-500">/ month</span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-2">{plan.description}</p>

                        <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-xs text-neutral-700">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t border-neutral-100">
                        {isCurrent ? (
                          <Button size="sm" variant="outline" className="w-full text-xs rounded-md" disabled>
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full text-xs bg-[#111111] text-white hover:bg-black rounded-md cursor-pointer"
                            onClick={() => {
                              handleUpgradePlan(plan.id as any);
                            }}
                          >
                            Upgrade to {plan.name}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: SETTINGS */}
        {activeTab === "settings" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            {/* Store Web Address Card */}
            <div className="p-6 rounded-lg bg-white border border-neutral-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Store Web Address</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Your official public storefront URL on our platform.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(storePublicUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 font-semibold text-neutral-800 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Copy Address</span>
                  </button>
                  <Link href={liveStoreUrl} target="_blank">
                    <Button size="sm" variant="outline" className="text-xs h-8 px-3 gap-1.5 rounded-lg cursor-pointer">
                      <span>Open Store</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span className="font-mono text-sm font-bold text-neutral-900">
                    https://{storeWebDomain}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Subdomain
                </span>
              </div>
            </div>

            {/* Brand Logo & Header Identity */}
            <div className="p-6 rounded-lg bg-white border border-neutral-200 space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Store Logo</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Upload a logo image for your store header.
                  </p>
                </div>
                {logoSavedToast && (
                  <Badge variant="success" className="text-xs">
                    Logo Saved!
                  </Badge>
                )}
              </div>

              {/* Logo Live Preview & Placeholder Box */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                <div className="w-48 h-16 rounded-md bg-white border border-neutral-200 flex items-center justify-center p-2 shadow-xs shrink-0 overflow-hidden">
                  {logoUrlInput ? (
                    <img
                      src={logoUrlInput}
                      alt="Brand Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="border border-dashed border-neutral-300 rounded p-2 text-center w-full h-full flex flex-col items-center justify-center">
                      <Upload className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
                      <span className="text-[10px] text-neutral-400 font-medium">Header Placeholder</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900">
                      {logoUrlInput ? "Custom Logo Active" : "Default Store Name Active"}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      ({store.name})
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Recommended size: 240×60px PNG or SVG. If empty, your store name is displayed.
                  </p>
                </div>
              </div>

              {/* Input & Direct File Upload */}
              <div className="space-y-2">
                <label className="font-bold text-neutral-800 block text-xs">
                  Logo Image URL:
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/brand-logo.png (or upload below)"
                    value={logoUrlInput}
                    onChange={(e) => setLogoUrlInput(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <label className="shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setLogoUrlInput(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="md" className="cursor-pointer gap-1.5 text-xs">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </Button>
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-neutral-400 font-medium">Sample Logos:</span>
                  <button
                    type="button"
                    onClick={() => setLogoUrlInput("https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=400&q=80")}
                    className="text-[10px] px-2 py-0.5 rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    Minimal Geometric
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoUrlInput("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80")}
                    className="text-[10px] px-2 py-0.5 rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                  >
                    Modern Monogram
                  </button>
                  {logoUrlInput && (
                    <button
                      type="button"
                      onClick={() => setLogoUrlInput("")}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 ml-auto"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSaveBrandLogo}
                  size="sm"
                  className="bg-[#111111] text-white hover:bg-black rounded-md text-xs"
                >
                  Save Brand Logo
                </Button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 rounded-lg bg-white border border-neutral-200 space-y-5 text-xs">
              <h3 className="text-sm font-bold text-neutral-900">Payments & Announcement</h3>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  Top Announcement Banner:
                </label>
                <Input
                  placeholder="e.g. Free shipping on orders above ₹999 | Use code SAVE10"
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-neutral-800 block mb-1">
                  UPI ID for Payments:
                </label>
                <Input
                  placeholder="e.g. yourstore@upi"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  required
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Customer payments go directly to your UPI ID without platform middleman fees.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    Cash on Delivery:
                  </label>
                  <select
                    value={codEnabledInput ? "true" : "false"}
                    onChange={(e) => setCodEnabledInput(e.target.value === "true")}
                    className="w-full p-2.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white"
                  >
                    <option value="true">Enabled (Accept COD)</option>
                    <option value="false">Disabled (Prepaid Only)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-800 block mb-1">
                    COD Handling Fee (₹):
                  </label>
                  <Input
                    placeholder="0"
                    value={codFeeInput}
                    onChange={(e) => setCodFeeInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button type="submit" size="sm" className="bg-[#111111] text-white hover:bg-black rounded-md text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 11: PLUGINS & GMAIL AUTOMATION */}
        {activeTab === "plugins" && (
          <div className="mt-6 space-y-6 animate-enter-blur">
            {!isPaidPlan(store.planId) ? (
              /* Paywall Gating for Free Plan */
              <div className="p-8 sm:p-12 rounded-xl bg-white border border-neutral-200 text-center max-w-2xl mx-auto shadow-xs space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                  <Plug className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                    Paid Merchant Exclusive
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-3">
                    Email Notifications
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mt-2 leading-relaxed">
                    Connect your Gmail to send product launch alerts and newsletters directly to subscribed customers.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 max-w-md mx-auto text-left text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-neutral-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct Gmail connection for reliable delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Send product drop alerts to all newsletter subscribers</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Enables newsletter subscription box in storefront footer</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automated alerts when you launch a new category</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="bg-[#111111] text-white hover:bg-black rounded-md text-xs px-6 py-2.5 font-bold shadow-xs"
                  >
                    Upgrade to Growth or Pro Plan
                  </Button>
                </div>
              </div>
            ) : (
              /* Full Plugins & Gmail Workspace */
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="p-6 rounded-lg bg-[#111111] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Plugin Active
                      </span>
                      <span className="text-xs text-neutral-300 font-mono">Growth Plan Feature</span>
                    </div>
                    <h3 className="text-xl font-bold">Email Notifications</h3>
                    <p className="text-xs text-neutral-300 max-w-xl">
                      Send product announcements and new collection alerts directly to customer inboxes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                      <span>{store.subscribers?.length || 0} Subscribed Shoppers</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Gmail Integration Settings */}
                  <div className="p-6 rounded-lg bg-white border border-neutral-200 space-y-5 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-200">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">Gmail Account</h4>
                          <p className="text-[11px] text-neutral-500">Send notifications from your Gmail</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        gmailConnected
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }`}>
                        {gmailConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>

                    <form onSubmit={handleSaveGmailConfig} className="space-y-4">
                      <div>
                        <label className="font-bold text-neutral-800 block mb-1">
                          Your Gmail Address:
                        </label>
                        <Input
                          type="email"
                          required
                          placeholder="e.g. yourstore@gmail.com"
                          value={gmailEmailInput}
                          onChange={(e) => setGmailEmailInput(e.target.value)}
                          className="text-xs font-mono"
                        />
                        <p className="text-[11px] text-neutral-500 mt-1">
                          Customer updates will be sent from this address.
                        </p>
                      </div>

                      <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gmailAutoAlerts}
                            onChange={(e) => setGmailAutoAlerts(e.target.checked)}
                            className="mt-0.5 accent-black w-4 h-4 rounded cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-neutral-900 block">
                              Automatically notify subscribers on new product drops
                            </span>
                            <span className="text-[11px] text-neutral-500 block mt-0.5">
                              When you publish new collections, subscribers receive an automated email alert.
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendTestEmail}
                          className="text-xs gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Send Test Preview</span>
                        </Button>

                        <Button
                          type="submit"
                          size="sm"
                          className="bg-[#111111] text-white hover:bg-black rounded-md text-xs font-semibold"
                        >
                          Save Gmail Settings
                        </Button>
                      </div>

                      {gmailSaveToast && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Gmail configuration saved successfully!</span>
                        </p>
                      )}

                      {testEmailToast && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Test drop announcement email sent to {gmailEmailInput}!</span>
                        </p>
                      )}
                    </form>

                    {/* Technical trust note */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center gap-2 text-[11px] text-neutral-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Authenticated securely via Google OAuth</span>
                    </div>
                  </div>

                  {/* Card 2: Send Drop Announcement Blast Studio */}
                  <div className="p-6 rounded-lg bg-white border border-neutral-200 space-y-5 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                          <Send className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">Send Email Announcement</h4>
                          <p className="text-[11px] text-neutral-500">
                            Deliver email update to all {store.subscribers?.length || 0} active subscribers
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-neutral-500">
                        Campaign #{((store.pluginsConfig?.gmailIntegration?.campaignsSentCount || 0) + 1)}
                      </span>
                    </div>

                    <form onSubmit={handleSendDropAnnouncement} className="space-y-4">
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-neutral-400 font-medium">Quick Template:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDropSubject("🔥 Drop Alert: Vintage Jeans & Denim Collection is LIVE!");
                            setDropCollection("Jeans & Denim");
                            setDropMessage("Hey VIPs! Our highly-anticipated vintage washed and wide leg jeans have officially landed. First 50 orders get free priority shipping with code DENIMVIP.");
                          }}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                        >
                          Jeans Drop
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDropSubject("New Collection Dropped: Oversized Streetwear Pieces");
                            setDropCollection("T-Shirts & Hoodies");
                            setDropMessage("Our newest collection of heavyweight streetwear is now live on our store. Grab your favorite fits before sizes sell out.");
                          }}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                        >
                          Streetwear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDropSubject("⚡ Flash Drop: Weekend Secret Discount Live");
                            setDropCollection("Full Store Catalog");
                            setDropMessage("Surprise drop for our newsletter subscribers! Use code SECRET20 at checkout for an extra 20% off all collections this weekend.");
                          }}
                          className="text-[10px] px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                        >
                          Flash Drop
                        </button>
                      </div>

                      <div>
                        <label className="font-bold text-neutral-800 block mb-1">
                          Email Subject *
                        </label>
                        <Input
                          placeholder="e.g. 🔥 New Collection Just Dropped!"
                          value={dropSubject}
                          onChange={(e) => setDropSubject(e.target.value)}
                          required
                          className="text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-800 block mb-1">
                          Collection Tag (Optional)
                        </label>
                        <Input
                          placeholder="e.g. Jeans, Oversized T-Shirts, New Arrivals"
                          value={dropCollection}
                          onChange={(e) => setDropCollection(e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-800 block mb-1">
                          Message *
                        </label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Tell your subscribers about your newest products, styling details, or discount codes..."
                          value={dropMessage}
                          onChange={(e) => setDropMessage(e.target.value)}
                          className="w-full p-2.5 rounded-md border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black leading-relaxed"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div className="text-[11px] text-neutral-500">
                          Recipients: <strong className="text-neutral-900">{store.subscribers?.length || 0}</strong> subscribers
                        </div>

                        <Button
                          type="submit"
                          disabled={dropSending || (store.subscribers?.length || 0) === 0}
                          size="sm"
                          className="bg-[#111111] text-white hover:bg-black rounded-md text-xs font-semibold gap-1.5 px-4"
                        >
                          {dropSending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Email to Subscribers</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {dropSentSuccess && (
                        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Drop announcement blast successfully delivered to all subscribers!</span>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                {/* Card 3: Captured Storefront Newsletter Subscribers */}
                <div className="p-6 rounded-lg bg-white border border-neutral-200 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">
                        Storefront Newsletter Subscribers ({store.subscribers?.length || 0})
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Shoppers who subscribed through the footer on your storefront ({storeWebDomain}).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-500">
                        Paid Plan Entitlement: <strong>Unlimited Subscriber Storage</strong>
                      </span>
                    </div>
                  </div>

                  {!store.subscribers || store.subscribers.length === 0 ? (
                    <div className="py-8 text-center bg-neutral-50 rounded-lg border border-neutral-200">
                      <Mail className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="font-bold text-neutral-800">No subscribers collected yet</p>
                      <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
                        Visitors subscribe via the footer newsletter box on your live storefront. Their emails will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-500 font-semibold">
                            <th className="py-2.5 px-3">Subscriber Email</th>
                            <th className="py-2.5 px-3">Date Subscribed</th>
                            <th className="py-2.5 px-3">Channel</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {store.subscribers.map((sub) => (
                            <tr key={sub.id} className="hover:bg-neutral-50/70 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-neutral-900 font-mono">
                                {sub.email}
                              </td>
                              <td className="py-2.5 px-3 text-neutral-500">
                                {new Date(sub.subscribedAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="py-2.5 px-3 text-neutral-600">
                                <span className="inline-flex items-center gap-1 text-[11px]">
                                  Storefront Footer
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubscriber(sub.email)}
                                  className="text-neutral-400 hover:text-red-600 text-[11px] font-medium"
                                  title="Remove Subscriber"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Card 4: Additional Merchant Plugins */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <h5 className="font-bold text-xs text-neutral-900">WhatsApp Dispatch</h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Auto-generates pre-filled WhatsApp order confirmations and tracking links for buyers.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-neutral-900" />
                        <h5 className="font-bold text-xs text-neutral-900">Direct UPI Settlement</h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Settles 100% of order value directly to {store.upiId} via NPCI BHIM UPI QR protocols.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-white border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <h5 className="font-bold text-xs text-neutral-900">Instagram Catalog Sync</h5>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Syncs published products and banner lookbooks directly with @{store.instagramHandle || store.subdomain}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      </div>

      {/* Feature 12: Mobile Bottom Floating Pill Navigation (Mobile Only - Desktop uses Sidebar) */}
      <div className="md:hidden fixed bottom-4 inset-x-0 mx-auto w-[92%] max-w-sm z-40">
        <div className="bg-neutral-900/95 backdrop-blur-xl text-white rounded-full px-4 py-2.5 shadow-2xl border border-neutral-800/90 flex items-center justify-around">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
              activeTab === "overview" ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
              activeTab === "orders" ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {unfulfilledOrders.length > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-amber-400" />
            )}
            <span className="text-[10px]">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("discounts")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition-all ${
              activeTab === "discounts" ? "text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className="text-[10px]">Discounts</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-full text-neutral-400 hover:text-white transition-all"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </div>

      {/* Feature 2: Notification Center Slide-Over Drawer (Replaces modal popup) */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-backdrop-in"
            onClick={() => setIsNotificationOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-neutral-200 animate-drawer-right">
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Notification Center</h3>
                    <p className="text-[11px] text-neutral-500">Live store activity & merchant updates</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-700">Recent Alerts</span>
                    {hasUnreadNotifications && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {notifications.filter((n) => n.unread).length} unread
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications(notifications.map((n) => ({ ...n, unread: false })));
                      setHasUnreadNotifications(false);
                    }}
                    className="text-[11px] font-bold text-neutral-500 hover:text-black transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="space-y-2 divide-y divide-neutral-100">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.type === "order") setActiveTab("orders");
                        if (n.type === "stock") setActiveTab("products");
                        if (n.type === "feature") setActiveTab("discounts");
                        setIsNotificationOpen(false);
                      }}
                      className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 ${
                        n.unread ? "bg-neutral-50 hover:bg-neutral-100/80" : "hover:bg-neutral-50 opacity-80"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-neutral-200/60 flex items-center justify-center shrink-0 text-neutral-800 mt-0.5">
                        {n.type === "order" ? <ShoppingBag className="w-4 h-4 text-emerald-600" /> : n.type === "stock" ? <Package className="w-4 h-4 text-amber-600" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-neutral-900 truncate">{n.title}</h5>
                          <span className="text-[10px] text-neutral-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{n.desc}</p>
                      </div>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 12b: Mobile Slide-Over Navigation Drawer (Replaces modal popup) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-backdrop-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col border-r border-neutral-200 p-5 overflow-y-auto animate-drawer-left">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shrink-0 tracking-wider shadow-2xs">
                    {ownerInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-neutral-500 font-medium">{greetingTime},</p>
                    <h4 className="text-xs font-bold text-neutral-900 truncate">Hello, {ownerName} 👋</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="space-y-1 mt-4">
                {[
                  { id: "overview", label: "Overview", icon: LayoutDashboard },
                  { id: "products", label: "Products & Catalog", icon: Package, count: totalProducts },
                  { id: "categories", label: "Categories", icon: FolderTree, count: store.categories?.length || 0 },
                  { id: "orders", label: "Orders", icon: ShoppingBag, count: unfulfilledOrders.length > 0 ? `${unfulfilledOrders.length} pending` : undefined },
                  { id: "discounts", label: "Discounts & Coupons", icon: Tag, count: store.discounts?.length || 0 },
                  { id: "customers", label: "Customers", icon: Users, count: totalCustomers },
                  { id: "reviews", label: "Reviews", icon: Star },
                  { id: "banners", label: "Banners", icon: ImageIcon },
                  { id: "themes", label: "Themes & Styling", icon: Palette },
                  { id: "billing", label: "Subscription", icon: CreditCard },
                  { id: "settings", label: "Store Settings", icon: Settings },
                  { id: "plugins", label: "Plugins & Gmail", icon: Plug },
                ].map((item) => {
                  const Icon = item.icon;
                  const isCurrent = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isCurrent ? "bg-[#111111] text-white" : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isCurrent ? "bg-neutral-800 text-neutral-200" : "bg-neutral-200 text-neutral-800"
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4 mt-auto border-t border-neutral-200 flex items-center justify-between">
                <Link href={liveStoreUrl} target="_blank" className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                  <span>Visit Live Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    router.push("/login");
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Theme Sections Modal (Strictly drag and drop section order) */}
      <Modal
        isOpen={isEditThemeModalOpen}
        onClose={() => setIsEditThemeModalOpen(false)}
        title={editingTheme ? `Edit Theme: ${editingTheme.name}` : "Edit Theme Sections"}
        description="Drag and drop sections to rearrange the homepage order for this theme."
        className="sm:max-w-md"
      >
        <div className="p-5 sm:p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Homepage Section Order
              </span>
              <button
                type="button"
                onClick={handleResetSectionOrder}
                className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            <ReorderList
              items={editingSectionOrder.map((secId) => {
                const sec = DEFAULT_HOMEPAGE_SECTIONS.find((s) => s.id === secId) || {
                  id: secId,
                  title: secId,
                  subtitle: "Homepage section",
                };
                return {
                  id: sec.id,
                  title: sec.title,
                  subtitle: sec.subtitle,
                };
              })}
              onChange={(newItems) => {
                setEditingSectionOrder(newItems.map((item) => item.id));
              }}
            />

            <p className="text-[11px] text-neutral-400 text-center pt-1">
              Drag items up or down to set the exact section sequence on your storefront.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-xl border-neutral-300 h-9 px-4 cursor-pointer"
              onClick={() => setIsEditThemeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-save-section-order"
              data-testid="btn-save-section-order"
              type="button"
              size="sm"
              className="bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-xl h-9 px-5 shadow-2xs cursor-pointer"
              onClick={handleSaveSectionOrder}
            >
              Save Section Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Save Toast for Section Order */}
      {sectionSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-enter-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Homepage section order saved!</span>
        </div>
      )}
    </div>
  );
}
