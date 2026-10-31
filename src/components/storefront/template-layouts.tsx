"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import type { ProductData, StoreData } from "@/lib/store-service";
import type { LayoutType, ThemeDefinition } from "@/lib/themes";

/**
 * Layouts drawn entirely by this file: each has its own header, home page, product cards and
 * footer, and leans on the template's own imagery (the older layouts live in the storefront page).
 */
export const TEMPLATE_HOME_LAYOUTS: LayoutType[] = ["showroom-split", "catalogue-rows", "market-deals", "gallery-masonry"];

type Category = { name: string; slug: string; image: string };

export interface TemplateHomeProps {
  layout: LayoutType;
  store: StoreData;
  theme: ThemeDefinition;
  products: ProductData[];
  categories: Category[];
  /** used when the template ships no hero image of its own */
  fallbackImage: string;
  subdomain: string;
  onAddToCart: (product: ProductData, e?: React.MouseEvent) => void;
}

export interface TemplateChromeProps {
  layout: LayoutType;
  store: StoreData;
  categories: Category[];
  subdomain: string;
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const productHref = (subdomain: string, p: ProductData) => `/s/${subdomain}/products/${p.slug}`;
const categoryHref = (subdomain: string, slug: string) => `/s/${subdomain}/category/${slug}`;
const inCategory = (p: ProductData, name: string) => p.category.toLowerCase() === name.toLowerCase();
const waLink = (phone?: string) => (phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : "");

// theme tokens arrive as CSS variables on the storefront wrapper
const v = {
  bg: "var(--background)",
  fg: "var(--foreground)",
  card: "var(--card)",
  primary: "var(--primary)",
  onPrimary: "var(--primary-foreground)",
  accent: "var(--accent)",
  onAccent: "var(--accent-foreground)",
  muted: "var(--muted)",
  mutedFg: "var(--muted-foreground)",
  border: "var(--border)",
  radius: "var(--radius-md)",
};

/** Template imagery first, then whatever the store has. */
function useImagery(theme: ThemeDefinition, fallback: string, products: ProductData[]) {
  return useMemo(() => {
    const extra = products.map((p) => p.images[0]).filter(Boolean);
    const gallery = [...(theme.galleryImages || []), ...extra];
    return { hero: theme.heroImage || fallback, gallery: gallery.length ? gallery : [fallback] };
  }, [theme, fallback, products]);
}

function Logo({ store, className = "", style }: { store: StoreData; className?: string; style?: React.CSSProperties }) {
  return store.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={store.logoUrl} alt={store.name} className="h-9 w-auto object-contain" />
  ) : (
    <span className={className} style={style}>
      {store.name}
    </span>
  );
}

/* ================================================================== */
/* Headers                                                             */
/* ================================================================== */

