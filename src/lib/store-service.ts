import { PLATFORM_PLANS, canAddProduct, isThemeAllowed, calculatePlanPrice, type BillingCycle } from "./plans";
import { getTheme, PLATFORM_THEMES, registerUploadedThemes, type ThemeDefinition } from "./themes";
import { manifestToTheme, type ParsedTemplate } from "./templates/package";
import { db, storage } from "./firebase";
import { getStoreDomain, siteConfig } from "./config/site";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size", "Color"
  options: string[]; // ["S", "M", "L"]
}

export interface ProductData {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  description: string;
  price: number; // in paise (e.g. 69900 = ₹699)
  compareAtPrice?: number; // in paise
  costPrice?: number; // in paise
  stock: number;
  category: string;
  gender?: "Men" | "Women" | "Unisex";
  images: string[];
  status: "published" | "draft" | "hidden";
  rating?: number;
  reviewCount?: number;
  colorSwatches?: string[]; // e.g. ["#111111", "#EDE6DC", "#545C4B"]
  options?: ProductVariant[];
  details?: {
    fabric?: string;
    fit?: string;
    care?: string;
  };
  createdAt: string;
}

export interface BannerData {
  id: string;
  storeId: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink: string;
  targetType?: "category" | "product" | "custom";
  targetValue?: string;
  position: number;
  isActive: boolean;
}

export interface ReviewData {
  id: string;
  storeId: string;
  productId: string;
  customerName: string;
  customerPhone?: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface OrderItemData {
  productId: string;
  title: string;
  image: string;
  quantity: number;
  price: number; // paise
  variantName?: string;
}

export interface OrderData {
  id: string;
  storeId: string;
  number: string; // e.g. "#1004"
  token: string; // unguessable tracking token
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItemData[];
  subtotal: number; // paise
  discount: number; // paise
  delivery: number; // paise
  codFee: number; // paise
  total: number; // paise
  paymentMethod: "upi" | "cod" | "bank_transfer";
  paymentStatus: "awaiting_verification" | "verified" | "cod_pending" | "paid" | "rejected";
  paymentUtr?: string;
  fulfilmentStatus: "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerData {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders: number;
  totalSpent: number; // paise
  lastOrderAt: string;
}

export interface CustomBrandTheme {
  primary: string; // Brand accent & buttons (e.g. #111111)
  background: string; // Page background / canvas (e.g. #FDFBF7)
  surface: string; // Card / container surface (e.g. #FFFFFF)
}

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  itemCount?: number;
  isActive: boolean;
  position: number;
  createdAt?: string;
  isParent?: boolean; // true if this is a Parent Category / Collection card
  parentId?: string; // id of parent category if this is a child
  subtitle?: string; // e.g. "Modern fits for everyday style."
  ctaText?: string; // e.g. "Shop Denim & Jeans"
  ctaCategorySlug?: string;
}

