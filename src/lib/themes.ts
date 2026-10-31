export type LayoutType =
  | "editorial"
  | "lookbook-minimal"
  | "magazine-bold"
  | "sidebar-storefront"
  | "bento-tech"
  | "botanical-wellness"
  | "showroom-split"
  | "catalogue-rows"
  | "market-deals"
  | "gallery-masonry";

/** Layouts an uploaded template can choose, with a line describing each (shown in the admin). */
export const TEMPLATE_LAYOUTS: Record<LayoutType, string> = {
  editorial: "Classic editorial home with banner carousel, story categories and product grid",
  "lookbook-minimal": "Full-bleed lookbook hero with a calm, airy product grid",
  "magazine-bold": "Bold magazine split hero with bracketed category tags",
  "sidebar-storefront": "Directory-style store with a filter sidebar",
  "bento-tech": "Dark bento tiles for gadgets and tech",
  "botanical-wellness": "Soft, rounded wellness layout",
  "showroom-split": "Split hero, scrolling category ticker and a product shelf per collection",
  "catalogue-rows": "Editorial catalogue: one large product row at a time, alternating sides",
  "market-deals": "Busy marketplace: deal strip, bento promos, sticky filters and a dense grid",
  "gallery-masonry": "Image-first masonry gallery with hover details",
};

export interface ThemeDefinition {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  tier: "free" | "starter" | "pro";
  category?: string;
  previewImage?: string;
  layoutType?: LayoutType;
  /** Large image used by layouts that open with a hero (uploaded templates) */
  heroImage?: string;
  /** Extra imagery the layout uses for collages, promo tiles and interludes (uploaded templates) */
  galleryImages?: string[];
  /** "uploaded" for templates published from the admin dashboard */
  source?: "builtin" | "uploaded";
  description: string;
  previewColors: string[];
  tokens: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    radius: string;
    fontFamily?: string;
  };
  styleAttributes?: Record<string, string>;
}

export const PLATFORM_THEMES: Record<string, ThemeDefinition> = {
  "classic-bloom": {
    id: "theme-1",
    slug: "classic-bloom",
    name: "Lume Editorial",
    tagline: "Minimalist, editorial & universal",
    tier: "free",
    category: "Fashion & Lifestyle",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    description: "Deep obsidian charcoal, neutral bone & subtle terracotta accents. Clean lines, generous whitespace, and versatile aesthetics suitable for fashion, apparel, and lifestyle.",
    previewColors: ["#111111", "#E04E39", "#F5F5F5", "#FFFFFF"],
    tokens: {
      background: "#FFFFFF",
      foreground: "#111111",
      card: "#FFFFFF",
      cardForeground: "#111111",
      primary: "#111111",
      primaryForeground: "#FFFFFF",
      accent: "#E04E39",
      accentForeground: "#FFFFFF",
      muted: "#F5F5F5",
      mutedForeground: "#666666",
      border: "#E5E5E5",
      radius: "8px",
      fontFamily: "Outfit",
    },
  },

  /* 5 WHOLE NEW LAYOUT THEMES */
  "lookbook-minimal": {
    id: "theme-9",
    slug: "lookbook-minimal",
    name: "Tokyo Lookbook",
    tagline: "Cinematic lookbook & borderless cards",
    tier: "pro",
    category: "Fashion & Lookbook",
    layoutType: "lookbook-minimal",
    previewImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    description: "New Lookbook Layout: Full-bleed cinematic hero, floating pill navigation, seamless borderless product cards with subtle zoom, and high-fashion editorial whitespace.",
    previewColors: ["#171717", "#D4AF37", "#FAFAF9", "#F5F5F4"],
    tokens: {
      background: "#FAFAF9",
      foreground: "#171717",
      card: "#FFFFFF",
      cardForeground: "#171717",
      primary: "#171717",
      primaryForeground: "#FFFFFF",
      accent: "#D4AF37",
      accentForeground: "#171717",
      muted: "#F5F5F4",
      mutedForeground: "#737373",
      border: "#E7E5E4",
      radius: "4px",
      fontFamily: "Outfit",
    },
  },

  "magazine-bold": {
    id: "theme-10",
    slug: "magazine-bold",
    name: "Berlin Split Magazine",
    tagline: "Split-screen hero & editorial manifesto",
    tier: "pro",
    category: "Streetwear Drops",
    layoutType: "magazine-bold",
    previewImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    description: "New Magazine Layout: Bold split-screen hero pairing a giant typography manifesto with portrait editorial imagery, drop tickers, and punchy contrast card borders.",
    previewColors: ["#000000", "#FF4400", "#FFFFFF", "#E5E5E5"],
    tokens: {
      background: "#FFFFFF",
      foreground: "#000000",
      card: "#F8F8F8",
      cardForeground: "#000000",
      primary: "#000000",
      primaryForeground: "#FFFFFF",
      accent: "#FF4400",
      accentForeground: "#FFFFFF",
      muted: "#EFEFEF",
      mutedForeground: "#555555",
      border: "#000000",
      radius: "0px",
      fontFamily: "Space Grotesk",
    },
  },

  "bento-tech": {
    id: "theme-11",
    slug: "bento-tech",
    name: "Neo Bento Glass",
    tagline: "Bento-box grid & frosted glass cards",
    tier: "starter",
    category: "Electronics & Tech",
    layoutType: "bento-tech",
    previewImage: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    description: "New Bento Layout: Modular bento-box grid with frosted glass containers, glowing cyan border accents, and high-tech product tiles tailored for gadgets and smart gear.",
    previewColors: ["#090D16", "#06B6D4", "#6366F1", "#151C2C"],
    tokens: {
      background: "#090D16",
      foreground: "#F8FAFC",
      card: "#111827",
      cardForeground: "#F8FAFC",
      primary: "#06B6D4",
      primaryForeground: "#090D16",
      accent: "#6366F1",
      accentForeground: "#FFFFFF",
      muted: "#1E293B",
      mutedForeground: "#94A3B8",
      border: "#1E293B",
      radius: "16px",
      fontFamily: "Inter",
    },
  },

  "sidebar-storefront": {
    id: "theme-12",
    slug: "sidebar-storefront",
    name: "Atelier Sidebar Directory",
    tagline: "Persistent sidebar navigation & app-like catalog",
    tier: "pro",
    category: "Curated Boutique",
    layoutType: "sidebar-storefront",
    previewImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80",
    description: "New Sidebar Layout: Modern desktop 2-column layout with a persistent left navigation filter drawer and wide scrolling catalog, giving an elite luxury boutique experience.",
    previewColors: ["#18181B", "#4F46E5", "#FFFFFF", "#F4F4F5"],
    tokens: {
      background: "#F9F9FB",
      foreground: "#18181B",
      card: "#FFFFFF",
      cardForeground: "#18181B",
      primary: "#18181B",
      primaryForeground: "#FFFFFF",
      accent: "#4F46E5",
      accentForeground: "#FFFFFF",
      muted: "#F4F4F5",
      mutedForeground: "#71717A",
      border: "#E4E4E7",
      radius: "10px",
      fontFamily: "Plus Jakarta Sans",
    },
  },

  "botanical-wellness": {
    id: "theme-13",
    slug: "botanical-wellness",
    name: "Kyoto Botanical & Tea",
    tagline: "Organic curves & storytelling catalog",
    tier: "starter",
    category: "Wellness & Organic",
    layoutType: "botanical-wellness",
    previewImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    description: "New Botanical Layout: Organic rounded shapes, chamomile cream backdrop, storytelling ingredient highlights, and soothing sage tones for wellness, teas, and organic skincare.",
    previewColors: ["#2D3B36", "#5B756C", "#F7F5F0", "#EBE7DF"],
    tokens: {
      background: "#F7F5F0",
      foreground: "#2D3B36",
      card: "#FFFFFF",
      cardForeground: "#2D3B36",
      primary: "#2D3B36",
      primaryForeground: "#FFFFFF",
      accent: "#5B756C",
      accentForeground: "#FFFFFF",
      muted: "#EBE7DF",
      mutedForeground: "#687D75",
      border: "#E0DACF",
      radius: "24px",
      fontFamily: "DM Sans",
    },
  },
};

