export interface ThemeDefinition {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  tier: "free" | "starter" | "pro";
  category?: string;
  previewImage?: string;
  layoutType?: "editorial" | "lookbook-minimal" | "magazine-bold" | "sidebar-storefront" | "bento-tech" | "botanical-wellness";
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

  "aura-beauty": {
    id: "theme-2",
    slug: "aura-beauty",
    name: "Aura Glow & Skincare",
    tagline: "Soft pastel warmth & organic luxury",
    tier: "starter",
    category: "Beauty & Cosmetics",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    description: "Gentle rose champagne tones, rounded pill containers, and soothing warmth tailored for skincare serums, clean cosmetics, beauty regimens, and self-care.",
    previewColors: ["#9E4A3B", "#D97706", "#FFFBF8", "#F7EFE9"],
    tokens: {
      background: "#FFFBF8",
      foreground: "#2D201D",
      card: "#FFFFFF",
      cardForeground: "#2D201D",
      primary: "#9E4A3B",
      primaryForeground: "#FFFFFF",
      accent: "#D97706",
      accentForeground: "#FFFFFF",
      muted: "#F7EFE9",
      mutedForeground: "#78716C",
      border: "#F0E3D8",
      radius: "16px",
      fontFamily: "Plus Jakarta Sans",
    },
  },

  "cyber-tech": {
    id: "theme-3",
    slug: "cyber-tech",
    name: "Cyber Tech & Audio",
    tagline: "Electric cyan & dark slate high-tech",
    tier: "starter",
    category: "Electronics & Tech",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Engineered for consumer electronics, wireless audio, mechanical keyboards, gaming gear, and mobile tech. High-contrast deep slate with electric neon accents.",
    previewColors: ["#0B0F19", "#38BDF8", "#818CF8", "#111827"],
    tokens: {
      background: "#0B0F19",
      foreground: "#F1F5F9",
      card: "#111827",
      cardForeground: "#F1F5F9",
      primary: "#38BDF8",
      primaryForeground: "#0B0F19",
      accent: "#818CF8",
      accentForeground: "#FFFFFF",
      muted: "#1F2937",
      mutedForeground: "#94A3B8",
      border: "#1F2937",
      radius: "10px",
      fontFamily: "Inter",
    },
  },

  "vibrant-bazaar": {
    id: "theme-4",
    slug: "vibrant-bazaar",
    name: "Modern Emerald",
    tagline: "Rich forest & amber warmth",
    tier: "starter",
    category: "Gourmet & Organics",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    description: "Deep forest emerald with warm amber highlights. High contrast and refined balance for specialty coffee, organic groceries, teas, and gourmet foods.",
    previewColors: ["#0F2E23", "#D97706", "#F9F8F6", "#1C1917"],
    tokens: {
      background: "#FFFFFF",
      foreground: "#1C1917",
      card: "#FFFFFF",
      cardForeground: "#1C1917",
      primary: "#0F2E23",
      primaryForeground: "#FFFFFF",
      accent: "#D97706",
      accentForeground: "#FFFFFF",
      muted: "#F4F1EA",
      mutedForeground: "#78716C",
      border: "#E7E2D7",
      radius: "8px",
      fontFamily: "Playfair Display",
    },
  },

  "pastel-luxe": {
    id: "theme-5",
    slug: "pastel-luxe",
    name: "Nordic Atelier",
    tagline: "Soft taupe & understated elegance",
    tier: "starter",
    category: "Home & Ceramics",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
    description: "Muted taupe, warm stone, and refined slate accents. Clean architectural styling for interior living, handmade ceramics, artisanal furniture, and home decor.",
    previewColors: ["#292524", "#78716C", "#F5F3EF", "#1C1917"],
    tokens: {
      background: "#FFFFFF",
      foreground: "#1C1917",
      card: "#FFFFFF",
      cardForeground: "#1C1917",
      primary: "#292524",
      primaryForeground: "#FFFFFF",
      accent: "#C2410C",
      accentForeground: "#FFFFFF",
      muted: "#F5F3EF",
      mutedForeground: "#78716C",
      border: "#E7E5E4",
      radius: "12px",
      fontFamily: "Outfit",
    },
  },

  "midnight-noir": {
    id: "theme-6",
    slug: "midnight-noir",
    name: "Midnight Obsidian",
    tagline: "High-end luxury dark mode",
    tier: "pro",
    category: "Jewelry & Luxury",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    description: "Pure velvet obsidian black with champagne gold and silver precision. Designed for fine jewelry, luxury watches, couture designer wear, and premium fragrances.",
    previewColors: ["#09090B", "#F59E0B", "#141417", "#FAFAFA"],
    tokens: {
      background: "#09090B",
      foreground: "#FAFAFA",
      card: "#141417",
      cardForeground: "#FAFAFA",
      primary: "#F59E0B",
      primaryForeground: "#000000",
      accent: "#D97706",
      accentForeground: "#FFFFFF",
      muted: "#27272A",
      mutedForeground: "#A1A1AA",
      border: "#27272A",
      radius: "10px",
      fontFamily: "Cinzel",
    },
  },

  "street-heat": {
    id: "theme-7",
    slug: "street-heat",
    name: "Sole & Street Heat",
    tagline: "High-octane urban drops & sneakers",
    tier: "pro",
    category: "Sneakers & Streetwear",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    description: "Built for streetwear labels, limited sneaker drops, oversized graphic tees, and hype accessories. Intense contrast, edgy card borders, and vibrant punchy accents.",
    previewColors: ["#121214", "#FF334B", "#FBBF24", "#FFFFFF"],
    tokens: {
      background: "#121214",
      foreground: "#FFFFFF",
      card: "#1C1C20",
      cardForeground: "#FFFFFF",
      primary: "#FF334B",
      primaryForeground: "#FFFFFF",
      accent: "#FBBF24",
      accentForeground: "#FFFFFF",
      muted: "#282830",
      mutedForeground: "#A1A1AA",
      border: "#2E2E38",
      radius: "6px",
      fontFamily: "Space Grotesk",
    },
  },

  "artisan-craft": {
    id: "theme-8",
    slug: "artisan-craft",
    name: "Earthy Terracotta",
    tagline: "Raw clay & sand botanicals",
    tier: "pro",
    category: "Handcrafted & Art",
    layoutType: "editorial",
    previewImage: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
    description: "Terracotta clay, warm sand, and raw linen neutrals. Designed for artisanal crafts, handmade leather, pottery studios, organic woven bags, and independent artisans.",
    previewColors: ["#9A3412", "#57534E", "#FAF8F5", "#292524"],
    tokens: {
      background: "#FAF7F2",
      foreground: "#292524",
      card: "#FFFFFF",
      cardForeground: "#292524",
      primary: "#9A3412",
      primaryForeground: "#FFFFFF",
      accent: "#65A30D",
      accentForeground: "#FFFFFF",
      muted: "#F5EFE6",
      mutedForeground: "#78716C",
      border: "#E8DDD0",
      radius: "10px",
      fontFamily: "Cormorant Garamond",
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

export function getTheme(slug?: string): ThemeDefinition {
  if (slug && PLATFORM_THEMES[slug]) {
    return PLATFORM_THEMES[slug];
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