export interface DiscountData {
  id: string;
  code: string; // e.g. "WELCOME10", "FESTIVE20"
  type: "percentage" | "flat"; // percentage or flat in paise
  value: number; // percentage (e.g. 15 for 15%) or paise (e.g. 10000 for ₹100)
  minOrderValue?: number; // in paise
  maxDiscount?: number; // in paise (for percentage discounts)
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface StoreData {
  id: string;
  name: string;
  subdomain: string;
  status: "draft" | "published" | "suspended";
  category: string;
  tagline: string;
  logoUrl?: string;
  ownerName: string;
  ownerId?: string;
  ownerEmail?: string;
  contactPhone: string;
  contactEmail?: string;
  instagramHandle?: string;
  upiId: string; // Direct UPI ID for customer QR payments
  codEnabled: boolean;
  codFee: number; // paise
  freeDeliveryThreshold: number; // paise (e.g. 99900 = ₹999)
  standardDeliveryFee: number; // paise (e.g. 7000 = ₹70)
  planId: "free" | "starter" | "pro";
  activeThemeSlug: string;
  customBrandTheme?: CustomBrandTheme;
  fontFamily?: string;
  announcementText?: string;
  isPaused: boolean;
  pauseMessage?: string;
  categories: CategoryData[];
  products: ProductData[];
  banners: BannerData[];
  reviews: ReviewData[];
  orders: OrderData[];
  customers: CustomerData[];
  subscribers?: SubscriberData[];
  pendingSubscription?: SubscriptionRequest | null;
  subscriptionHistory?: SubscriptionRequest[];
  discounts?: DiscountData[];
  pluginsConfig?: PluginsConfigData;
  homepageSections?: string[];
  themeSectionOrders?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRequest {
  id: string;
  referenceId: string;
  storeSubdomain: string;
  storeName: string;
  planId: "starter" | "pro";
  planName: string;
  amount: number;
  amountFormatted: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  status: "pending_verification" | "verified" | "rejected";
  paymentMethod: "upi";
  payeeUpiId: string;
  paymentUtr?: string;
  createdAt: string;
  estimatedVerificationTime: string;
  verifiedAt?: string;
  note?: string;
}

export interface SubscriberData {
  id: string;
  email: string;
  subscribedAt: string;
}

export interface PlatformBroadcast {
  id: string;
  target: "all" | "free" | "starter" | "pro";
  subject: string;
  message: string;
  ctaText?: string;
  ctaLink?: string;
  sentAt: string;
  recipientCount: number;
}

// Storefront template uploaded as a ZIP from the admin dashboard
export interface PlatformTemplate {
  id: string; // same as the theme slug
  status: "draft" | "published";
  theme: ThemeDefinition;
  fileName: string;
  storagePaths?: string[];
  createdAt: string;
  updatedAt: string;
}

// Image banner the platform admin shows on every seller's dashboard overview
export interface PlatformBanner {
  id: string;
  imageUrl: string;
  link?: string; // path inside the app (e.g. /dashboard?tab=themes) or a full URL
  storagePath?: string; // set when the image lives in Firebase Storage
  createdAt: string;
}

export interface PluginsConfigData {
  gmail?: {
    connected: boolean;
    email: string;
    autoDropAlerts: boolean;
    lastSyncAt?: string;
  };
  gmailIntegration?: {
    isConnected: boolean;
    connectedEmail?: string;
    autoSendNewDropAlerts: boolean;
    lastCampaignSentAt?: string;
    campaignsSentCount?: number;
  };
  whatsappBot?: {
    connected: boolean;
    phone?: string;
  };
  whatsappNotifications?: {
    isConnected: boolean;
  };
}

export interface HomepageSectionItem {
  id: string;
  title: string;
  subtitle: string;
}

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionItem[] = [
  {
    id: "hero",
    title: "Hero Banner & Carousel",
    subtitle: "Top promotional slides and showcase banner",
  },
  {
    id: "stories",
    title: "Category Stories",
    subtitle: "Circular category quick-navigation stories",
  },
  {
    id: "featured-collections",
    title: "Featured Collections",
    subtitle: "Highlighted collection cards and parent categories",
  },
  {
    id: "products",
    title: "Product Catalog Grid",
    subtitle: "Best sellers, product cards and catalog directory",
  },
  {
    id: "editorial-promo",
    title: "Editorial Promo Banner",
    subtitle: "Full-width campaign spotlight and promo banner",
  },
  {
    id: "categories-grid",
    title: "Shop by Category Grid",
    subtitle: "Visual grid directory of all store categories",
  },
];

export const DEFAULT_HOMEPAGE_SECTION_IDS: string[] = DEFAULT_HOMEPAGE_SECTIONS.map((s) => s.id);

export const DEFAULT_LUME_CATEGORIES: CategoryData[] = [
  // Parent Categories (Collections with storefront cards)
  {
    id: "cat-parent-mens",
    name: "Men's Collection",
    slug: "mens-collection",
    description: "Modern fits for everyday style.",
    subtitle: "Modern fits for everyday style.",
    ctaText: "Shop Denim & Jeans",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    isParent: true,
    isActive: true,
    position: 0,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-parent-womens",
    name: "Women's Collection",
    slug: "womens-collection",
    description: "Trendy styles for every you.",
    subtitle: "Trendy styles for every you.",
    ctaText: "Shop Dresses & Tops",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    isParent: true,
    isActive: true,
    position: 1,
    createdAt: "2026-09-01T10:00:00Z",
  },
  // Child Categories
  {
    id: "cat-lume-t-shirts",
    name: "T-Shirts",
    slug: "t-shirts",
    parentId: "cat-parent-mens",
    description: "Heavyweight combed organic cotton tees in oversized and boxy silhouettes.",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 2,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-lume-jeans",
    name: "Jeans",
    slug: "jeans",
    parentId: "cat-parent-mens",
    description: "Vintage washed, wide leg, relaxed and structured denim tailored for modern style.",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 3,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-lume-hoodies",
    name: "Hoodies",
    slug: "hoodies",
    parentId: "cat-parent-mens",
    description: "Cozy 400 GSM brushed fleece pullovers and relaxed layers for cooler evenings.",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 4,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-lume-shirts",
    name: "Shirts",
    slug: "shirts",
    parentId: "cat-parent-mens",
    description: "Pure French flax linen and crisp cotton button-downs for easy smart dressing.",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 5,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-lume-dresses",
    name: "Dresses",
    slug: "dresses",
    parentId: "cat-parent-womens",
    description: "Flowy silhouettes, pleated slips, and statement occasion wear.",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 6,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-lume-jackets",
    name: "Jackets",
    slug: "jackets",
    parentId: "cat-parent-mens",
    description: "Structured wool overshirts, blazers, and transitional outerwear.",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 7,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-lume-tops",
    name: "Tops",
    slug: "tops",
    parentId: "cat-parent-womens",
    description: "Everyday ribbed tanks, cropped basics, and versatile layering pieces.",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 8,
    createdAt: "2026-09-01T10:00:00Z",
  },
];

export const DEFAULT_JAIPUR_CATEGORIES: CategoryData[] = [
  {
    id: "cat-jc-jewellery",
    name: "Jewellery",
    slug: "jewellery",
    description: "Handcrafted traditional Kundan, Meenakari, and Polki designer jewellery.",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 0,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-jc-home-decor",
    name: "Home Decor",
    slug: "home-decor",
    description: "Hand-painted blue pottery, brass centerpieces, and traditional handicrafts.",
    imageUrl: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 1,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-jc-ethnic-wear",
    name: "Ethnic Wear",
    slug: "ethnic-wear",
    description: "Authentic Bagru and Sanganeri hand-block printed cotton dupattas and suits.",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 2,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "cat-jc-spiritual",
    name: "Spiritual & Decor",
    slug: "spiritual-decor",
    description: "Intricately cast solid brass diyas, idols, and pooja essentials.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    position: 3,
    createdAt: "2026-09-01T10:00:00Z",
  },
];

export function buildDefaultCategoriesForStore(subdomainOrStore: string | StoreData): CategoryData[] {
  const sub = typeof subdomainOrStore === "string" ? subdomainOrStore.toLowerCase() : subdomainOrStore.subdomain.toLowerCase();
  if (sub === "lume") return [...DEFAULT_LUME_CATEGORIES];
  if (sub === "jaipurcrafts") return [...DEFAULT_JAIPUR_CATEGORIES];

  if (typeof subdomainOrStore !== "string" && subdomainOrStore.products) {
    const unique = Array.from(new Set(subdomainOrStore.products.map((p) => p.category).filter(Boolean)));
    if (unique.length > 0) {
      return unique.map((name, idx) => ({
        id: `cat-${sub}-${idx + 1}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${idx + 1}`,
        description: `Explore our handpicked ${name} selection.`,
        imageUrl:
          subdomainOrStore.products.find((p) => p.category === name)?.images[0] ||
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        isActive: true,
        position: idx,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  return [...DEFAULT_LUME_CATEGORIES];
}

// Initial Seed Stores matching the exact editorial theme
const INITIAL_STORES: Record<string, StoreData> = {
  lume: {
    id: "store-lume-001",
    name: "Lume.",
    subdomain: "lume",
    status: "published",
    category: "Modern Apparel & Lifestyle",
    tagline: "Style That Moves With You. Modern fashion for everyday moments.",
    logoUrl: "",
    categories: [...DEFAULT_LUME_CATEGORIES],

    ownerName: "Elena Vance",
    contactPhone: "+919876500000",
    contactEmail: "concierge@lume.store",
    instagramHandle: "@lume.everyday",
    upiId: "lume@okhdfcbank",
    codEnabled: true,
    codFee: 0,
    freeDeliveryThreshold: 99900, // Free delivery above ₹999
    standardDeliveryFee: 7900, // ₹79 standard
    planId: "pro",
    activeThemeSlug: "classic-bloom",
    customBrandTheme: {
      primary: "#111111", // Pitch Black
      background: "#FDFBF7", // Soft Warm Cream
      surface: "#FFFFFF", // Pure White
    },
    fontFamily: "Outfit",
    announcementText: "Get 10% off on your first order | Free shipping above ₹999",
    isPaused: false,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-10-23T10:00:00Z",
    banners: [
      {
        id: "banner-lume-1",
        storeId: "store-lume-001",
        title: "Style That Moves With You",
        imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80",
        ctaLink: "/s/lume?category=T-Shirts",
        targetType: "category",
        targetValue: "T-Shirts",
        position: 0,
        isActive: true,
      },
      {
        id: "banner-lume-2",
        storeId: "store-lume-001",
        title: "Essential Everyday Layers",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80",
        ctaLink: "/s/lume/products/essential-hoodie",
        targetType: "product",
        targetValue: "essential-hoodie",
        position: 1,
        isActive: true,
      },
      {
        id: "banner-lume-3",
        storeId: "store-lume-001",
        title: "Modern Wide Leg Denim",
        imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80",
        ctaLink: "/s/lume?category=Jeans",
        targetType: "category",
        targetValue: "Jeans",
        position: 2,
        isActive: true,
      },
    ],
    products: [
      {
        id: "lume-prod-1",
        storeId: "store-lume-001",
        title: "Oversized Cotton T-Shirt",
        slug: "oversized-cotton-t-shirt",
        description: "Crafted from 240 GSM heavy combed organic cotton with a structured relaxed silhouette. Features drop shoulders, reinforced ribbed neckline, and an ultra-soft garment-washed finish that holds its drape wash after wash.",
        price: 69900, // ₹699
        compareAtPrice: 99900, // ₹999 (-30%)
        costPrice: 32000,
        stock: 45,
        category: "T-Shirts",
        gender: "Men",
        images: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.6,
        reviewCount: 1240,
        colorSwatches: ["#111111", "#E6E2DC", "#4A5243"],
        options: [
          { id: "opt-color-1", name: "Color", options: ["Pitch Black", "Chalk White", "Vintage Olive"] },
          { id: "opt-size-1", name: "Size", options: ["S", "M", "L", "XL"] },
        ],
        details: {
          fabric: "100% Combed Heavy Organic Cotton (240 GSM)",
          fit: "Relaxed boxy silhouette with drop shoulders",
          care: "Machine wash cold inside-out, tumble dry low or line dry in shade",
        },
        createdAt: "2026-09-02T10:00:00Z",
      },
      {
        id: "lume-prod-2",
        storeId: "store-lume-001",
        title: "Essential Relaxed Hoodie",
        slug: "essential-relaxed-hoodie",
        description: "Heavyweight 380 GSM fleece pullover with a double-layered structured hood. Brushed interior for warmth without weight. Clean minimal aesthetic without exterior drawstrings for a sleek architectural drape.",
        price: 99900, // ₹999
        compareAtPrice: 149900, // ₹1,499
        costPrice: 48000,
        stock: 32,
        category: "Hoodies",
        gender: "Men",
        images: [
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.5,
        reviewCount: 892,
        colorSwatches: ["#E8E3D9", "#1A1A1A", "#8C8275"],
        options: [
          { id: "opt-color-2", name: "Color", options: ["Oat Milk", "Onyx Black", "Warm Taupe"] },
          { id: "opt-size-2", name: "Size", options: ["S", "M", "L", "XL"] },
        ],
        details: {
          fabric: "80% Cotton, 20% Polyester Brushed Terry (380 GSM)",
          fit: "Generous relaxed fit, true to size",
          care: "Gentle wash with similar colors, iron on reverse",
        },
        createdAt: "2026-09-05T10:00:00Z",
      },
      {
        id: "lume-prod-3",
        storeId: "store-lume-001",
        title: "High-Rise Wide Leg Jeans",
        slug: "high-rise-wide-leg-jeans",
        description: "Non-stretch 13.5 oz authentic ring-spun denim that softens gracefully with wear. Features a fitted high waist with an elongated straight wide leg that flatters every silhouette effortlessly.",
        price: 129900, // ₹1,299
        compareAtPrice: 179900, // ₹1,799 (-20%)
        costPrice: 65000,
        stock: 28,
        category: "Jeans",
        gender: "Women",
        images: [
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.7,
        reviewCount: 1120,
        colorSwatches: ["#6B88A4", "#1A1A1A", "#C2CAD0"],
        options: [
          { id: "opt-color-3", name: "Wash", options: ["Classic Mid Indigo", "Jet Black", "Sun bleached Light"] },
          { id: "opt-size-3", name: "Waist", options: ["26", "28", "30", "32"] },
        ],
        details: {
          fabric: "100% Rigid Organic Cotton Denim (13.5 oz)",
          fit: "Fitted high rise, full-length wide leg",
          care: "Wash inside-out in cold water, hang dry to maintain color vibrancy",
        },
        createdAt: "2026-09-08T10:00:00Z",
      },
      {
        id: "lume-prod-4",
        storeId: "store-lume-001",
        title: "Ribbed Knit Crop Top",
        slug: "ribbed-knit-crop-top",
        description: "Sculpting micro-rib fabric woven with breathability and gentle compression. Features a classic high crew neckline and clean armholes designed to pair seamlessly with high-waisted denim or trousers.",
        price: 79900, // ₹799
        compareAtPrice: 109900, // ₹1,099
        costPrice: 38000,
        stock: 40,
        category: "Tops",
        gender: "Women",
        images: [
          "https://images.unsplash.com/photo-1503342452485-86b7f54527ef?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.5,
        reviewCount: 876,
        colorSwatches: ["#F0ECE1", "#1E1E1E", "#9A7E68"],
        options: [
          { id: "opt-color-4", name: "Color", options: ["Cream", "Black", "Sandstone"] },
          { id: "opt-size-4", name: "Size", options: ["XS", "S", "M", "L"] },
        ],
        details: {
          fabric: "95% Modal Rib, 5% Spandex",
          fit: "Snug body-skimming cropped length",
          care: "Hand wash cold or gentle machine cycle in laundry net",
        },
        createdAt: "2026-09-10T10:00:00Z",
      },
      {
        id: "lume-prod-5",
        storeId: "store-lume-001",
        title: "Linen Blend Casual Shirt",
        slug: "linen-blend-casual-shirt",
        description: "Breezy French linen blended with soft combed cotton. Enzyme-washed for immediate lived-in softness with natural breathable texture. Features mother-of-pearl buttons and a clean resort collar.",
        price: 119900, // ₹1,199
        compareAtPrice: 169900, // ₹1,699
        costPrice: 58000,
        stock: 22,
        category: "Shirts",
        gender: "Men",
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.6,
        reviewCount: 1340,
        colorSwatches: ["#3D6B99", "#EFECE6", "#44403C"],
        options: [
          { id: "opt-color-5", name: "Color", options: ["Aegean Slate", "Crisp Ivory", "Espresso"] },
          { id: "opt-size-5", name: "Size", options: ["S", "M", "L", "XL"] },
        ],
        details: {
          fabric: "55% French Linen, 45% Combed Cotton",
          fit: "Relaxed regular silhouette with curved hem",
          care: "Machine wash cold, air dry, steam iron while damp",
        },
        createdAt: "2026-09-12T10:00:00Z",
      },
      {
        id: "lume-prod-6",
        storeId: "store-lume-001",
        title: "Tailored Utility Jacket",
        slug: "tailored-utility-jacket",
        description: "Architectural structured overshirt jacket in heavy twill. Double flap chest pockets, hidden interior passport pouch, and matte black tonal hardware for an effortless layering piece.",
        price: 219900, // ₹2,199
        compareAtPrice: 299900, // ₹2,999 (-25%)
        costPrice: 98000,
        stock: 16,
        category: "Jackets",
        gender: "Unisex",
        images: [
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.8,
        reviewCount: 940,
        colorSwatches: ["#1C1917", "#44403C"],
        options: [
          { id: "opt-color-6", name: "Color", options: ["Matte Black", "Field Charcoal"] },
          { id: "opt-size-6", name: "Size", options: ["S", "M", "L", "XL"] },
        ],
        details: {
          fabric: "100% Heavyweight Cotton Twill (340 GSM)",
          fit: "Boxy overshirt fit for easy layering",
          care: "Dry clean or machine wash cold gentle cycle",
        },
        createdAt: "2026-09-15T10:00:00Z",
      },
      {
        id: "lume-prod-7",
        storeId: "store-lume-001",
        title: "Minimalist Silk Slip Dress",
        slug: "minimalist-silk-slip-dress",
        description: "Cut on the bias for fluid movement that skims the body without clinging. Features delicate adjustable spaghetti straps, French seams, and a soft midi hemline that transitions from day to evening.",
        price: 159900, // ₹1,599
        compareAtPrice: 219900, // ₹2,199 (-27%)
        costPrice: 72000,
        stock: 19,
        category: "Dresses",
        gender: "Women",
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.7,
        reviewCount: 650,
        colorSwatches: ["#9E5A44", "#1C1917", "#D4C7B5"],
        options: [
          { id: "opt-color-7", name: "Color", options: ["Terracotta", "Pure Noir", "Champagne"] },
          { id: "opt-size-7", name: "Size", options: ["XS", "S", "M", "L"] },
        ],
        details: {
          fabric: "100% Sandwashed Mulberry Silk Feel Satin",
          fit: "Bias-cut fluid drape, midi length",
          care: "Hand wash cold with silk detergent or dry clean",
        },
        createdAt: "2026-09-18T10:00:00Z",
      },
      {
        id: "lume-prod-8",
        storeId: "store-lume-001",
        title: "Relaxed Fit Cargo Trousers",
        slug: "relaxed-fit-cargo-trousers",
        description: "Durable cotton ripstop trousers featuring articulated knee seams, flush cargo pockets with concealed snap closures, and an adjustable toggle hem to switch between straight and tapered silhouettes.",
        price: 139900, // ₹1,399
        compareAtPrice: 189900, // ₹1,899 (-26%)
        costPrice: 62000,
        stock: 25,
        category: "Jeans",
        gender: "Men",
        images: [
          "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80",
        ],
        status: "published",
        rating: 4.6,
        reviewCount: 1180,
        colorSwatches: ["#475569", "#78716C", "#1E293B"],
        options: [
          { id: "opt-color-8", name: "Color", options: ["Dark Slate", "Wet Cement", "Washed Black"] },
          { id: "opt-size-8", name: "Waist", options: ["30", "32", "34", "36"] },
        ],
        details: {
          fabric: "100% Cotton Ripstop (280 GSM)",
          fit: "Relaxed straight with convertible toggle ankle",
          care: "Machine wash cold with similar colors",
        },
        createdAt: "2026-09-20T10:00:00Z",
      },
    ],
    reviews: [
      {
        id: "rev-lume-1",
        storeId: "store-lume-001",
        productId: "lume-prod-1",
        customerName: "Kavya Menon",
        rating: 5,
        title: "Best oversized tee I have ever purchased",
        comment: "The 240 GSM weight is immaculate. It falls straight without feeling stiff and the neckline doesn't stretch out after washing. Truly luxurious feeling.",
        verifiedPurchase: true,
        status: "approved",
        createdAt: "2026-10-12T14:30:00Z",
      },
      {
        id: "rev-lume-2",
        storeId: "store-lume-001",
        productId: "lume-prod-2",
        customerName: "Arjun Singhal",
        rating: 5,
        title: "Structured, cozy, and zero branding",
        comment: "Finally a hoodie with no giant loud logos. The hood stays up and structured. Received within 48 hours via Delhivery in Gurgaon.",
        verifiedPurchase: true,
        status: "approved",
        createdAt: "2026-10-16T11:00:00Z",
      },
      {
        id: "rev-lume-3",
        storeId: "store-lume-001",
        productId: "lume-prod-3",
        customerName: "Sanya Chopra",
        rating: 5,
        title: "Flattering high waist cut",
        comment: "The denim feels authentic and substantial. Length is ideal with loafers or sneakers. Ordered size 28 and the fit is spot on.",
        verifiedPurchase: true,
        status: "approved",
        createdAt: "2026-10-18T16:20:00Z",
      },
    ],
    orders: [],
    customers: [],
  },

  jaipurcrafts: {
    id: "store-jaipur-crafts-001",
    name: "Jaipur Heritage",
    subdomain: "jaipurcrafts",
    status: "published",
    category: "Handicrafts & Jewellery",
    tagline: "Authentic handcrafted Kundan jewellery and artisanal decor",
    logoUrl: "",
    categories: [...DEFAULT_JAIPUR_CATEGORIES],

    ownerName: "Sunita Rathore",
    contactPhone: "+919829012345",
    contactEmail: "sunita@jaipurcrafts.in",
    instagramHandle: "@jaipurcrafts.official",
    upiId: "jaipurcrafts@okhdfcbank",
    codEnabled: true,
    codFee: 4900,
    freeDeliveryThreshold: 99900,
    standardDeliveryFee: 6000,
    planId: "free",
    activeThemeSlug: "classic-bloom",
    customBrandTheme: {
      primary: "#111111",
      background: "#FAF8F5",
      surface: "#FFFFFF",
    },
    fontFamily: "Outfit",
    announcementText: "Festive Offer: Free shipping across India on orders above ₹999",
    isPaused: false,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-10-22T12:00:00Z",
    banners: [
      {
        id: "banner-1",
        storeId: "store-jaipur-crafts-001",
        title: "Artisanal Treasures Direct from Jaipur",
        subtitle: "Hand-crafted with heritage techniques passed down through generations. 100% authentic.",
        imageUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1200&q=80",
        ctaText: "Explore Collection",
        ctaLink: "#products",
        position: 0,
        isActive: true,
      },
    ],
    products: [
      {
        id: "prod-1",
        storeId: "store-jaipur-crafts-001",
        title: "Handcrafted Kundan Meenakari Choker Necklace Set",
        slug: "kundan-meenakari-choker-necklace-set",
        description: "Exquisite 24K gold plated choker necklace with royal emerald green meenakari enamelling and matching jhumka earrings. Perfect for weddings and festive galas.",
        price: 249900,
        compareAtPrice: 399900,
        costPrice: 120000,
        stock: 15,
        category: "Jewellery",
        images: [
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 4.9,
        reviewCount: 32,
        colorSwatches: ["#047857", "#B91C1C", "#1E3A8A"],
        options: [
          { id: "opt-1", name: "Color", options: ["Emerald Green", "Ruby Pink", "Royal Blue"] },
        ],
        createdAt: "2026-09-05T10:00:00Z",
      },
      {
        id: "prod-2",
        storeId: "store-jaipur-crafts-001",
        title: "Jaipur Traditional Blue Pottery Floral Vase (10 inch)",
        slug: "jaipur-blue-pottery-floral-vase",
        description: "Hand-painted ceramic quartz pottery vase crafted by master artisans in Kot Jewar. Unique Persian cobalt blue motifs. Waterproof and glazed.",
        price: 129900,
        compareAtPrice: 189900,
        costPrice: 60000,
        stock: 8,
        category: "Home Decor",
        images: [
          "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 4.8,
        reviewCount: 19,
        createdAt: "2026-09-08T10:00:00Z",
      },
      {
        id: "prod-3",
        storeId: "store-jaipur-crafts-001",
        title: "Pure Mulmul Sanganeri Block Print Kurta Set",
        slug: "sanganeri-block-print-kurta-set",
        description: "Breathable 100% fine cotton printed with wooden hand-carved blocks in authentic floral buta designs. Comes with pants and matching printed kota doria dupatta.",
        price: 185000,
        compareAtPrice: 249900,
        costPrice: 90000,
        stock: 12,
        category: "Ethnic Wear",
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 5.0,
        reviewCount: 24,
        options: [
          { id: "opt-2", name: "Size", options: ["S (36)", "M (38)", "L (40)", "XL (42)"] },
        ],
        createdAt: "2026-09-12T10:00:00Z",
      },
      {
        id: "prod-4",
        storeId: "store-jaipur-crafts-001",
        title: "Heavy Cast Solid Brass Peacock Oil Diya",
        slug: "brass-peacock-oil-diya",
        description: "Intricately detailed pure brass oil lamp with peacock arch. Ideal for pooja room, festive gifting, and housewarming celebrations.",
        price: 89900,
        compareAtPrice: 125000,
        costPrice: 40000,
        stock: 20,
        category: "Spiritual & Decor",
        images: [
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 4.7,
        reviewCount: 14,
        createdAt: "2026-09-15T10:00:00Z",
      },
    ],
    reviews: [
      {
        id: "rev-1",
        storeId: "store-jaipur-crafts-001",
        productId: "prod-1",
        customerName: "Priya Sharma",
        rating: 5,
        title: "Stunning jewellery set, looked royal on my sister's wedding!",
        comment: "The finish is top-notch. Everyone thought it was real gold and emerald. Direct UPI checkout was super smooth and received within 3 days in Mumbai.",
        verifiedPurchase: true,
        status: "approved",
        createdAt: "2026-10-10T14:30:00Z",
      },
    ],
    orders: [],
    customers: [],
  },
};

// Global Store State Manager with Firebase Firestore Cloud Sync & LocalStorage fallback
class StoreService {
  private stores: Record<string, StoreData> = { ...INITIAL_STORES };
  private initialized = false;
  private firebaseConnected = false;
  private cloudSynced = false;

  /** True once the first cloud snapshot of stores has arrived (or the listener failed). */
  public isCloudSynced(): boolean {
    return this.cloudSynced;
  }
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error("StoreService listener error:", err);
      }
    });
  }

  public async syncStoreToFirebase(subdomain: string) {
    if (typeof window === "undefined") return;
    const store = this.stores[subdomain];
    if (!store) return;
    try {
      const cleanData = JSON.parse(JSON.stringify(store));
      await setDoc(doc(db, "stores", subdomain), cleanData, { merge: true });
    } catch (err) {
      console.warn(`[Firebase Firestore] Store "${subdomain}" sync warning:`, err);
    }
  }

  private connectFirebase() {
    if (typeof window === "undefined" || this.firebaseConnected) return;
    this.firebaseConnected = true;

    try {
      const storesCol = collection(db, "stores");
      onSnapshot(
        storesCol,
        (snapshot) => {
          const firstSync = !this.cloudSynced;
          this.cloudSynced = true;
          if (snapshot.empty) {
            // Seed initial stores if cloud is brand new
            Object.values(this.stores).forEach((store) => {
              const cleanData = JSON.parse(JSON.stringify(store));
              setDoc(doc(db, "stores", store.subdomain), cleanData, { merge: true }).catch((err) =>
                console.warn(`[Firebase Firestore] Seed store "${store.subdomain}" error:`, err)
              );
            });
          } else {
            let hasChanges = false;
            snapshot.docs.forEach((d) => {
              const data = d.data() as StoreData;
              if (data && data.subdomain) {
                this.stores[data.subdomain] = data;
                hasChanges = true;
              }
            });
            if (hasChanges) {
              this.persist();
              this.notify();
            }
          }
          if (firstSync) this.notify();
        },
        (error) => {
          console.warn("[Firebase Firestore] Real-time listener warning:", error);
          this.cloudSynced = true;
          this.notify();
        }
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Connection failed:", err);
    }
  }

  private initClient() {
    if (typeof window !== "undefined" && !this.initialized) {
      try {
        const saved = localStorage.getItem("shopper_stores_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          this.stores = { ...INITIAL_STORES, ...parsed };
        }
      } catch (e) {
        console.error("Failed to load stores from localStorage", e);
      }

      // Ensure all stores have categories, subscribers, and pluginsConfig initialized cleanly (no demo mocks)
      Object.keys(this.stores).forEach((sub) => {
        const s = this.stores[sub];
        if (!s.categories || s.categories.length === 0) {
          s.categories = this.buildDefaultCategoriesForStore(s);
        }

        // Ensure parent categories exist (Men's & Women's collections)
        const hasParent = s.categories.some((c) => c.isParent);
        if (!hasParent) {
          const parentMens: CategoryData = {
            id: `cat-parent-${s.subdomain}-mens`,
            name: "Men's Collection",
            slug: "mens-collection",
            description: "Modern fits for everyday style.",
            subtitle: "Modern fits for everyday style.",
            ctaText: "Shop Denim & Jeans",
            imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
            isParent: true,
            isActive: true,
            position: 0,
            createdAt: s.createdAt || new Date().toISOString(),
          };
          const parentWomens: CategoryData = {
            id: `cat-parent-${s.subdomain}-womens`,
            name: "Women's Collection",
            slug: "womens-collection",
            description: "Trendy styles for every you.",
            subtitle: "Trendy styles for every you.",
            ctaText: "Shop Dresses & Tops",
            imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
            isParent: true,
            isActive: true,
            position: 1,
            createdAt: s.createdAt || new Date().toISOString(),
          };

          // Link children categories to the parent collections
          s.categories.forEach((cat) => {
            if (!cat.parentId && !cat.isParent) {
              const nameLower = cat.name.toLowerCase();
              if (
                nameLower.includes("dress") ||
                nameLower.includes("top") ||
                nameLower.includes("women") ||
                nameLower.includes("skirt") ||
                nameLower.includes("jewel") ||
                nameLower.includes("beauty")
              ) {
                cat.parentId = parentWomens.id;
              } else {
                cat.parentId = parentMens.id;
              }
            }
          });

          s.categories = [parentMens, parentWomens, ...s.categories];
        }

        if (!s.subscribers) {
          s.subscribers = [];
        }
        // Stores start with no coupons; sellers create their own in the dashboard
        if (!s.discounts) {
          s.discounts = [];
        }
        if (!s.pluginsConfig) {
          s.pluginsConfig = {
            gmail: {
              connected: false,
              email: s.contactEmail || "",
              autoDropAlerts: false,
              lastSyncAt: undefined,
            },
            gmailIntegration: {
              isConnected: false,
              connectedEmail: s.contactEmail || "",
              autoSendNewDropAlerts: false,
              campaignsSentCount: 0,
            },
            whatsappBot: {
              connected: false,
              phone: s.contactPhone || "",
            },
            whatsappNotifications: {
              isConnected: false,
            },
          };
        }
      });

      this.persist();
      this.initialized = true;
      this.connectFirebase();
      this.loadPlatformTemplates();
      this.connectPlatformTemplates();
    }
  }


  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("shopper_stores_state", JSON.stringify(this.stores));
      } catch (e) {
        console.error("Failed to save stores to localStorage", e);
      }
    }
  }

  public getAllStores(): StoreData[] {
    this.initClient();
    return Object.values(this.stores);
  }

  public getUserStores(ownerId?: string, ownerEmail?: string): StoreData[] {
    this.initClient();
    if (!ownerId && !ownerEmail) return [];
    return Object.values(this.stores).filter((s) => {
      if (ownerId && s.ownerId === ownerId) return true;
      if (ownerEmail) {
        const cleanEmail = ownerEmail.toLowerCase().trim();
        if (s.ownerEmail && s.ownerEmail.toLowerCase().trim() === cleanEmail) return true;
        if (s.contactEmail && s.contactEmail.toLowerCase().trim() === cleanEmail) return true;
      }
      return false;
    });
  }

  public getStore(subdomainOrId: string): StoreData | null {
    this.initClient();
    if (!subdomainOrId) return null;
    const cleanKey = subdomainOrId.toLowerCase().trim();
    // Direct subdomain lookup
    if (this.stores[cleanKey]) {
      return this.stores[cleanKey];
    }
    // Search by id or matching subdomain
    const found = Object.values(this.stores).find(
      (s) => s.id === subdomainOrId || s.subdomain.toLowerCase() === cleanKey
    );
    return found || null;
  }

  public getProductBySlug(
    subdomain: string,
    slug: string
  ): { store: StoreData; product: ProductData } | null {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return null;

    const product = store.products.find(
      (p) => p.slug === slug || p.id === slug
    );
    if (!product) return null;

    return { store, product };
  }

  public registerStore(input: {
    name: string;
    subdomain: string;
    category: string;
    ownerName: string;
    contactPhone: string;
    contactEmail?: string;
    upiId: string;
    tagline?: string;
    ownerId?: string;
    ownerEmail?: string;
  }): StoreData {
    this.initClient();
    const cleanSubdomain = input.subdomain
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "");

    if (this.stores[cleanSubdomain]) {
      throw new Error(`Domain "${getStoreDomain(cleanSubdomain)}" is already registered.`);
    }

    const newStoreId = `store-${cleanSubdomain}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    // Default starter products tailored to category
    const starterProducts: ProductData[] = [
      {
        id: `prod-${cleanSubdomain}-1`,
        storeId: newStoreId,
        title: `${input.name} Signature Product`,
        slug: "signature-product",
        description: `Hand-selected premium ${input.category} item crafted with the finest quality and care.`,
        price: 99900, // ₹999
        compareAtPrice: 149900,
        stock: 10,
        category: input.category,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 5.0,
        reviewCount: 1,
        colorSwatches: ["#111111", "#EDE6DC"],
        createdAt: now,
      },
      {
        id: `prod-${cleanSubdomain}-2`,
        storeId: newStoreId,
        title: "Bestseller Special Edition",
        slug: "bestseller-special-edition",
        description: "Our customer favorite choice with premium finishing and guaranteed satisfaction.",
        price: 149900, // ₹1,499
        compareAtPrice: 199900,
        stock: 15,
        category: input.category,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        ],
        status: "published",
        rating: 4.8,
        reviewCount: 3,
        colorSwatches: ["#222222", "#D4C7B5"],
        createdAt: now,
      },
    ];

    const newStore: StoreData = {
      id: newStoreId,
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail || input.contactEmail,
      name: input.name,
      subdomain: cleanSubdomain,
      status: "published",
      category: input.category,
      tagline: input.tagline || `Welcome to ${input.name}`,
      ownerName: input.ownerName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail,
      upiId: input.upiId,
      codEnabled: true,
      codFee: 0,
      freeDeliveryThreshold: 50000, // ₹500
      standardDeliveryFee: 5000, // ₹50
      planId: "free",
      activeThemeSlug: "classic-bloom",
      customBrandTheme: {
        primary: "#111111",
        background: "#FDFBF7",
        surface: "#FFFFFF",
      },
      fontFamily: "Outfit",
      announcementText: `Welcome to ${input.name}. Free shipping on orders above ₹500.`,
      isPaused: false,
      banners: [
        {
          id: `banner-${cleanSubdomain}-1`,
          storeId: newStoreId,
          title: `Welcome to ${input.name}`,
          subtitle: "Explore our collection designed with passion and precision.",
          imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
          ctaText: "Shop Catalog",
          ctaLink: "#products",
          position: 0,
          isActive: true,
        },
      ],
      categories: [
        {
          id: `cat-parent-${cleanSubdomain}-mens`,
          name: "Men's Collection",
          slug: "mens-collection",
          description: "Modern fits for everyday style.",
          subtitle: "Modern fits for everyday style.",
          ctaText: "Shop Denim & Jeans",
          imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
          isParent: true,
          isActive: true,
          position: 0,
          createdAt: now,
        },
        {
          id: `cat-parent-${cleanSubdomain}-womens`,
          name: "Women's Collection",
          slug: "womens-collection",
          description: "Trendy styles for every you.",
          subtitle: "Trendy styles for every you.",
          ctaText: "Shop Dresses & Tops",
          imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
          isParent: true,
          isActive: true,
          position: 1,
          createdAt: now,
        },
        {
          id: `cat-${cleanSubdomain}-1`,
          name: input.category,
          slug: input.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          parentId: `cat-parent-${cleanSubdomain}-mens`,
          description: `Signature collection of ${input.category}`,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
          isActive: true,
          position: 2,
          createdAt: now,
        },
      ],
      products: starterProducts,

      reviews: [],
      orders: [],
      customers: [],
      createdAt: now,
      updatedAt: now,
    };

    this.stores[cleanSubdomain] = newStore;
    this.persist();
    this.syncStoreToFirebase(cleanSubdomain);
    this.notify();
    return newStore;
  }

  public updateStore(subdomain: string, updates: Partial<StoreData>): StoreData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) {
      throw new Error(`Store "${subdomain}" not found.`);
    }

    const updated = {
      ...store,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.stores[store.subdomain] = updated;
    this.persist();
    this.syncStoreToFirebase(store.subdomain);
    this.notify();
    return updated;
  }

  public addProduct(
    subdomain: string,
    product: Omit<ProductData, "id" | "storeId" | "createdAt">
  ): { success: boolean; product?: ProductData; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    // Enforce Plan Limits
    const quota = canAddProduct(store.products.length, store.planId);
    if (!quota.allowed) {
      return {
        success: false,
        error: `Your current ${store.planId.toUpperCase()} plan limit is ${quota.limit} products. Upgrade your subscription to add more products.`,
      };
    }

    const now = new Date().toISOString();
    const newProduct: ProductData = {
      ...product,
      id: `prod-${store.subdomain}-${Date.now().toString(36)}`,
      storeId: store.id,
      createdAt: now,
    };

    store.products.unshift(newProduct);
    this.updateStore(store.subdomain, { products: store.products });
    return { success: true, product: newProduct };
  }

  public updateProduct(
    subdomain: string,
    productId: string,
    updates: Partial<ProductData>
  ): ProductData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const index = store.products.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error("Product not found.");

    const updated = { ...store.products[index], ...updates };
    store.products[index] = updated;
    this.updateStore(store.subdomain, { products: store.products });
    return updated;
  }

  public deleteProduct(subdomain: string, productId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return false;

    store.products = store.products.filter((p) => p.id !== productId);
    this.updateStore(store.subdomain, { products: store.products });
    return true;
  }

  public upgradeStorePlan(
    subdomain: string,
    planId: "free" | "starter" | "pro"
  ): StoreData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    return this.updateStore(store.subdomain, { planId });
  }

  public createSubscriptionPayment(
    subdomain: string,
    data: {
      planId: "starter" | "pro";
      billingCycle?: BillingCycle;
      paymentUtr?: string;
      referenceId?: string;
      payeeUpiId?: string;
    }
  ): SubscriptionRequest {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const plan = PLATFORM_PLANS[data.planId];
    if (!plan) throw new Error("Invalid plan selected.");

    const cycle: BillingCycle = data.billingCycle || "monthly";
    const pricing = calculatePlanPrice(data.planId, cycle);
    const amount = pricing.totalPaise;
    const refId = data.referenceId || `REF-SUB-${Math.floor(100000 + Math.random() * 900000)}`;

    const req: SubscriptionRequest = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceId: refId,
      storeSubdomain: store.subdomain,
      storeName: store.name,
      planId: data.planId,
      planName: plan.name,
      amount,
      amountFormatted: `₹${pricing.totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      billingCycle: cycle,
      status: "pending_verification",
      paymentMethod: "upi",
      payeeUpiId: data.payeeUpiId || siteConfig.platformUpiId,
      paymentUtr: data.paymentUtr?.trim() || undefined,
      createdAt: new Date().toISOString(),
      estimatedVerificationTime: "1-2 hours",
      note: `Subscription for ${plan.name} (${pricing.cycleLabel} · ${pricing.formattedTotal})`,
    };

    const history = store.subscriptionHistory || [];
    this.updateStore(store.subdomain, {
      pendingSubscription: req,
      subscriptionHistory: [req, ...history.filter((h) => h.id !== req.id)],
    });

    return req;
  }

  public verifySubscriptionPayment(
    subdomain: string,
    requestId?: string
  ): { success: boolean; store?: StoreData; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    const pending = store.pendingSubscription;
    if (!pending) return { success: false, error: "No pending subscription found for verification." };

    if (requestId && pending.id !== requestId) {
      return { success: false, error: "Subscription request ID does not match pending request." };
    }

    const verifiedReq: SubscriptionRequest = {
      ...pending,
      status: "verified",
      verifiedAt: new Date().toISOString(),
    };

    const updatedHistory = (store.subscriptionHistory || []).map((h) =>
      h.id === pending.id ? verifiedReq : h
    );

    const updated = this.updateStore(store.subdomain, {
      planId: pending.planId,
      pendingSubscription: null,
      subscriptionHistory: updatedHistory,
    });

    return { success: true, store: updated };
  }

  public cancelSubscriptionRequest(subdomain: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store || !store.pendingSubscription) return false;

    const cancelledReq: SubscriptionRequest = {
      ...store.pendingSubscription,
      status: "rejected",
      note: "Cancelled by seller",
    };

    const updatedHistory = (store.subscriptionHistory || []).map((h) =>
      h.id === store.pendingSubscription?.id ? cancelledReq : h
    );

    this.updateStore(store.subdomain, {
      pendingSubscription: null,
      subscriptionHistory: updatedHistory,
    });

    return true;
  }

  public setStoreTheme(
    subdomain: string,
    themeSlug: string
  ): { success: boolean; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    const theme = getTheme(themeSlug);
    if (!theme) return { success: false, error: "Invalid theme." };

    if (!isThemeAllowed(themeSlug, store.planId)) {
      return {
        success: false,
        error: `Theme "${theme.name}" requires the ${theme.tier.toUpperCase()} plan. Upgrade your subscription to unlock this theme.`,
      };
    }

    this.updateStore(store.subdomain, { activeThemeSlug: themeSlug });
    return { success: true };
  }

  public setStoreHomepageSections(
    subdomain: string,
    sections: string[],
    themeSlug?: string
  ): StoreData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const themeOrders = { ...(store.themeSectionOrders || {}) };
    if (themeSlug) {
      themeOrders[themeSlug] = sections;
    }

    return this.updateStore(store.subdomain, {
      homepageSections: sections,
      themeSectionOrders: themeOrders,
    });
  }

  public createOrder(
    subdomain: string,
    input: {
      customer: { name: string; phone: string; email?: string };
      address: { street: string; city: string; state: string; pincode: string };
      items: OrderItemData[];
      paymentMethod: "upi" | "cod" | "bank_transfer";
      paymentUtr?: string;
    }
  ): OrderData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const now = new Date().toISOString();
    const orderSeq = store.orders.length + 1001;
    const orderNumber = `#${orderSeq}`;
    const token = `tok_sh_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

    const subtotal = input.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const delivery = subtotal >= store.freeDeliveryThreshold ? 0 : store.standardDeliveryFee;
    const codFee = input.paymentMethod === "cod" ? store.codFee : 0;
    const total = subtotal + delivery + codFee;

    const newOrder: OrderData = {
      id: `ord-${store.subdomain}-${Date.now().toString(36)}`,
      storeId: store.id,
      number: orderNumber,
      token,
      customer: input.customer,
      address: input.address,
      items: input.items,
      subtotal,
      discount: 0,
      delivery,
      codFee,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus:
        input.paymentMethod === "upi"
          ? input.paymentUtr
            ? "awaiting_verification"
            : "awaiting_verification"
          : "cod_pending",
      paymentUtr: input.paymentUtr,
      fulfilmentStatus: "placed",
      createdAt: now,
      updatedAt: now,
    };

    store.orders.unshift(newOrder);

    let cust = store.customers.find((c) => c.phone === input.customer.phone);
    if (cust) {
      cust.totalOrders += 1;
      cust.totalSpent += total;
      cust.lastOrderAt = now;
    } else {
      store.customers.push({
        id: `cust-${Date.now().toString(36)}`,
        storeId: store.id,
        name: input.customer.name,
        phone: input.customer.phone,
        email: input.customer.email,
        totalOrders: 1,
        totalSpent: total,
        lastOrderAt: now,
      });
    }

    this.updateStore(store.subdomain, {
      orders: store.orders,
      customers: store.customers,
    });

    try {
      if (typeof window !== "undefined") {
        const cleanOrder = JSON.parse(
          JSON.stringify({
            ...newOrder,
            storeSubdomain: store.subdomain,
            storeId: store.id,
          })
        );
        setDoc(doc(db, "orders", newOrder.id), cleanOrder).catch((err) =>
          console.warn("[Firebase] Failed to write order doc:", err)
        );
      }
    } catch (err) {
      console.warn("[Firebase] Order doc write exception:", err);
    }

    return newOrder;
  }

  public updateOrderStatus(
    subdomain: string,
    orderId: string,
    updates: Partial<OrderData>
  ): OrderData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const index = store.orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error("Order not found.");

    const updated = {
      ...store.orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.orders[index] = updated;
    this.updateStore(store.subdomain, { orders: store.orders });
    return updated;
  }

  public addReview(
    subdomain: string,
    input: {
      productId: string;
      customerName: string;
      customerPhone?: string;
      rating: number;
      title?: string;
      comment: string;
    }
  ): ReviewData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const now = new Date().toISOString();
    const newReview: ReviewData = {
      id: `rev-${Date.now().toString(36)}`,
      storeId: store.id,
      productId: input.productId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      rating: Math.max(1, Math.min(5, input.rating)),
      title: input.title,
      comment: input.comment,
      verifiedPurchase: true,
      status: "approved",
      createdAt: now,
    };

    store.reviews.unshift(newReview);
    this.updateStore(store.subdomain, { reviews: store.reviews });
    return newReview;
  }

  public updateReviewStatus(
    subdomain: string,
    reviewId: string,
    status: "approved" | "pending" | "rejected"
  ): ReviewData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    const index = store.reviews.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error("Review not found.");

    store.reviews[index].status = status;
    this.updateStore(store.subdomain, { reviews: store.reviews });
    return store.reviews[index];
  }

  public deleteReview(subdomain: string, reviewId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return false;

    store.reviews = store.reviews.filter((r) => r.id !== reviewId);
    this.updateStore(store.subdomain, { reviews: store.reviews });
    return true;
  }

  public saveBanners(subdomain: string, banners: BannerData[]): BannerData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found.");

    this.updateStore(store.subdomain, { banners });
    return banners;
  }

  public buildDefaultCategoriesForStore(store: StoreData): CategoryData[] {
    if (store.subdomain === "lume") return [...DEFAULT_LUME_CATEGORIES];
    if (store.subdomain === "jaipurcrafts") return [...DEFAULT_JAIPUR_CATEGORIES];

    const unique = Array.from(new Set(store.products.map((p) => p.category).filter(Boolean)));
    if (unique.length === 0) {
      unique.push("All Collection", "Featured");
    }

    return unique.map((name, idx) => ({
      id: `cat-${store.subdomain}-${idx + 1}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${idx + 1}`,
      description: `Explore our handpicked ${name} selection.`,
      imageUrl:
        store.products.find((p) => p.category === name)?.images[0] ||
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      position: idx,
      createdAt: new Date().toISOString(),
    }));
  }

  public getCategories(subdomain: string): CategoryData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return [];

    if (!store.categories || store.categories.length === 0) {
      store.categories = this.buildDefaultCategoriesForStore(store);
      this.persist();
    }

    return store.categories
      .map((cat, idx) => {
        const count = store.products.filter(
          (p) =>
            p.category.toLowerCase() === cat.name.toLowerCase() ||
            p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") === cat.slug
        ).length;
        return {
          ...cat,
          position: cat.position ?? idx,
          itemCount: count,
        };
      })
      .sort((a, b) => a.position - b.position);
  }

  public getCategoryBySlug(subdomain: string, slug: string): CategoryData | null {
    const categories = this.getCategories(subdomain);
    const cleanSlug = slug.toLowerCase().trim();
    return (
      categories.find(
        (c) => c.slug === cleanSlug || c.name.toLowerCase() === cleanSlug
      ) || null
    );
  }

  public addCategory(
    subdomain: string,
    data: {
      name: string;
      slug?: string;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
      isParent?: boolean;
      parentId?: string;
      subtitle?: string;
      ctaText?: string;
    }
  ): { success: boolean; category?: CategoryData; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Category name is required." };
    }

    const trimmedName = data.name.trim();
    const generatedSlug = (data.slug?.trim() || trimmedName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!store.categories) {
      store.categories = this.buildDefaultCategoriesForStore(store);
    }

    const existing = store.categories.find(
      (c) => c.slug === generatedSlug || c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return { success: false, error: `Category "${trimmedName}" or slug "${generatedSlug}" already exists.` };
    }

    const now = new Date().toISOString();
    const newCategory: CategoryData = {
      id: data.isParent
        ? `cat-parent-${store.subdomain}-${Date.now().toString(36)}`
        : `cat-${store.subdomain}-${Date.now().toString(36)}`,
      name: trimmedName,
      slug: generatedSlug,
      description: data.description?.trim() || "",
      imageUrl:
        data.imageUrl?.trim() ||
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
      isActive: data.isActive !== false,
      position: store.categories.length,
      createdAt: now,
      isParent: Boolean(data.isParent),
      parentId: data.parentId || undefined,
      subtitle: data.subtitle?.trim() || undefined,
      ctaText: data.ctaText?.trim() || undefined,
    };

    store.categories.push(newCategory);
    this.updateStore(store.subdomain, { categories: store.categories });
    return { success: true, category: newCategory };
  }

  public updateCategory(
    subdomain: string,
    categoryId: string,
    updates: Partial<CategoryData>
  ): { success: boolean; error?: string; category?: CategoryData } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!store.categories) {
      store.categories = this.buildDefaultCategoriesForStore(store);
    }

    const index = store.categories.findIndex((c) => c.id === categoryId);
    if (index === -1) return { success: false, error: "Category not found." };

    const oldName = store.categories[index].name;
    const oldSlug = store.categories[index].slug;

    if (updates.slug && updates.slug !== oldSlug) {
      const collision = store.categories.find(
        (c) => c.id !== categoryId && c.slug === updates.slug
      );
      if (collision) {
        return { success: false, error: `Category slug "${updates.slug}" is already in use.` };
      }
    }

    const updatedCat: CategoryData = {
      ...store.categories[index],
      ...updates,
    };

    store.categories[index] = updatedCat;

    if (updates.name && updates.name !== oldName) {
      store.products.forEach((p) => {
        if (p.category.toLowerCase() === oldName.toLowerCase()) {
          p.category = updates.name!;
        }
      });
    }

    this.updateStore(store.subdomain, {
      categories: store.categories,
      products: store.products,
    });

    return { success: true, category: updatedCat };
  }

  public deleteCategory(subdomain: string, categoryId: string): { success: boolean; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!store.categories) {
      store.categories = this.buildDefaultCategoriesForStore(store);
    }

    const catToDelete = store.categories.find((c) => c.id === categoryId);
    if (!catToDelete) return { success: false, error: "Category not found." };

    store.categories = store.categories.filter((c) => c.id !== categoryId);
    this.updateStore(store.subdomain, { categories: store.categories });
    return { success: true };
  }

  public reorderCategories(subdomain: string, categoryIds: string[]): { success: boolean; error?: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, error: "Store not found." };

    if (!store.categories) return { success: false, error: "No categories to reorder." };

    const map = new Map(store.categories.map((c) => [c.id, c]));
    const reordered: CategoryData[] = [];

    categoryIds.forEach((id, idx) => {
      const item = map.get(id);
      if (item) {
        reordered.push({ ...item, position: idx });
        map.delete(id);
      }
    });

    map.forEach((item) => {
      reordered.push({ ...item, position: reordered.length });
    });

    store.categories = reordered;
    this.updateStore(store.subdomain, { categories: store.categories });
    return { success: true };
  }

  public addSubscriber(subdomain: string, email: string): { success: boolean; message: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, message: "Store not found" };

    if (!store.subscribers) store.subscribers = [];
    const normalized = email.trim().toLowerCase();
    if (store.subscribers.some((s) => s.email.toLowerCase() === normalized)) {
      return { success: true, message: "You are already subscribed to drop alerts!" };
    }

    store.subscribers.push({
      id: `sub-${Date.now().toString(36)}`,
      email: normalized,
      subscribedAt: new Date().toISOString(),
    });

    this.updateStore(store.subdomain, { subscribers: store.subscribers });

    try {
      if (typeof window !== "undefined") {
        const subId = `${store.subdomain}_${normalized.replace(/[^a-z0-9]/g, "_")}`;
        const cleanSub = JSON.parse(
          JSON.stringify({
            storeSubdomain: store.subdomain,
            storeId: store.id,
            email: normalized,
            subscribedAt: new Date().toISOString(),
          })
        );
        setDoc(doc(db, "subscribers", subId), cleanSub).catch((err) =>
          console.warn("[Firebase] Failed to write subscriber doc:", err)
        );
      }
    } catch (err) {
      console.warn("[Firebase] Subscriber doc write exception:", err);
    }

    return { success: true, message: "Subscribed! You'll receive drop notifications." };
  }

  public getSubscribers(subdomain: string): SubscriberData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    return store?.subscribers || [];
  }

  public updatePluginsConfig(subdomain: string, config: Partial<PluginsConfigData>): PluginsConfigData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found");

    const gmailConnected = config.gmailIntegration?.isConnected ?? config.gmail?.connected ?? store.pluginsConfig?.gmail?.connected ?? true;
    const gmailEmail = config.gmailIntegration?.connectedEmail ?? config.gmail?.email ?? store.pluginsConfig?.gmail?.email ?? store.contactEmail ?? "concierge@lume.store";
    const gmailAlerts = config.gmailIntegration?.autoSendNewDropAlerts ?? config.gmail?.autoDropAlerts ?? store.pluginsConfig?.gmail?.autoDropAlerts ?? true;

    const updated: PluginsConfigData = {
      gmail: {
        connected: gmailConnected,
        email: gmailEmail,
        autoDropAlerts: gmailAlerts,
        lastSyncAt: new Date().toISOString(),
      },
      gmailIntegration: {
        isConnected: gmailConnected,
        connectedEmail: gmailEmail,
        autoSendNewDropAlerts: gmailAlerts,
        lastCampaignSentAt: config.gmailIntegration?.lastCampaignSentAt || store.pluginsConfig?.gmailIntegration?.lastCampaignSentAt,
        campaignsSentCount: config.gmailIntegration?.campaignsSentCount ?? store.pluginsConfig?.gmailIntegration?.campaignsSentCount ?? 0,
      },
      whatsappBot: {
        connected: config.whatsappBot?.connected ?? store.pluginsConfig?.whatsappBot?.connected ?? false,
        phone: config.whatsappBot?.phone ?? store.pluginsConfig?.whatsappBot?.phone ?? store.contactPhone,
      },
      whatsappNotifications: {
        isConnected: config.whatsappNotifications?.isConnected ?? true,
      },
    };
    this.updateStore(store.subdomain, { pluginsConfig: updated });
    return updated;
  }

  public sendDropAnnouncement(
    subdomain: string,
    campaign: { subject: string; message: string; collectionName?: string }
  ): { success: boolean; sentCount: number; message: string } {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) return { success: false, sentCount: 0, message: "Store not found" };

    const subs = store.subscribers || [];
    const isConnected = store.pluginsConfig?.gmailIntegration?.isConnected ?? store.pluginsConfig?.gmail?.connected ?? true;
    const senderEmail = store.pluginsConfig?.gmailIntegration?.connectedEmail ?? store.pluginsConfig?.gmail?.email ?? "concierge@lume.store";

    if (!isConnected) {
      return {
        success: false,
        sentCount: 0,
        message: "Gmail is not connected. Connect your Gmail account first in Plugins.",
      };
    }

    const currentCount = store.pluginsConfig?.gmailIntegration?.campaignsSentCount || 0;
    const now = new Date().toISOString();

    const pluginsConfig: PluginsConfigData = {
      ...(store.pluginsConfig || {}),
      gmail: {
        connected: true,
        email: senderEmail,
        autoDropAlerts: true,
        lastSyncAt: now,
      },
      gmailIntegration: {
        isConnected: true,
        connectedEmail: senderEmail,
        autoSendNewDropAlerts: true,
        lastCampaignSentAt: now,
        campaignsSentCount: currentCount + 1,
      },
    };

    this.updateStore(store.subdomain, { pluginsConfig });

    return {
      success: true,
      sentCount: subs.length,
      message: `Successfully broadcasted to ${subs.length} subscriber(s) via ${senderEmail}.`,
    };
  }

  // --- Super Admin / Parent Platform Management Methods ---
  private platformBroadcasts: PlatformBroadcast[] = [];

  public deleteStore(subdomain: string): boolean {
    this.initClient();
    const cleanSub = subdomain.toLowerCase().trim();
    if (!this.stores[cleanSub]) return false;

    delete this.stores[cleanSub];
    this.persist();

    if (typeof window !== "undefined") {
      try {
        deleteDoc(doc(db, "stores", cleanSub)).catch((err) =>
          console.warn(`[Firebase] Failed to delete store ${cleanSub}:`, err)
        );
      } catch (e) {
        console.warn("[Firebase] Delete store doc error:", e);
      }
    }

    this.notify();
    return true;
  }

  public setStoreStatus(
    subdomain: string,
    status: "published" | "suspended" | "draft",
    pauseMessage?: string
  ): StoreData {
    return this.updateStore(subdomain, {
      status,
      isPaused: status === "suspended",
      pauseMessage:
        pauseMessage ||
        (status === "suspended" ? "This store has been temporarily paused by platform lead." : undefined),
    });
  }

  public setStorePlan(
    subdomain: string,
    planId: "free" | "starter" | "pro"
  ): StoreData {
    return this.updateStore(subdomain, { planId });
  }

  public getPlatformBroadcasts(): PlatformBroadcast[] {
    this.initClient();
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("shopper_platform_broadcasts");
        if (saved) {
          this.platformBroadcasts = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load platform broadcasts", e);
      }
    }
    return this.platformBroadcasts;
  }

  public sendPlatformBroadcast(input: {
    target: "all" | "free" | "starter" | "pro";
    subject: string;
    message: string;
    ctaText?: string;
    ctaLink?: string;
  }): { success: boolean; broadcast: PlatformBroadcast } {
    this.initClient();
    const all = this.getAllStores();
    const recipients =
      input.target === "all" ? all : all.filter((s) => s.planId === input.target);

    const now = new Date().toISOString();
    const newBroadcast: PlatformBroadcast = {
      id: `bc-${Date.now().toString(36)}`,
      target: input.target,
      subject: input.subject.trim(),
      message: input.message.trim(),
      ctaText: input.ctaText?.trim(),
      ctaLink: input.ctaLink?.trim(),
      sentAt: now,
      recipientCount: recipients.length,
    };

    this.platformBroadcasts.unshift(newBroadcast);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "shopper_platform_broadcasts",
          JSON.stringify(this.platformBroadcasts)
        );
        const clean = JSON.parse(JSON.stringify(newBroadcast));
        setDoc(doc(db, "platform_broadcasts", newBroadcast.id), clean).catch(console.warn);
      } catch (e) {
        console.warn("[Firebase] Broadcast save error", e);
      }
    }

    this.notify();
    return { success: true, broadcast: newBroadcast };
  }

  // --- Platform banners (admin uploads, shown on every seller dashboard) ---
  private platformBanners: PlatformBanner[] = [];
  private platformBannersLoaded = false;
  private platformBannersConnected = false;

  public getPlatformBanners(): PlatformBanner[] {
    this.initClient();
    if (typeof window !== "undefined") {
      if (!this.platformBannersLoaded) {
        this.platformBannersLoaded = true;
        try {
          const saved = localStorage.getItem("shopper_platform_banners");
          if (saved) this.platformBanners = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to load platform banners", e);
        }
      }
      this.connectPlatformBanners();
    }
    return this.platformBanners;
  }

  private connectPlatformBanners() {
    if (this.platformBannersConnected) return;
    this.platformBannersConnected = true;
    try {
      onSnapshot(
        collection(db, "platform_banners"),
        (snapshot) => {
          // an empty cloud collection never wipes banners saved locally before sync
          if (snapshot.empty) return;
          this.platformBanners = snapshot.docs
            .map((d) => d.data() as PlatformBanner)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          this.persistPlatformBanners();
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Banner listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Banner listener failed:", err);
    }
  }

  private persistPlatformBanners() {
    try {
      localStorage.setItem("shopper_platform_banners", JSON.stringify(this.platformBanners));
    } catch (e) {
      console.warn("Failed to save platform banners locally", e);
    }
  }

  public async addPlatformBanner(file: File, link?: string): Promise<PlatformBanner> {
    this.getPlatformBanners();
    const id = `pb-${Date.now().toString(36)}`;
    let imageUrl: string;
    let storagePath: string | undefined;

    ({ url: imageUrl, storagePath } = await hostPlatformImage(file, `platform_banners/${id}`));

    const banner: PlatformBanner = {
      id,
      imageUrl,
      link: link?.trim() || undefined,
      storagePath,
      createdAt: new Date().toISOString(),
    };
    this.platformBanners = [banner, ...this.platformBanners];
    this.persistPlatformBanners();
    setDoc(doc(db, "platform_banners", id), JSON.parse(JSON.stringify(banner))).catch((err) =>
      console.warn("[Firebase Firestore] Banner save error", err)
    );
    this.notify();
    return banner;
  }

  // --- Platform templates (ZIP uploads from the admin, offered to every seller once published) ---
  private platformTemplates: PlatformTemplate[] = [];
  private platformTemplatesLoaded = false;
  private platformTemplatesConnected = false;

  public getPlatformTemplates(): PlatformTemplate[] {
    this.initClient();
    if (typeof window !== "undefined") {
      this.loadPlatformTemplates();
      this.connectPlatformTemplates();
    }
    return this.platformTemplates;
  }

  private loadPlatformTemplates() {
    if (this.platformTemplatesLoaded) return;
    this.platformTemplatesLoaded = true;
    try {
      const saved = localStorage.getItem("shopper_platform_templates");
      if (saved) this.platformTemplates = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load platform templates", e);
    }
    this.syncTemplateRegistry();
  }

  private connectPlatformTemplates() {
    if (this.platformTemplatesConnected) return;
    this.platformTemplatesConnected = true;
    try {
      onSnapshot(
        collection(db, "platform_templates"),
        (snapshot) => {
          if (snapshot.empty) return;
          this.platformTemplates = snapshot.docs
            .map((d) => d.data() as PlatformTemplate)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          this.persistPlatformTemplates();
          this.notify();
        },
        (error) => console.warn("[Firebase Firestore] Template listener warning:", error)
      );
    } catch (err) {
      console.warn("[Firebase Firestore] Template listener failed:", err);
    }
  }

  /** Published templates become themes every page can resolve by slug. */
  private syncTemplateRegistry() {
    registerUploadedThemes(this.platformTemplates.filter((t) => t.status === "published").map((t) => t.theme));
  }

  private persistPlatformTemplates() {
    this.syncTemplateRegistry();
    try {
      localStorage.setItem("shopper_platform_templates", JSON.stringify(this.platformTemplates));
    } catch (e) {
      console.warn("Failed to save platform templates locally", e);
    }
  }

  private saveTemplateDoc(template: PlatformTemplate) {
    setDoc(doc(db, "platform_templates", template.id), JSON.parse(JSON.stringify(template))).catch((err) =>
      console.warn("[Firebase Firestore] Template save error", err)
    );
  }

  /** Hosts the template's images and saves it. Re-uploading a slug replaces that template. */
  public async addPlatformTemplate(parsed: ParsedTemplate, fileName: string, publish: boolean): Promise<PlatformTemplate> {
    this.getPlatformTemplates();
    const slug = parsed.manifest.slug;
    const images: { preview?: string; hero?: string; gallery: string[] } = {
      preview: parsed.links.preview,
      hero: parsed.links.hero,
      gallery: [...parsed.links.gallery],
    };
    const storagePaths: string[] = [];
    for (const role of ["preview", "hero"] as const) {
      const file = parsed.files[role];
      if (!file) continue;
      const hosted = await hostPlatformImage(file, `platform_templates/${slug}-${role}`, role === "hero" ? 1800 : 1000);
      images[role] = hosted.url;
      if (hosted.storagePath) storagePaths.push(hosted.storagePath);
    }
    for (const [i, file] of parsed.files.gallery.entries()) {
      const hosted = await hostPlatformImage(file, `platform_templates/${slug}-gallery-${i}`, 1400);
      images.gallery.push(hosted.url);
      if (hosted.storagePath) storagePaths.push(hosted.storagePath);
    }

    const now = new Date().toISOString();
    const previous = this.platformTemplates.find((t) => t.id === slug);
    const template: PlatformTemplate = {
      id: slug,
      status: publish ? "published" : "draft",
      theme: manifestToTheme(parsed.manifest, images),
      fileName,
      storagePaths,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    this.platformTemplates = [template, ...this.platformTemplates.filter((t) => t.id !== slug)];
    this.persistPlatformTemplates();
    this.saveTemplateDoc(template);
    this.notify();
    return template;
  }

  public setPlatformTemplateStatus(id: string, status: PlatformTemplate["status"]) {
    this.getPlatformTemplates();
    const current = this.platformTemplates.find((t) => t.id === id);
    if (!current) return;
    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    this.platformTemplates = this.platformTemplates.map((t) => (t.id === id ? updated : t));
    this.persistPlatformTemplates();
    this.saveTemplateDoc(updated);
    this.notify();
  }

  /** Deletes a template. Stores using it fall back to the default template. */
  public deletePlatformTemplate(id: string) {
    this.getPlatformTemplates();
    const template = this.platformTemplates.find((t) => t.id === id);
    this.platformTemplates = this.platformTemplates.filter((t) => t.id !== id);
    this.persistPlatformTemplates();
    deleteDoc(doc(db, "platform_templates", id)).catch((err) => console.warn("[Firebase Firestore] Template delete error", err));
    template?.storagePaths?.forEach((path) =>
      deleteObject(storageRef(storage, path)).catch((err) => console.warn("[Firebase Storage] Template image delete error", err))
    );
    this.notify();
  }

  /** How many stores currently use a template. */
  public countStoresUsingTheme(slug: string): number {
    return this.getAllStores().filter((st) => st.activeThemeSlug === slug).length;
  }

  public updatePlatformBannerLink(id: string, link: string) {
    this.getPlatformBanners();
    this.platformBanners = this.platformBanners.map((b) => (b.id === id ? { ...b, link: link.trim() || undefined } : b));
    this.persistPlatformBanners();
    const updated = this.platformBanners.find((b) => b.id === id);
    if (updated) {
      setDoc(doc(db, "platform_banners", id), JSON.parse(JSON.stringify(updated))).catch((err) =>
        console.warn("[Firebase Firestore] Banner update error", err)
      );
    }
    this.notify();
  }

  public deletePlatformBanner(id: string) {
    this.getPlatformBanners();
    const banner = this.platformBanners.find((b) => b.id === id);
    this.platformBanners = this.platformBanners.filter((b) => b.id !== id);
    this.persistPlatformBanners();
    deleteDoc(doc(db, "platform_banners", id)).catch((err) => console.warn("[Firebase Firestore] Banner delete error", err));
    if (banner?.storagePath) {
      deleteObject(storageRef(storage, banner.storagePath)).catch((err) =>
        console.warn("[Firebase Storage] Banner image delete error", err)
      );
    }
    this.notify();
  }

  public getPlatformStats() {
    this.initClient();
    const stores = this.getAllStores();
    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.status === "published").length;
    const suspendedStores = stores.filter((s) => s.status === "suspended").length;

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProducts = 0;
    const customerPhoneSet = new Set<string>();
    let totalSubscribers = 0;

    let freeStores = 0;
    let starterStores = 0;
    let proStores = 0;

    stores.forEach((s) => {
      totalProducts += s.products?.length || 0;
      totalOrders += s.orders?.length || 0;
      (s.orders || []).forEach((o) => {
        totalRevenue += o.total || 0;
      });
      (s.customers || []).forEach((c) => {
        if (c.phone) customerPhoneSet.add(c.phone);
      });
      totalSubscribers += s.subscribers?.length || 0;

      if (s.planId === "pro") proStores++;
      else if (s.planId === "starter") starterStores++;
      else freeStores++;
    });

    const mrr = starterStores * (PLATFORM_PLANS.starter.priceMonthly / 100) + proStores * (PLATFORM_PLANS.pro.priceMonthly / 100);

    return {
      totalStores,
      activeStores,
      suspendedStores,
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers: customerPhoneSet.size,
      totalSubscribers,
      freeStores,
      starterStores,
      proStores,
      mrr,
    };
  }

  public getStoreDiscounts(subdomain: string): DiscountData[] {
    this.initClient();
    const store = this.getStore(subdomain);
    return store?.discounts || [];
  }

  public addDiscount(
    subdomain: string,
    discountInput: Omit<DiscountData, "id" | "timesUsed" | "createdAt">
  ): DiscountData {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store) throw new Error("Store not found");

    if (!store.discounts) store.discounts = [];
    const newDiscount: DiscountData = {
      ...discountInput,
      id: `disc-${Date.now().toString(36)}`,
      code: discountInput.code.trim().toUpperCase(),
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    };

    store.discounts.unshift(newDiscount);
    this.updateStore(subdomain, { discounts: store.discounts });
    return newDiscount;
  }

  public toggleDiscount(subdomain: string, discountId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store || !store.discounts) return false;

    const discount = store.discounts.find((d) => d.id === discountId);
    if (!discount) return false;

    discount.isActive = !discount.isActive;
    this.updateStore(subdomain, { discounts: store.discounts });
    return true;
  }

  public deleteDiscount(subdomain: string, discountId: string): boolean {
    this.initClient();
    const store = this.getStore(subdomain);
    if (!store || !store.discounts) return false;

    store.discounts = store.discounts.filter((d) => d.id !== discountId);
    this.updateStore(subdomain, { discounts: store.discounts });
    return true;
  }
}


export const storeService = new StoreService();

// Shrinks an image to `maxWidth` and re-encodes it as JPEG, for when cloud upload isn't available
function compressImageToDataUrl(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Uploads an admin image to Firebase Storage, or keeps a compressed copy if that isn't available. */
async function hostPlatformImage(file: File, pathBase: string, maxWidth = 1600): Promise<{ url: string; storagePath?: string }> {
  try {
    // give up after 20s so the admin isn't left waiting
    const path = `${pathBase}-${Date.now().toString(36)}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const uploaded = await Promise.race([
      uploadBytes(storageRef(storage, path), file, { contentType: file.type }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("upload timed out")), 20000)),
    ]);
    return { url: await getDownloadURL(uploaded.ref), storagePath: path };
  } catch (err) {
    console.warn("[Firebase Storage] Upload failed, storing a compressed copy instead:", err);
    return { url: await compressImageToDataUrl(file, maxWidth, 0.82) };
  }
}