import { getFontFamily } from "./fonts";

// Templates uploaded and published from the admin dashboard, kept in sync by the store service
let uploadedThemes: Record<string, ThemeDefinition> = {};

export function registerUploadedThemes(themes: ThemeDefinition[]) {
  uploadedThemes = {};
  themes.forEach((t) => {
    if (!PLATFORM_THEMES[t.slug]) uploadedThemes[t.slug] = { ...t, source: "uploaded" };
  });
}

export function getUploadedTheme(slug: string): ThemeDefinition | undefined {
  return uploadedThemes[slug];
}

/** Built-in themes followed by published uploaded templates. */
export function getAllThemes(): ThemeDefinition[] {
  return [...Object.values(PLATFORM_THEMES), ...Object.values(uploadedThemes)];
}

export function getTheme(slug?: string): ThemeDefinition {
  if (slug && PLATFORM_THEMES[slug]) {
    return PLATFORM_THEMES[slug];
  }
  if (slug && uploadedThemes[slug]) {
    return uploadedThemes[slug];
  }
  return PLATFORM_THEMES["classic-bloom"];
}

export function generateThemeCssVariables(
  theme: ThemeDefinition,
  customBrandTheme?: { primary: string; background: string; surface: string },
  fontFamilyNameOrId?: string,
  ignoreCustomBrand?: boolean
): Record<string, string> {
  const useBrand = !ignoreCustomBrand ? customBrandTheme : undefined;
  const primary = useBrand?.primary || theme.tokens.primary;
  const background = useBrand?.background || theme.tokens.background;
  const surface = useBrand?.surface || theme.tokens.card;
  const foreground = useBrand?.primary ? (theme.tokens.foreground || useBrand.primary) : theme.tokens.foreground;
  const activeFontFamily = getFontFamily(fontFamilyNameOrId || theme.tokens.fontFamily);

  return {
    "--background": background,
    "--foreground": foreground,
    "--card": surface,
    "--card-foreground": theme.tokens.cardForeground || foreground,
    "--primary": primary,
    "--primary-foreground": theme.tokens.primaryForeground || "#FFFFFF",
    "--accent": theme.tokens.accent,
    "--accent-foreground": theme.tokens.accentForeground,
    "--muted": theme.tokens.muted || (background === "#FFFFFF" ? "#F5F5F5" : background),
    "--muted-foreground": theme.tokens.mutedForeground || "#666666",
    "--border": theme.tokens.border || "#E5E5E5",
    "--radius-md": theme.tokens.radius,
    "--font-store": activeFontFamily,
  };
}