export function TemplateHeader(props: TemplateChromeProps) {
  const { layout, store, categories, subdomain, cartCount, onOpenCart, searchQuery, onSearchChange } = props;
  const home = `/s/${subdomain}`;

  if (layout === "showroom-split") {
    return (
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: v.border, background: "color-mix(in srgb, var(--background) 90%, transparent)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {categories.slice(0, 3).map((c) => (
              <Link key={c.slug} href={categoryHref(subdomain, c.slug)} className="hover:opacity-60 transition-opacity" style={{ color: v.fg }}>
                {c.name}
              </Link>
            ))}
          </nav>
          <span className="md:hidden" />
          <Link href={home} className="justify-self-center">
            <Logo store={store} className="text-2xl font-semibold tracking-tight" style={{ color: v.fg }} />
          </Link>
          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Open bag"
            className="justify-self-end relative w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: v.primary, color: v.onPrimary }}
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: v.accent, color: v.onAccent }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  if (layout === "catalogue-rows") {
    return (
      <header className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em]" style={{ color: v.mutedFg }}>
          <span>Catalogue No. {String(new Date().getMonth() + 1).padStart(2, "0")}</span>
          <button type="button" onClick={onOpenCart} className="uppercase tracking-[0.24em] hover:opacity-60" style={{ color: v.fg }}>
            Bag ({cartCount})
          </button>
        </div>
        <Link href={home} className="block text-center py-5">
          <Logo store={store} className="text-4xl sm:text-5xl font-semibold tracking-tight" style={{ color: v.fg }} />
        </Link>
        <div className="border-t-2 border-b" style={{ borderColor: v.fg, height: 5 }} />
      </header>
    );
  }

  if (layout === "market-deals") {
    return (
      <header className="sticky top-0 z-40 shadow-sm" style={{ background: v.bg }}>
        {store.announcementText && (
          <div className="text-center text-xs font-semibold py-1.5 px-4 truncate" style={{ background: v.primary, color: v.onPrimary }}>
            {store.announcementText}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
          <Link href={home} className="shrink-0">
            <Logo store={store} className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: v.primary }} />
          </Link>
          <label className="flex-1 flex items-center gap-2 h-11 px-4 border" style={{ borderColor: v.border, background: v.muted, borderRadius: 999 }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: v.mutedFg }} />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search ${store.name}`}
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: v.fg }}
            />
          </label>
          <button
            type="button"
            onClick={onOpenCart}
            className="shrink-0 relative h-11 px-4 inline-flex items-center gap-2 text-sm font-bold"
            style={{ background: v.accent, color: v.onAccent, borderRadius: v.radius }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            <span className="min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center" style={{ background: v.fg, color: v.bg }}>
              {cartCount}
            </span>
          </button>
        </div>
      </header>
    );
  }

  // gallery-masonry
  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: v.border, background: "color-mix(in srgb, var(--background) 82%, transparent)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={home}>
          <Logo store={store} className="text-sm font-semibold uppercase tracking-[0.35em]" style={{ color: v.fg }} />
        </Link>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.25em]" style={{ color: v.mutedFg }}>
          <Link href={categoryHref(subdomain, "all")} className="hover:opacity-70">
            Index
          </Link>
          <button type="button" onClick={onOpenCart} className="uppercase tracking-[0.25em] hover:opacity-70" style={{ color: v.accent }}>
            Bag · {cartCount}
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ================================================================== */
/* Footers                                                             */
/* ================================================================== */

export function TemplateFooter({ layout, store, categories, subdomain }: Pick<TemplateChromeProps, "layout" | "store" | "categories" | "subdomain">) {
  const year = new Date().getFullYear();
  const insta = store.instagramHandle ? `https://instagram.com/${store.instagramHandle.replace(/^@/, "")}` : "";
  const contact = [
    store.contactPhone && { icon: Phone, label: store.contactPhone, href: `tel:${store.contactPhone}` },
    store.contactPhone && { icon: MessageCircle, label: "WhatsApp us", href: waLink(store.contactPhone) },
    store.contactEmail && { icon: Mail, label: store.contactEmail, href: `mailto:${store.contactEmail}` },
    insta && { icon: AtSign, label: `@${store.instagramHandle!.replace(/^@/, "")}`, href: insta },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string }[];

  if (layout === "showroom-split") {
    return (
      <footer className="mt-10" style={{ background: v.muted, color: v.fg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <span className="block text-4xl sm:text-5xl font-semibold tracking-tight">{store.name}</span>
            <p className="mt-3 max-w-sm text-sm" style={{ color: v.mutedFg }}>
              {store.tagline}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: v.mutedFg }}>
              Shop
            </span>
            <ul className="mt-4 space-y-2 text-sm">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(subdomain, c.slug)} className="hover:opacity-60">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: v.mutedFg }}>
              Contact
            </span>
            <ul className="mt-4 space-y-2 text-sm">
              {contact.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-2 hover:opacity-60">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t text-xs py-5 text-center" style={{ borderColor: v.border, color: v.mutedFg }}>
          © {year} {store.name}
        </div>
      </footer>
    );
  }

  if (layout === "catalogue-rows") {
    return (
      <footer className="max-w-6xl mx-auto w-full px-4 sm:px-6 mt-6 pb-12 text-center" style={{ color: v.fg }}>
        <div className="border-t-2 border-b mb-10" style={{ borderColor: v.fg, height: 5 }} />
        <span className="text-[11px] uppercase tracking-[0.3em]" style={{ color: v.mutedFg }}>
          Colophon
        </span>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{store.name}</p>
        <p className="mt-2 text-sm italic" style={{ color: v.mutedFg }}>
          {store.tagline}
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {contact.map(({ label, href }) => (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="underline underline-offset-4 hover:opacity-60" style={{ textDecorationColor: v.border }}>
              {label}
            </a>
          ))}
        </p>
        <p className="mt-8 text-[11px] uppercase tracking-[0.3em]" style={{ color: v.mutedFg }}>
          Printed {year}
        </p>
      </footer>
    );
  }

  if (layout === "market-deals") {
    return (
      <footer className="mt-10" style={{ background: v.primary, color: v.onPrimary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-8 grid-cols-2 md:grid-cols-4 text-sm">
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-extrabold tracking-tight">{store.name}</span>
            <p className="mt-2 opacity-75">{store.tagline}</p>
          </div>
          <div>
            <span className="font-bold">Categories</span>
            <ul className="mt-3 space-y-1.5 opacity-80">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(subdomain, c.slug)} className="hover:opacity-70">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-bold">Help</span>
            <ul className="mt-3 space-y-1.5 opacity-80">
              {contact.map(({ label, href }) => (
                <li key={label} className="truncate">
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="hover:opacity-70">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-bold">We accept</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {["UPI", "GPay", "PhonePe", ...(store.codEnabled ? ["Cash on delivery"] : [])].map((m) => (
                <span key={m} className="px-2.5 py-1 text-[11px] font-bold" style={{ background: v.onPrimary, color: v.primary, borderRadius: v.radius }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center text-xs py-4 opacity-70 border-t" style={{ borderColor: "color-mix(in srgb, var(--primary-foreground) 20%, transparent)" }}>
          © {year} {store.name} · Secure checkout
        </div>
      </footer>
    );
  }

  // gallery-masonry
  return (
    <footer className="mt-10 border-t" style={{ borderColor: v.border, color: v.mutedFg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs uppercase tracking-[0.25em]">
        <span style={{ color: v.fg }}>{store.name}</span>
        <span className="flex gap-6">
          {contact.slice(1).map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="hover:opacity-70">
              {label.startsWith("@") ? "Instagram" : label.includes("@") ? "Email" : "WhatsApp"}
            </a>
          ))}
        </span>
        <span>© {year}</span>
      </div>
    </footer>
  );
}

/* ================================================================== */
/* Home pages                                                          */
/* ================================================================== */

export function TemplateHome(props: TemplateHomeProps) {
  switch (props.layout) {
    case "showroom-split":
      return <ShowroomHome {...props} />;
    case "catalogue-rows":
      return <CatalogueHome {...props} />;
    case "market-deals":
      return <MarketHome {...props} />;
    case "gallery-masonry":
      return <GalleryHome {...props} />;
    default:
      return null;
  }
}

/* ---------------------------- Showroom ---------------------------- */

function ShowroomCard({ p, props }: { p: ProductData; props: TemplateHomeProps }) {
  const second = p.images[1];
  return (
    <Link href={productHref(props.subdomain, p)} className="group block">
      <span className="relative block aspect-[3/4] overflow-hidden" style={{ borderRadius: v.radius, background: v.muted }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images[0]} alt={p.title} className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${second ? "group-hover:opacity-0" : "group-hover:scale-105"}`} />
        {second && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={second} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        )}
        <button
          type="button"
          aria-label={`Add ${p.title} to bag`}
          disabled={p.stock <= 0}
          onClick={(e) => {
            e.preventDefault();
            props.onAddToCart(p, e);
          }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100 disabled:hidden"
          style={{ background: v.card, color: v.fg }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </span>
      <span className="mt-3 block text-sm font-medium truncate" style={{ color: v.fg }}>
        {p.title}
      </span>
      <span className="mt-0.5 flex items-baseline gap-2 text-sm">
        <span style={{ color: v.fg }}>{rupees(p.price)}</span>
        {p.compareAtPrice && p.compareAtPrice > p.price && (
          <span className="line-through text-xs" style={{ color: v.mutedFg }}>
            {rupees(p.compareAtPrice)}
          </span>
        )}
      </span>
    </Link>
  );
}

function ShowroomHome(props: TemplateHomeProps) {
  const { store, products, categories, subdomain, theme, fallbackImage } = props;
  const img = useImagery(theme, fallbackImage, products);
  const featured = products[0];
  const shelves = useMemo(() => {
    const rows = categories
      .map((c) => ({ ...c, items: products.filter((p) => inCategory(p, c.name)) }))
      .filter((r) => r.items.length > 0)
      .slice(0, 4);
    return rows.length ? rows : [{ name: "All products", slug: "all", image: "", items: products }];
  }, [categories, products]);

  const lookbook = (
    <section className="grid gap-4 md:grid-cols-2">
      {img.gallery.slice(0, 2).map((src, i) => {
        const cat = categories[i];
        return (
          <Link
            key={src}
            href={cat ? categoryHref(subdomain, cat.slug) : categoryHref(subdomain, "all")}
            className="group relative block aspect-[4/5] md:aspect-[5/6] overflow-hidden"
            style={{ borderRadius: v.radius }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute left-6 bottom-6 text-white">
              <span className="block text-xs uppercase tracking-[0.2em] opacity-80">Lookbook {String(i + 1).padStart(2, "0")}</span>
              <span className="mt-1 flex items-center gap-2 text-3xl font-semibold">
                {cat?.name || "The edit"}
                <ArrowUpRight className="w-6 h-6 transition-transform group-hover:rotate-45" />
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );

  return (
    <div className="w-full">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 grid gap-8 md:grid-cols-2 md:items-center">
        <div className="animate-enter-blur order-2 md:order-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: v.accent }}>
            New season · {store.category}
          </span>
          <h1 className="mt-3 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.95]" style={{ color: v.fg }}>
            {store.tagline || store.name}
          </h1>
          <p className="mt-4 max-w-md text-base" style={{ color: v.mutedFg }}>
            {products.length} pieces across {categories.length} collections, ready to ship from {store.name}.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#shelves"
              className="inline-flex items-center gap-2 px-6 h-12 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: v.primary, color: v.onPrimary, borderRadius: 999 }}
            >
              Shop the collection
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link href={categoryHref(subdomain, "all")} className="inline-flex items-center gap-2 px-6 h-12 text-sm font-semibold border" style={{ borderColor: v.fg, color: v.fg, borderRadius: 999 }}>
              Browse all
            </Link>
          </div>
        </div>

        <div className="relative order-1 md:order-2 animate-enter-blur">
          <div className="aspect-[4/5] overflow-hidden" style={{ borderRadius: v.radius, background: v.muted }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.hero} alt="" className="w-full h-full object-cover" />
          </div>
          {img.gallery[2] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.gallery[2]}
              alt=""
              className="hidden lg:block absolute -left-14 top-10 w-36 aspect-[3/4] object-cover shadow-2xl border-4"
              style={{ borderRadius: v.radius, borderColor: v.bg }}
            />
          )}
          {featured && (
            <Link
              href={productHref(subdomain, featured)}
              className="absolute -bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-72 flex items-center gap-3 p-3 shadow-xl transition-transform hover:-translate-y-1"
              style={{ background: v.card, borderRadius: v.radius }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.images[0]} alt="" className="w-14 h-14 object-cover shrink-0" style={{ borderRadius: v.radius }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] uppercase tracking-wider" style={{ color: v.accent }}>
                  Featured
                </span>
                <span className="block text-sm font-semibold truncate" style={{ color: v.fg }}>
                  {featured.title}
                </span>
                <span className="block text-sm" style={{ color: v.fg }}>
                  {rupees(featured.price)}
                </span>
              </span>
              <ArrowUpRight className="w-4 h-4 shrink-0" style={{ color: v.fg }} />
            </Link>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <div className="mt-14 overflow-hidden py-4" style={{ background: v.accent, color: v.onAccent }}>
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em]">
            {[...categories, ...categories, ...categories].map((c, i) => (
              <Link key={i} href={categoryHref(subdomain, c.slug)} className="hover:opacity-70">
                {c.name} <span className="opacity-50 ml-10">✦</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div id="shelves" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {shelves.map((row, i) => (
          <div key={row.slug} className="space-y-14">
            <section>
              <div className="flex items-end justify-between gap-4 mb-5">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: v.fg }}>
                  {row.name}
                </h2>
                <Link href={categoryHref(subdomain, row.slug)} className="text-sm font-semibold inline-flex items-center gap-1 shrink-0" style={{ color: v.fg }}>
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {row.items.map((p) => (
                  <div key={p.id} className="snap-start shrink-0 w-[46%] sm:w-56 lg:w-64">
                    <ShowroomCard p={p} props={props} />
                  </div>
                ))}
              </div>
            </section>
            {i === 0 && lookbook}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Catalogue --------------------------- */

function CatalogueHome(props: TemplateHomeProps) {
  const { products, categories, subdomain, onAddToCart, theme, fallbackImage } = props;
  const img = useImagery(theme, fallbackImage, products);
  const [shown, setShown] = useState(9);

  const plate = (src: string, n: number, caption: string) => (
    <figure key={`plate-${n}`} className="py-10">
      <div className="aspect-[16/8] overflow-hidden" style={{ borderRadius: v.radius, background: v.muted }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
      <figcaption className="mt-3 flex justify-between text-xs italic" style={{ color: v.mutedFg }}>
        <span>Plate {["I", "II", "III", "IV", "V", "VI"][n] || n + 1}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      <section className="pt-10 pb-6 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-end">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: v.accent }}>
            The collection
          </span>
          <p className="mt-4 text-3xl sm:text-4xl leading-snug italic" style={{ color: v.fg }}>
            “{props.store.tagline}”
          </p>
        </div>
        {categories.length > 0 && (
          <ol>
            {categories.slice(0, 6).map((c, i) => (
              <li key={c.slug}>
                <Link href={categoryHref(subdomain, c.slug)} className="group flex items-baseline gap-4 py-2.5 border-t text-lg" style={{ borderColor: v.border, color: v.fg }}>
                  <span className="text-xs tabular-nums" style={{ color: v.mutedFg }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs tabular-nums" style={{ color: v.mutedFg }}>
                    p. {String(i * 4 + 3).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {plate(img.hero, 0, props.store.category)}

      <div>
        {products.slice(0, shown).map((p, i) => (
          <div key={p.id}>
            <article className="grid gap-6 md:gap-12 md:grid-cols-2 md:items-center py-10 border-t" style={{ borderColor: v.border }}>
              <Link href={productHref(subdomain, p)} className={`block aspect-[4/5] overflow-hidden ${i % 2 ? "md:order-2" : ""}`} style={{ borderRadius: v.radius, background: v.muted }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </Link>
              <div>
                <span className="text-xs tabular-nums" style={{ color: v.mutedFg }}>
                  No. {String(i + 1).padStart(2, "0")} — {p.category}
                </span>
                <h2 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-none" style={{ color: v.fg }}>
                  {p.title}
                </h2>
                {p.description && (
                  <p className="mt-4 text-base leading-relaxed line-clamp-4" style={{ color: v.mutedFg }}>
                    {p.description}
                  </p>
                )}
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-2xl" style={{ color: v.fg }}>
                    {rupees(p.price)}
                  </span>
                  {p.compareAtPrice && p.compareAtPrice > p.price && (
                    <span className="text-sm line-through" style={{ color: v.mutedFg }}>
                      {rupees(p.compareAtPrice)}
                    </span>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={(e) => onAddToCart(p, e)}
                    disabled={p.stock <= 0}
                    className="inline-flex items-center gap-2 px-6 h-11 text-sm font-semibold uppercase tracking-[0.12em] disabled:opacity-50"
                    style={{ background: v.primary, color: v.onPrimary, borderRadius: v.radius }}
                  >
                    {p.stock > 0 ? "Add to bag" : "Sold out"}
                  </button>
                  <Link href={productHref(subdomain, p)} className="text-sm underline underline-offset-4" style={{ color: v.fg }}>
                    Read more
                  </Link>
                </div>
              </div>
            </article>
            {i % 3 === 2 && img.gallery[Math.floor(i / 3)] && plate(img.gallery[Math.floor(i / 3)], Math.floor(i / 3) + 1, categories[Math.floor(i / 3)]?.name || "Studio")}
          </div>
        ))}
      </div>
      {shown < products.length && (
        <div className="pb-14 text-center">
          <button type="button" onClick={() => setShown((n) => n + 9)} className="px-8 h-12 text-sm font-semibold uppercase tracking-[0.12em] border" style={{ borderColor: v.fg, color: v.fg, borderRadius: v.radius }}>
            Turn the page
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Market ----------------------------- */

function MarketCard({ p, props }: { p: ProductData; props: TemplateHomeProps }) {
  const off = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  return (
    <div className="group flex flex-col border overflow-hidden transition-shadow hover:shadow-lg" style={{ borderColor: v.border, background: v.card, borderRadius: v.radius }}>
      <Link href={productHref(props.subdomain, p)} className="relative block aspect-square overflow-hidden" style={{ background: v.muted }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {off > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-extrabold" style={{ background: v.accent, color: v.onAccent, borderRadius: 6 }}>
            -{off}%
          </span>
        )}
      </Link>
      <div className="flex-1 flex flex-col p-3">
        <Link href={productHref(props.subdomain, p)} className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: v.fg }}>
          {p.title}
        </Link>
        <span className="mt-1 inline-flex items-center gap-1 text-xs" style={{ color: v.mutedFg }}>
          <Star className="w-3 h-3 fill-current" style={{ color: v.accent }} />
          {(p.rating || 4.5).toFixed(1)}
          <span>({p.reviewCount || 0})</span>
        </span>
        <span className="mt-2 flex items-baseline gap-1.5">
          <span className="text-base font-extrabold" style={{ color: v.fg }}>
            {rupees(p.price)}
          </span>
          {off > 0 && (
            <span className="text-xs line-through" style={{ color: v.mutedFg }}>
              {rupees(p.compareAtPrice!)}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={(e) => props.onAddToCart(p, e)}
          disabled={p.stock <= 0}
          className="mt-3 h-9 text-xs font-bold disabled:opacity-50"
          style={{ background: v.primary, color: v.onPrimary, borderRadius: v.radius }}
        >
          {p.stock > 0 ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}

function MarketHome(props: TemplateHomeProps) {
  const { store, products, categories, subdomain, theme, fallbackImage } = props;
  const img = useImagery(theme, fallbackImage, products);
  const [active, setActive] = useState("All");
  const [sort, setSort] = useState<"popular" | "low" | "high" | "new">("popular");
  const budget = products.filter((p) => p.price <= 99900);

  const shown = useMemo(() => {
    const list = active === "All" ? products : products.filter((p) => inCategory(p, active));
    const sorted = [...list];
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    if (sort === "new") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "popular") sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    return sorted;
  }, [products, active, sort]);

  const perks = [
    { icon: Truck, text: store.freeDeliveryThreshold ? `Free delivery over ${rupees(store.freeDeliveryThreshold)}` : "Fast delivery" },
    { icon: Wallet, text: store.codEnabled ? "Cash on delivery" : "Pay with any UPI app" },
    { icon: ShieldCheck, text: "Secure UPI checkout" },
  ];
  const showDeals = () => {
    setActive("All");
    setSort("low");
    document.getElementById("market")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full">
      <div className="py-2.5 text-xs font-bold border-b" style={{ background: v.muted, color: v.fg, borderColor: v.border }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
          {perks.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color: v.primary }} />
              {text}
            </span>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 grid gap-3 md:grid-cols-4 md:grid-rows-2 md:h-[460px]">
        <button type="button" onClick={showDeals} className="relative overflow-hidden md:col-span-2 md:row-span-2 min-h-[260px] flex items-end p-6 sm:p-8 text-left group" style={{ borderRadius: v.radius, background: v.muted }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.hero} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <span className="relative text-white">
            <span className="inline-block px-2.5 py-1 text-[11px] font-extrabold uppercase" style={{ background: v.accent, color: v.onAccent, borderRadius: 6 }}>
              Mega sale
            </span>
            <span className="mt-3 block text-3xl sm:text-5xl font-extrabold tracking-tight max-w-md leading-[1.05]">Deals across {categories.length || "every"} categories</span>
            <span className="mt-5 inline-flex items-center gap-2 px-5 h-11 text-sm font-bold" style={{ background: v.card, color: v.fg, borderRadius: v.radius }}>
              Shop deals <ArrowRight className="w-4 h-4" />
            </span>
          </span>
        </button>
        {[
          { title: "Under ₹999", sub: `${budget.length} budget picks`, src: img.gallery[0], tone: v.primary, onClick: showDeals },
          { title: "New arrivals", sub: "Fresh this week", src: img.gallery[1], tone: v.accent, onClick: () => setSort("new") },
          { title: categories[0]?.name || "Bestsellers", sub: "Top rated", src: img.gallery[2], tone: v.fg, onClick: () => categories[0] && setActive(categories[0].name) },
          { title: "Free delivery", sub: store.freeDeliveryThreshold ? `Over ${rupees(store.freeDeliveryThreshold)}` : "On every order", src: img.gallery[3] || img.hero, tone: v.primary, onClick: showDeals },
        ].map((t) => (
          <button
            key={t.title}
            type="button"
            onClick={() => {
              t.onClick();
              document.getElementById("market")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="relative overflow-hidden text-left min-h-[140px] p-4 flex items-end group"
            style={{ borderRadius: v.radius }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.src} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <span className="absolute inset-0 opacity-75" style={{ background: `linear-gradient(to top, ${t.tone}, transparent)` }} />
            <span className="relative text-white">
              <span className="block text-lg font-extrabold leading-tight">{t.title}</span>
              <span className="text-xs opacity-90">{t.sub}</span>
            </span>
          </button>
        ))}
      </section>

      <div id="market" className="sticky top-16 z-30 mt-8 border-y backdrop-blur-md" style={{ borderColor: v.border, background: "color-mix(in srgb, var(--background) 92%, transparent)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex-1 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["All", ...categories.map((c) => c.name)].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActive(name)}
                className="px-4 h-9 text-xs font-bold whitespace-nowrap border transition-colors"
                style={active === name ? { background: v.primary, color: v.onPrimary, borderColor: v.primary, borderRadius: 999 } : { borderColor: v.border, color: v.fg, borderRadius: 999 }}
              >
                {name}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort products" className="h-9 px-3 text-xs font-bold border bg-transparent shrink-0" style={{ borderColor: v.border, color: v.fg, borderRadius: v.radius }}>
            <option value="popular">Popular</option>
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <span className="block mb-4 text-xs font-semibold" style={{ color: v.mutedFg }}>
          Showing {shown.length} product{shown.length === 1 ? "" : "s"}
        </span>
        {shown.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: v.mutedFg }}>
            Nothing here yet. Try another category.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {shown.map((p) => (
              <MarketCard key={p.id} p={p} props={props} />
            ))}
          </div>
        )}
        <Link href={categoryHref(subdomain, "all")} className="mt-10 relative block overflow-hidden h-40 sm:h-48 group" style={{ borderRadius: v.radius }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.gallery[1] || img.hero} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${v.primary} 35%, transparent)` }} />
          <span className="relative h-full flex flex-col justify-center px-6 sm:px-10" style={{ color: v.onPrimary }}>
            <span className="text-2xl sm:text-3xl font-extrabold">Can&apos;t find it?</span>
            <span className="mt-1 text-sm opacity-90">Browse the full {store.name} catalogue</span>
          </span>
        </Link>
      </section>
    </div>
  );
}

/* ----------------------------- Gallery ---------------------------- */

function GalleryHome(props: TemplateHomeProps) {
  const { store, products, categories, subdomain, onAddToCart, theme, fallbackImage } = props;
  const img = useImagery(theme, fallbackImage, products);
  const [active, setActive] = useState("All");
  const shown = active === "All" ? products : products.filter((p) => inCategory(p, active));
  const collage = [img.gallery[0], img.hero, img.gallery[1]].filter(Boolean);
  const ratios = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[2/3]", "aspect-[5/6]"];

  return (
    <div className="w-full">
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-10 text-center overflow-hidden">
        <span className="text-[11px] uppercase tracking-[0.4em]" style={{ color: v.accent }}>
          Exhibition · {new Date().getFullYear()}
        </span>
        <div className="relative h-[280px] sm:h-[380px] max-w-3xl mx-auto mt-6">
          {collage.map((src, i) => (
            // the wrapper places and tilts each photo; the fade-in animation sets its own transform
            <span
              key={i}
              className="absolute top-1/2 left-1/2 w-40 sm:w-60"
              style={{ transform: `translate(-50%, -50%) translateX(${(i - 1) * 64}%) rotate(${(i - 1) * 8}deg)`, zIndex: i === 1 ? 2 : 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="w-full aspect-[3/4] object-cover shadow-2xl animate-enter-blur"
                style={{ borderRadius: v.radius, animationDelay: `${i * 140}ms` }}
              />
            </span>
          ))}
        </div>
        <h1 className="relative mt-8 text-5xl sm:text-7xl font-light uppercase tracking-[0.12em] leading-[0.95]" style={{ color: v.fg }}>
          {store.name}
        </h1>
        <p className="relative mt-4 mx-auto max-w-lg text-sm uppercase tracking-[0.2em]" style={{ color: v.mutedFg }}>
          {store.tagline}
        </p>
      </section>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center gap-6 overflow-x-auto border-y [scrollbar-width:none]" style={{ borderColor: v.border }}>
        {["All", ...categories.map((c) => c.name)].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActive(name)}
            className="py-4 text-xs uppercase tracking-[0.2em] whitespace-nowrap border-b -mb-px transition-colors"
            style={{ borderColor: active === name ? v.accent : "transparent", color: active === name ? v.fg : v.mutedFg }}
          >
            {name}
          </button>
        ))}
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4">
        {shown.map((p, i) => (
          <Link key={p.id} href={productHref(subdomain, p)} className={`group relative mb-3 sm:mb-4 block overflow-hidden break-inside-avoid ${ratios[i % ratios.length]}`} style={{ borderRadius: v.radius, background: v.muted }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent text-white flex items-end justify-between gap-2 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300">
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-[0.15em] truncate">{p.title}</span>
                <span className="block text-xs" style={{ color: v.accent }}>
                  {rupees(p.price)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Add ${p.title} to bag`}
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart(p, e);
                }}
                disabled={p.stock <= 0}
                className="w-9 h-9 shrink-0 flex items-center justify-center disabled:opacity-50"
                style={{ background: v.accent, color: v.onAccent, borderRadius: v.radius }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </span>
          </Link>
        ))}
      </section>
      {shown.length === 0 && (
        <p className="pb-16 text-center text-sm" style={{ color: v.mutedFg }}>
          Nothing here yet. Try another category.
        </p>
      )}

      <section className="relative mt-6 h-[320px] sm:h-[420px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.gallery[2] || img.hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <span className="absolute inset-0" style={{ background: "linear-gradient(180deg, var(--background), transparent 40%, var(--background))" }} />
        <div className="relative h-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] uppercase tracking-[0.4em]" style={{ color: v.accent }}>
            Made by hand
          </span>
          <p className="mt-4 text-2xl sm:text-4xl font-light leading-snug" style={{ color: v.fg }}>
            Every piece is one of a kind. When it&apos;s gone, it&apos;s gone.
          </p>
          <Link href={categoryHref(subdomain, "all")} className="mt-6 text-xs uppercase tracking-[0.3em] border-b pb-1" style={{ color: v.fg, borderColor: v.accent }}>
            View the full index
          </Link>
        </div>
      </section>
    </div>
  );
}
