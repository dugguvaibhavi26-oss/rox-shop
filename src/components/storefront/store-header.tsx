"use client";

import React from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { StoreData, CustomBrandTheme } from "@/lib/store-service";

interface StoreHeaderProps {
  store: StoreData;
  cartCount: number;
  onOpenCart: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: () => void;
  activeCategorySlug?: string;
  brandTheme?: CustomBrandTheme;
}

export function StoreHeader({
  store,
  cartCount,
  onOpenCart,
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  activeCategorySlug,
  brandTheme: brandThemeProp,
}: StoreHeaderProps) {
  const brandTheme: CustomBrandTheme = brandThemeProp || store.customBrandTheme || {
    primary: "#111111",
    background: "#FDFBF7",
    surface: "#FFFFFF",
  };

  const categories = store.categories?.filter((c) => c.isActive) || [];

  return (
    <div className="w-full">
      {/* 1. Top Announcement Bar */}
      <div
        style={{ backgroundColor: brandTheme.primary, color: "#FFFFFF" }}
        className="px-4 py-2 text-xs font-normal tracking-wide transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <p className="truncate text-[11px] sm:text-xs">
            {store.announcementText ||
              "Get 10% off on your first order | Free shipping above ₹999"}
          </p>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-neutral-300 shrink-0">
            <Link
              href="/orders/tok_sh_lume_8899aabb"
              className="hover:text-white transition-colors"
            >
              Track Order
            </Link>
            <span>|</span>
            <a
              href={`https://wa.me/${store.contactPhone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <header
        style={{
          backgroundColor: brandTheme.surface,
          borderBottomColor: "rgba(0,0,0,0.08)",
        }}
        className="border-b sticky top-0 z-30 backdrop-blur-md transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo or Brand Name */}
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <Link
              href={`/s/${store.subdomain}`}
              className="flex items-center gap-3 shrink-0 focus:outline-none"
            >
              {store.logoUrl && store.logoUrl.trim().length > 0 ? (
                <div className="flex items-center gap-2">
                  <img
                    src={store.logoUrl}
                    alt={`${store.name} Brand Logo`}
                    className="h-8 sm:h-10 w-auto max-w-[160px] object-contain rounded-sm"
                  />
                  <span
                    style={{ color: brandTheme.primary }}
                    className="font-extrabold text-xl sm:text-2xl tracking-tight hidden sm:inline-block"
                  >
                    {store.name}
                  </span>
                </div>
              ) : (
                <span
                  style={{ color: brandTheme.primary }}
                  className="font-extrabold text-2xl sm:text-3xl tracking-tight leading-none"
                >
                  {store.name}
                </span>
              )}
            </Link>

            {/* Top Navigation Categories */}
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-neutral-600">
              <Link
                href={`/s/${store.subdomain}`}
                className={`transition-colors hover:text-black ${
                  !activeCategorySlug ? "text-black font-bold" : ""
                }`}
              >
                All
              </Link>
              {categories.slice(0, 6).map((cat) => {
                const isActive = activeCategorySlug === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/s/${store.subdomain}/category/${cat.slug}`}
                    className={`transition-colors hover:text-black ${
                      isActive ? "text-black font-extrabold border-b-2 border-black pb-0.5" : ""
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons: Search, Cart Bag */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            {onSearchChange && (
              <div className="relative hidden md:block w-64 lg:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search shirts, jeans, dresses..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && onSearchSubmit) {
                      onSearchSubmit();
                    }
                  }}
                  style={{
                    backgroundColor: brandTheme.background,
                    color: brandTheme.primary,
                    borderColor: "rgba(0,0,0,0.1)",
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-full border text-xs placeholder-neutral-400 focus:outline-none focus:border-neutral-400 transition-all"
                />
              </div>
            )}

            {/* Shopping Cart Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenCart}
              style={{
                backgroundColor: brandTheme.primary,
                color: "#FFFFFF",
              }}
              className="relative p-2.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 hover:opacity-90 transition-all shadow-xs"
              aria-label="Open Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline-block text-xs font-bold">Bag</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
