"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  storeService,
  StoreData,
  ProductData,
  OrderItemData,
  CategoryData,
} from "@/lib/store-service";
import { getTheme, generateThemeCssVariables } from "@/lib/themes";
import { getFontFamily } from "@/lib/fonts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import {
  ShoppingBag,
  SlidersHorizontal,
  ChevronDown,
  X,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  CheckCircle,
  QrCode,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export default function CategoryStorePage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const { subdomain, slug } = resolvedParams;
  const router = useRouter();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [discountFilter, setDiscountFilter] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "featured" | "price-asc" | "price-desc" | "newest" | "discount" | "rating"
  >("featured");

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState<Record<string, boolean>>({});

  // Cart state
  const [cart, setCart] = useState<OrderItemData[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  // Load store
  useEffect(() => {
    const loaded = storeService.getStore(subdomain);
    if (loaded) {
      setStore(loaded);
    }
    setLoading(false);
  }, [subdomain]);

  const refreshStore = () => {
    const loaded = storeService.getStore(subdomain);
    if (loaded) setStore({ ...loaded });
  };

  const theme = useMemo(() => {
    return getTheme(store?.activeThemeSlug);
  }, [store?.activeThemeSlug]);

  const themeStyles = useMemo(() => {
    return generateThemeCssVariables(theme, store?.customBrandTheme, store?.fontFamily);
  }, [theme, store?.customBrandTheme, store?.fontFamily]);

  const brandTheme = store?.customBrandTheme || {
    primary: "#111111",
    background: "#FDFBF7",
    surface: "#FFFFFF",
  };
  const activeFontFamily = getFontFamily(store?.fontFamily);

  // Resolve Category Information
  const isAllCategory = slug === "all" || slug === "shop";
  const currentCategory = useMemo<CategoryData | null>(() => {
    if (!store || isAllCategory) return null;
    return storeService.getCategoryBySlug(store.subdomain, slug);
  }, [store, slug, isAllCategory]);

  const parentCategory = useMemo(() => {
    if (!store || !currentCategory?.parentId) return null;
    return (store.categories || []).find((c) => c.id === currentCategory.parentId) || null;
  }, [store, currentCategory]);

  const subCategories = useMemo(() => {
    if (!store || !currentCategory) return [];
    return (store.categories || []).filter(
      (c) => !c.isParent && c.parentId === currentCategory.id && (c.isActive ?? true)
    );
  }, [store, currentCategory]);

  const categoryName = useMemo(() => {
    if (isAllCategory) return "All Collections";
    if (currentCategory) return currentCategory.name;
    // Fallback: capitalize slug
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [isAllCategory, currentCategory, slug]);

  const categoryDescription = useMemo(() => {
    if (isAllCategory) return "Discover our full catalog of premium apparel, handcrafted lifestyle essentials, and modern wardrobe foundations.";
    if (currentCategory?.description) return currentCategory.description;
    return `Explore our hand-selected ${categoryName} designed for effortless modern style.`;
  }, [isAllCategory, currentCategory, categoryName]);

  // Filter & Sort Products (Mixed across all subcategories when viewing a parent collection)
  const filteredProducts = useMemo(() => {
    if (!store) return [];

    let list = store.products.filter((p) => p.status === "published");

    // 1. Category Filter
    if (!isAllCategory) {
      const targetSlug = slug.toLowerCase();
      // If browsing a parent category, include products belonging to any of its children
      const childCategories =
        currentCategory?.isParent && store?.categories
          ? store.categories.filter((c) => c.parentId === currentCategory.id)
          : [];

      const childNames = childCategories.map((c) => c.name.toLowerCase());
      const childSlugs = childCategories.map((c) => c.slug.toLowerCase());
      const childIds = childCategories.map((c) => c.id.toLowerCase());

      list = list.filter((p) => {
        const pCat = (p.category || "").toLowerCase();
        const pCatSlug = pCat.replace(/[^a-z0-9]+/g, "-");

        const matchesDirect =
          pCat === targetSlug ||
          pCatSlug === targetSlug ||
          (currentCategory && (
            pCat === currentCategory.name.toLowerCase() ||
            p.category === currentCategory.id
          ));

        const matchesChild =
          childNames.includes(pCat) ||
          childSlugs.includes(pCatSlug) ||
          childIds.includes(pCat);

        const matchesGender =
          currentCategory?.isParent && (
            (currentCategory.slug.includes("men") && !currentCategory.slug.includes("women") && p.gender === "Men") ||
            (currentCategory.slug.includes("women") && p.gender === "Women")
          );

        return matchesDirect || matchesChild || Boolean(matchesGender && (childNames.length === 0 || childNames.includes(pCat) || pCat.length > 0));
      });
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // 3. Gender Filter
    if (selectedGender !== "All") {
      list = list.filter((p) => p.gender === selectedGender);
    }

    // 4. In Stock Only
    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    // 5. Price Range
    if (priceRange === "under-500") {
      list = list.filter((p) => p.price < 50000);
    } else if (priceRange === "500-1000") {
      list = list.filter((p) => p.price >= 50000 && p.price <= 100000);
    } else if (priceRange === "1000-2000") {
      list = list.filter((p) => p.price > 100000 && p.price <= 200000);
    } else if (priceRange === "above-2000") {
      list = list.filter((p) => p.price > 200000);
    }

    // 6. Discount
    if (discountFilter > 0) {
      list = list.filter((p) => {
        if (!p.compareAtPrice || p.compareAtPrice <= p.price) return false;
        const disc = Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
        return disc >= discountFilter;
      });
    }

    // 7. Sorting
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "discount") {
      list = [...list].sort((a, b) => {
        const discA = a.compareAtPrice ? (a.compareAtPrice - a.price) / a.compareAtPrice : 0;
        const discB = b.compareAtPrice ? (b.compareAtPrice - b.price) / b.compareAtPrice : 0;
        return discB - discA;
      });
    }

    return list;
  }, [
    store,
    isAllCategory,
    slug,
    currentCategory,
    searchQuery,
    selectedGender,
    inStockOnly,
    priceRange,
    discountFilter,
    sortBy,
  ]);

  // Active filters count
  const activeFiltersCount =
    (selectedGender !== "All" ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0) +
    (discountFilter > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedGender("All");
    setPriceRange("all");
    setDiscountFilter(0);
    setInStockOnly(false);
    setSearchQuery("");
    setSortBy("featured");
  };

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const deliveryFee =
    cartSubtotal >= (store?.freeDeliveryThreshold || 99900)
      ? 0
      : store?.standardDeliveryFee || 7000;
  const codFee = paymentMethod === "cod" ? store?.codFee || 0 : 0;
  const cartTotal = cartSubtotal + deliveryFee + codFee;
  const cartTotalItems = cart.reduce((acc, it) => acc + it.quantity, 0);

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

  // Place Order
  const handlePlaceOrder = () => {
    if (!store) return;
    if (!custName || !custPhone || !custStreet || !custCity || !custPincode) {
      alert("Please fill all required delivery details marked with *");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Opening Category Catalog...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center p-8 bg-neutral-50 rounded-lg border border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">Store Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">Store "{subdomain}" could not be located.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button size="sm" className="bg-[#111111] text-white hover:bg-black rounded-md text-xs">
              Return to Platform Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allCategories = store.categories || [];

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
      {/* 1. Header with Brand Logo Upload Placeholder / Image */}
      <StoreHeader
        store={store}
        cartCount={cartTotalItems}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategorySlug={slug}
      />

      {/* 2. Minimal Category Header & Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full">
        {/* Minimal Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
          <Link href={`/s/${store.subdomain}`} className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          {parentCategory && (
            <>
              <Link
                href={`/s/${store.subdomain}/category/${parentCategory.slug}`}
                className="hover:text-neutral-900 transition-colors capitalize"
              >
                {parentCategory.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-neutral-800 font-medium capitalize">{categoryName}</span>
        </nav>

        {/* Title + Count */}
        <div className="mt-2 flex items-baseline justify-between gap-3 pb-1">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 uppercase">
              {categoryName}
            </h1>
            <span className="text-xs text-neutral-400 font-normal">
              ({filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"})
            </span>
          </div>
        </div>

        {/* Sub-Categories Cards Grid: Rendered FIRST like Shop by Category on Homepage */}
        {currentCategory?.isParent && subCategories.length > 0 && (
          <div className="pt-3 pb-6">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900">
                  Explore {categoryName} Categories
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Select a category or browse all styles below
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {subCategories.map((subCat) => (
                <div
                  key={subCat.id}
                  onClick={() => router.push(`/s/${subdomain}/category/${subCat.slug}`)}
                  className="group relative aspect-3/4 rounded-xl overflow-hidden border border-neutral-200 cursor-pointer shadow-2xs hover:shadow-md transition-all hover-lift"
                >
                  <img
                    src={subCat.imageUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80"}
                    alt={subCat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end justify-between p-3.5 text-white">
                    <span className="font-bold text-xs sm:text-sm tracking-tight drop-shadow-xs">{subCat.name}</span>
                    <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sort & Filter Toolbar: Rendered AFTER Sub-Categories Grid */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200/70 pt-4 pb-1">
          <span className="text-xs font-semibold text-neutral-700">
            {currentCategory?.isParent ? `All ${categoryName} Products` : "Products"}
          </span>

          {/* Right Action: Filters Drawer Trigger + Sort Dropdown */}
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMobileFilterOpen(true)}
              className="text-xs h-8 px-3 gap-1.5 rounded-full border-neutral-300 hover:border-black hover:bg-neutral-50 transition-colors text-neutral-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-medium py-1.5 pl-3 pr-7 rounded-full border border-neutral-300 bg-white hover:border-black focus:outline-none focus:border-neutral-900 cursor-pointer appearance-none transition-colors"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sleek Horizontal Quick Filter Pills */}
        <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => {
              setPriceRange("all");
              setInStockOnly(false);
              setDiscountFilter(0);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              priceRange === "all" && !inStockOnly && discountFilter === 0
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPriceRange(priceRange === "under-500" ? "all" : "under-500")}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              priceRange === "under-500"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Under ₹500
          </button>
          <button
            onClick={() => setPriceRange(priceRange === "500-1000" ? "all" : "500-1000")}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              priceRange === "500-1000"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            ₹500 - ₹1,000
          </button>
          <button
            onClick={() => setPriceRange(priceRange === "1000-2000" ? "all" : "1000-2000")}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              priceRange === "1000-2000"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            ₹1,000 - ₹2,000
          </button>
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              inStockOnly
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setDiscountFilter(discountFilter === 20 ? 0 : 20)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              discountFilter > 0
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            On Sale
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-neutral-500 hover:text-black font-semibold ml-2 underline underline-offset-2 shrink-0"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Full-Width Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-white border border-neutral-200 my-4 shadow-2xs">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-neutral-900">
              No products found in "{categoryName}"
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Try adjusting your filters or search keywords to explore other pieces from our catalog.
            </p>
            <Button
              size="sm"
              className="mt-5 bg-[#111111] text-white hover:bg-black rounded-md text-xs"
              onClick={resetAllFilters}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                subdomain={store.subdomain}
                planId={store.planId}
                brandTheme={brandTheme}
                isWishlisted={wishlistedIds[product.id]}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. Mobile Filter Drawer / Sheet */}
      <Modal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter & Refine"
        variant="sheet"
        className="sm:max-w-md rounded-t-lg sm:rounded-lg"
      >
        <div className="space-y-6 text-xs p-1">
          {/* Price Range */}
          <div>
            <label className="font-bold text-neutral-900 block mb-2">Price Range</label>
            <div className="space-y-2">
              {[
                { id: "all", label: "All Prices" },
                { id: "under-500", label: "Under ₹500" },
                { id: "500-1000", label: "₹500 - ₹1,000" },
                { id: "1000-2000", label: "₹1,000 - ₹2,000" },
                { id: "above-2000", label: "Above ₹2,000" },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mobile-price"
                    checked={priceRange === item.id}
                    onChange={() => setPriceRange(item.id)}
                    className="accent-black w-3.5 h-3.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="pt-4 border-t border-neutral-200">
            <label className="font-bold text-neutral-900 block mb-2">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {["All", "Men", "Women", "Unisex"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`py-2 px-3 rounded border text-center font-medium ${
                    selectedGender === g
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Discount / Offers */}
          <div className="pt-4 border-t border-neutral-200">
            <label className="font-bold text-neutral-900 block mb-2">Discount / Offers</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 0, label: "All Items" },
                { val: 10, label: "10% or more" },
                { val: 20, label: "20% or more" },
                { val: 30, label: "30% or more" },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDiscountFilter(d.val)}
                  className={`py-2 px-3 rounded border text-center font-medium ${
                    discountFilter === d.val
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <span className="font-bold text-neutral-900">In Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-black w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="w-1/2 text-xs"
              onClick={resetAllFilters}
            >
              Reset All
            </Button>
            <Button
              className="w-1/2 bg-[#111111] text-white hover:bg-black text-xs"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Apply Filters ({filteredProducts.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. Cart Drawer & Checkout */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="Your Shopping Bag"
        variant="sheet"
        className="sm:max-w-md rounded-t-lg sm:rounded-lg"
      >
        {cart.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-900">Your bag is empty</h4>
            <p className="text-xs text-neutral-500 mt-1">Discover pieces from {categoryName}.</p>
            <Button
              className="mt-4 bg-[#111111] text-white hover:bg-black rounded-md text-xs"
              size="sm"
              onClick={() => setIsCartOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-4">
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs">
              {cartSubtotal >= store.freeDeliveryThreshold ? (
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free shipping unlocked on this order</span>
                </div>
              ) : (
                <div className="text-neutral-700">
                  Add <span className="font-bold">₹{((store.freeDeliveryThreshold - cartSubtotal) / 100).toLocaleString("en-IN")}</span> more for Free Shipping
                </div>
              )}
            </div>

            <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-14 h-16 rounded-md object-cover border border-neutral-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-neutral-900 line-clamp-1">{item.title}</h5>
                    <span className="text-xs font-bold text-neutral-900 block mt-1">
                      ₹{(item.price / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border border-neutral-200 rounded-md px-2 py-1">
                    <button onClick={() => updateCartQty(idx, -1)} className="text-xs font-bold hover:text-red-600">-</button>
                    <span className="text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => updateCartQty(idx, 1)} className="text-xs font-bold hover:text-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{(cartSubtotal / 100).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${(deliveryFee / 100).toLocaleString("en-IN")}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t">
                <span>Total</span>
                <span>₹{(cartTotal / 100).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button
              className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs py-3"
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
            >
              Proceed to Direct Checkout
            </Button>
          </div>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={checkoutStep === "details" ? "Delivery Details" : checkoutStep === "payment" ? "Direct Payment" : "Order Placed"}
        className="sm:max-w-md rounded-lg"
      >
        {checkoutStep === "details" && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Full Name *</label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Phone (for order updates) *</label>
              <Input
                placeholder="e.g. +91 9876543210"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700">Delivery Address *</label>
              <Input
                placeholder="House/Flat, Street name"
                value={custStreet}
                onChange={(e) => setCustStreet(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">City *</label>
                <Input
                  placeholder="e.g. Mumbai"
                  value={custCity}
                  onChange={(e) => setCustCity(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700">Pincode *</label>
                <Input
                  placeholder="e.g. 400001"
                  value={custPincode}
                  onChange={(e) => setCustPincode(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-[#111111] text-white hover:bg-black rounded-md text-xs py-2.5"
              onClick={() => {
                if (!custName || !custPhone || !custStreet || !custCity || !custPincode) {
                  alert("Please fill all required fields marked with *");
                  return;
                }
                setCheckoutStep("payment");
              }}
            >
              Continue to Payment (₹{(cartTotal / 100).toLocaleString("en-IN")})
            </Button>
          </div>
        )}

        {checkoutStep === "payment" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-md border text-left ${
                  paymentMethod === "upi" ? "border-black bg-neutral-50 ring-1 ring-black" : "border-neutral-200"
                }`}
              >
                <QrCode className="w-4 h-4 mb-1" />
                <span className="font-bold block">Direct UPI</span>
                <span className="text-[10px] text-neutral-500">QR / VPA transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`p-3 rounded-md border text-left ${
                  paymentMethod === "cod" ? "border-black bg-neutral-50 ring-1 ring-black" : "border-neutral-200"
                }`}
              >
                <Truck className="w-4 h-4 mb-1" />
                <span className="font-bold block">Cash on Delivery</span>
                <span className="text-[10px] text-neutral-500">Pay at doorstep</span>
              </button>
            </div>

            {paymentMethod === "upi" && (
              <div className="p-4 rounded-md bg-neutral-50 border border-neutral-200 text-center space-y-2">
                <p className="text-xs font-semibold">Pay directly to seller VPA: {store.upiId}</p>
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded border border-neutral-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=${store.upiId}&pn=${encodeURIComponent(store.name)}&am=${(cartTotal / 100).toFixed(2)}&cu=INR`
                    )}`}
                    alt="UPI QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left pt-2">
                  <label className="text-[10px] font-bold text-neutral-700 block mb-1">
                    Enter Bank UTR / Ref Number:
                  </label>
                  <Input
                    placeholder="e.g. 439281928301"
                    value={paymentUtr}
                    onChange={(e) => setPaymentUtr(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="w-1/3 text-xs" onClick={() => setCheckoutStep("details")}>
                Back
              </Button>
              <Button className="w-2/3 bg-[#111111] text-white hover:bg-black text-xs" onClick={handlePlaceOrder}>
                Place Order (₹{(cartTotal / 100).toLocaleString("en-IN")})
              </Button>
            </div>
          </div>
        )}

        {checkoutStep === "success" && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-neutral-900">Order Placed Successfully!</h3>
            <p className="text-xs text-neutral-500">
              Order <span className="font-bold text-neutral-800">{createdOrderNumber}</span> recorded.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link href={`/orders/${createdOrderToken}`}>
                <Button className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs">
                  Track Order Status
                </Button>
              </Link>
              <Button variant="outline" className="w-full text-xs" onClick={() => setIsCheckoutOpen(false)}>
                Continue Browsing
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Rich Multi-Column Footer */}
      <StoreFooter store={store} />
    </div>
  );
}
