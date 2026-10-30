"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart } from "lucide-react";
import { ProductData, CustomBrandTheme } from "@/lib/store-service";
import { canUseReviews } from "@/lib/plans";

interface ProductCardProps {
  product: ProductData;
  subdomain: string;
  planId?: string;
  brandTheme?: CustomBrandTheme;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string, e: React.MouseEvent) => void;
  className?: string;
}

export function ProductCard({
  product,
  subdomain,
  planId = "free",
  brandTheme = {
    primary: "#111111",
    background: "#FDFBF7",
    surface: "#FFFFFF",
  },
  isWishlisted = false,
  onToggleWishlist,
  className = "",
}: ProductCardProps) {
  const router = useRouter();

  const hasComparePrice =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;

  const discountPercent = hasComparePrice
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100
      )
    : 0;

  // Review mark is strictly gated to paid plans only
  const showReviewMark = canUseReviews(planId);

  const handleCardClick = () => {
    router.push(`/s/${subdomain}/products/${product.slug}`);
  };

  const isDark =
    brandTheme.background?.toLowerCase() === "#090d16" ||
    brandTheme.background?.toLowerCase() === "#0b0f19" ||
    brandTheme.background?.toLowerCase() === "#111827" ||
    brandTheme.background?.toLowerCase() === "#121212" ||
    brandTheme.background?.toLowerCase() === "#000000";

  return (
    <div
      onClick={handleCardClick}
      className={`group flex flex-col justify-between cursor-pointer transition-all duration-300 ${className}`}
    >
      {/* Product Image Frame */}
      <div
        style={{ backgroundColor: brandTheme.surface }}
        className={`relative aspect-3/4 rounded-lg overflow-hidden border shadow-2xs group-hover:shadow-md transition-all duration-300 ${
          isDark ? "border-neutral-800" : "border-neutral-200/90"
        }`}
      >
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Offer Value Tag (on image) */}
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-sm bg-[#E04E39] text-white font-bold text-[10px] tracking-wide shadow-xs uppercase">
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => onToggleWishlist(product.id, e)}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full backdrop-blur-xs flex items-center justify-center shadow-xs transition-transform active:scale-90 ${
              isDark ? "bg-black/70 text-white hover:text-red-400" : "bg-white/90 text-neutral-600 hover:text-black"
            }`}
            aria-label="Save to Wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isWishlisted ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Clean Product Details: Title, Price, MRP (striked), Offer value, Review mark (if paid plan) */}
      <div className="mt-3 space-y-1">
        {/* Title */}
        <h4 className={`text-xs sm:text-sm font-bold line-clamp-1 group-hover:underline ${
          isDark ? "text-white" : "text-neutral-900"
        }`}>
          {product.title}
        </h4>

        {/* Pricing Row: Price, MRP (striked), Offer Value */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={`text-xs sm:text-sm font-extrabold ${
            isDark ? "text-white" : "text-neutral-950"
          }`}>
            ₹{(product.price / 100).toLocaleString("en-IN")}
          </span>
          {hasComparePrice && (
            <>
              <span className="text-[11px] text-neutral-400 line-through">
                ₹{(product.compareAtPrice! / 100).toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] font-bold text-emerald-500">
                ({discountPercent}% OFF)
              </span>
            </>
          )}
        </div>

        {/* Review mark ONLY IF paid plan */}
        {showReviewMark && (
          <div className="flex items-center gap-1 text-[11px] text-neutral-600 pt-0.5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200/60">
              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span>{product.rating ? product.rating.toFixed(1) : "4.8"}</span>
            </span>
            <span className="text-neutral-500 text-[10px]">
              ({product.reviewCount || 120})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
