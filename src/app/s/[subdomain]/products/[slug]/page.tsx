"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeService, StoreData, ProductData, OrderItemData } from "@/lib/store-service";
import { getTheme, generateThemeCssVariables } from "@/lib/themes";
import { getFontFamily } from "@/lib/fonts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  ShoppingBag,
  Search,
  Star,
  CheckCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  Plus,
  Minus,
  Heart,
  Share2,
  Phone,
  QrCode,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Ruler,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { canUseReviews } from "@/lib/plans";

interface ProductPageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const { subdomain, slug } = resolvedParams;
  const router = useRouter();

  const [store, setStore] = useState<StoreData | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant selections
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // UI Modals & Accordions
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<OrderItemData[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>("details");

  // Review state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Checkout Modal
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

  useEffect(() => {
    const res = storeService.getProductBySlug(subdomain, slug);
    if (res) {
      setStore(res.store);
      setProduct(res.product);

      // Default options
      if (res.product.options) {
        const colorOpt = res.product.options.find((o) => o.name.toLowerCase().includes("color") || o.name.toLowerCase().includes("wash"));
        if (colorOpt && colorOpt.options[0]) setSelectedColor(colorOpt.options[0]);

        const sizeOpt = res.product.options.find((o) => o.name.toLowerCase().includes("size") || o.name.toLowerCase().includes("waist"));
        if (sizeOpt && sizeOpt.options[0]) setSelectedSize(sizeOpt.options[0]);
      }
    }
    setLoading(false);
  }, [subdomain, slug]);

  const refreshProduct = () => {
    const res = storeService.getProductBySlug(subdomain, slug);
    if (res) {
      setStore({ ...res.store });
      setProduct({ ...res.product });
    }
  };

  const theme = useMemo(() => {
    return getTheme(store?.activeThemeSlug);
  }, [store?.activeThemeSlug]);

  const themeStyles = useMemo(() => {
    return generateThemeCssVariables(theme, store?.customBrandTheme, store?.fontFamily);
  }, [theme, store?.customBrandTheme, store?.fontFamily]);

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
    return Math.max(0, cartSubtotal + deliveryFee + codFee);
  }, [cartSubtotal, deliveryFee, codFee]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  // Add to Bag
  const handleAddToBag = () => {
    if (!product) return;
    const variantStr = [selectedColor, selectedSize].filter(Boolean).join(" / ");

    setCart((prev) => {
      const existing = prev.find(
        (it) => it.productId === product.id && it.variantName === variantStr
      );
      if (existing) {
        return prev.map((it) =>
          it.productId === product.id && it.variantName === variantStr
            ? { ...it, quantity: it.quantity + quantity }
            : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          image: product.images[0] || "",
          quantity,
          price: product.price,
          variantName: variantStr || undefined,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const variantStr = [selectedColor, selectedSize].filter(Boolean).join(" / ");
    setCart([
      {
        productId: product.id,
        title: product.title,
        image: product.images[0] || "",
        quantity,
        price: product.price,
        variantName: variantStr || undefined,
      },
    ]);
    setIsCheckoutOpen(true);
    setCheckoutStep("details");
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

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewName.trim() || !reviewComment.trim()) return;

    storeService.addReview(subdomain, {
      productId: product.id,
      customerName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
    });

    setReviewSubmitted(true);
    refreshProduct();
    setTimeout(() => {
      setIsReviewModalOpen(false);
      setReviewSubmitted(false);
      setReviewName("");
      setReviewComment("");
    }, 1500);
  };

  // Place Order
  const handlePlaceOrder = () => {
    if (!store) return;
    if (!custName || !custPhone || !custStreet || !custCity || !custPincode) {
      alert("Please fill in all required delivery details.");
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
    refreshProduct();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Loading item...</p>
        </div>
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center p-8 bg-neutral-50 rounded-lg border border-neutral-200">
          <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-neutral-900">Product Not Found</h2>
          <p className="text-xs text-neutral-500 mt-1">
            This item is currently unavailable or has been archived.
          </p>
          <div className="mt-6">
            <Link href={`/s/${subdomain}`}>
              <Button size="sm">Back to Catalog</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const productReviews = store.reviews.filter(
    (r) => r.productId === product.id && r.status === "approved"
  );

  const relatedProducts = store.products
    .filter((p) => p.id !== product.id && p.status === "published")
    .slice(0, 4);

  // UPI deep link
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(store.upiId)}&pn=${encodeURIComponent(
    store.name
  )}&am=${(cartTotal / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order from ${store.name}`
  )}`;

  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  const brandTheme = store?.customBrandTheme || {
    primary: "#111111",
    background: "#FDFBF7",
    surface: "#FFFFFF",
  };
  const activeFontFamily = getFontFamily(store?.fontFamily);

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
      {/* 1 & 2. Announcement & Header with Brand Logo Placeholder / Image */}
      <StoreHeader
        store={store}
        cartCount={cartItemCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Breadcrumb linking to Category Page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full">
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href={`/s/${store.subdomain}`} className="hover:text-black hover:underline">Home</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <Link
            href={`/s/${store.subdomain}/category/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="hover:text-black hover:underline"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-black font-bold truncate max-w-xs">{product.title}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left: Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto shrink-0 pb-2 sm:pb-0 sm:w-20">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-20 sm:w-20 sm:h-24 rounded-md overflow-hidden border transition-all ${
                      activeImageIndex === idx
                        ? "border-black ring-1 ring-black"
                        : "border-neutral-200 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Featured Photo */}
            <div className="flex-1 aspect-3/4 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 relative group">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {discountPercent > 0 && (
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-sm bg-[#E04E39] text-white font-bold text-xs">
                  -{discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Right: Sticky Details */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {product.gender ? `${product.gender}'s Collection` : product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] mt-1">
                {product.title}
              </h1>

              {/* Rating - Only if Paid Plan */}
              {canUseReviews(store.planId) && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="ml-1 text-xs font-bold text-neutral-900">{product.rating || "4.6"}</span>
                  </div>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs text-neutral-600 underline cursor-pointer" onClick={() => setOpenAccordion("reviews")}>
                    {product.reviewCount || 120} reviews
                  </span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="border-y border-neutral-200 py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#111111]">
                  ₹{(product.price / 100).toLocaleString("en-IN")}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm sm:text-base text-neutral-400 line-through">
                    ₹{(product.compareAtPrice / 100).toLocaleString("en-IN")}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-bold text-[#E04E39]">
                    Save {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Inclusive of all taxes. Free shipping on orders above ₹{store.freeDeliveryThreshold / 100}.
              </p>
            </div>

            {/* Color Swatches */}
            {product.colorSwatches && product.colorSwatches.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-neutral-900 block mb-2">
                  Color: <span className="text-neutral-500 font-normal">{selectedColor || "Standard"}</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {product.colorSwatches.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const opt = product.options?.find((o) => o.name.toLowerCase().includes("color"));
                        if (opt && opt.options[i]) setSelectedColor(opt.options[i]);
                      }}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        selectedColor === (product.options?.[0]?.options?.[i] || "")
                          ? "ring-2 ring-black ring-offset-2"
                          : "border-neutral-300"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label="Select color"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-900">
                  Select Size: <span className="text-neutral-500 font-normal">{selectedSize}</span>
                </label>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-neutral-500 hover:text-black flex items-center gap-1 underline"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2.5 text-xs font-medium rounded-md border text-center transition-all ${
                      selectedSize === sz
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-neutral-800 border-neutral-300 hover:border-black"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-neutral-300 rounded-md bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2.5 text-neutral-600 hover:bg-neutral-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-neutral-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2.5 text-neutral-600 hover:bg-neutral-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <Button
                  size="lg"
                  style={{ backgroundColor: brandTheme.primary, color: "#FFFFFF" }}
                  className="flex-1 hover:opacity-90 rounded-md text-xs font-semibold py-3"
                  onClick={handleAddToBag}
                >
                  Add to Bag
                </Button>
              </div>

              {/* Instant Buy Now Button */}
              <Button
                size="lg"
                variant="outline"
                style={{ borderColor: brandTheme.primary, color: brandTheme.primary }}
                className="w-full hover:opacity-90 rounded-md text-xs font-semibold py-3"
                onClick={handleBuyNow}
              >
                Buy Now with Direct UPI / COD
              </Button>
            </div>

            {/* Trust Highlights */}
            <div className="pt-4 border-t border-neutral-200 grid grid-cols-3 gap-3 text-center text-[11px] text-neutral-600">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-neutral-800" />
                <span>Free Shipping &gt; ₹999</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-neutral-200">
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
                <span>100% Direct UPI</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-neutral-800" />
                <span>7-Day Return Policy</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="divide-y divide-neutral-200 border-t border-neutral-200 pt-2">
              {/* Description */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "details" ? "" : "details")}
                  className="w-full flex items-center justify-between text-xs font-bold text-neutral-900 py-1"
                >
                  <span>Product Details & Description</span>
                  {openAccordion === "details" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openAccordion === "details" && (
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Fabric & Materials */}
              {product.details?.fabric && (
                <div className="py-3">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === "fabric" ? "" : "fabric")}
                    className="w-full flex items-center justify-between text-xs font-bold text-neutral-900 py-1"
                  >
                    <span>Fabric, Materials & Care</span>
                    {openAccordion === "fabric" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openAccordion === "fabric" && (
                    <div className="text-xs text-neutral-600 mt-2 space-y-1">
                      <p><span className="font-semibold text-neutral-800">Composition:</span> {product.details.fabric}</p>
                      <p><span className="font-semibold text-neutral-800">Fit:</span> {product.details.fit}</p>
                      <p><span className="font-semibold text-neutral-800">Care Instructions:</span> {product.details.care}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping & Delivery */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")}
                  className="w-full flex items-center justify-between text-xs font-bold text-neutral-900 py-1"
                >
                  <span>Shipping & Returns</span>
                  {openAccordion === "shipping" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openAccordion === "shipping" && (
                  <div className="text-xs text-neutral-600 mt-2 space-y-1">
                    <p>Dispatched within 24-48 hours via BlueDart or Delhivery.</p>
                    <p>Free standard delivery on all prepaid & COD orders above ₹999.</p>
                    <p>Easy 7-day exchange window for size and fit adjustments.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section - Locked / Only for Paid Plan */}
        {canUseReviews(store.planId) && (
          <section className="mt-16 pt-12 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
                  Customer Reviews ({productReviews.length})
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Real feedback from verified purchasers
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-neutral-800 text-neutral-900 hover:bg-neutral-50 rounded-md"
                onClick={() => setIsReviewModalOpen(true)}
              >
                Write a Review
              </Button>
            </div>

            {productReviews.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-xs text-neutral-500">
                  No customer reviews yet. Be the first to share your experience with this piece.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productReviews.map((rev) => (
                  <div key={rev.id} className="p-5 rounded-lg border border-neutral-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">{rev.customerName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-sm">
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    {rev.title && <h5 className="text-xs font-bold text-neutral-900 mt-2">{rev.title}</h5>}
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* You Might Also Like */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-neutral-200">
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight mb-6">
              You Might Also Like
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  subdomain={subdomain}
                  planId={store.planId}
                  brandTheme={brandTheme}
                  isWishlisted={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Slide-over Cart Drawer */}
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
            <p className="text-xs text-neutral-500 mt-1">Discover pieces from our catalog.</p>
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
            {/* Free Delivery Meter */}
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

            {/* Cart Items List */}
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
                    {item.variantName && (
                      <span className="text-[10px] text-neutral-500 block">{item.variantName}</span>
                    )}
                    <span className="text-xs font-bold text-neutral-900 mt-0.5 block">
                      ₹{(item.price / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center border border-neutral-300 rounded-md bg-white">
                    <button
                      onClick={() => updateCartQty(idx, -1)}
                      className="px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(idx, 1)}
                      className="px-2 py-1 text-neutral-600 hover:bg-neutral-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-200 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium text-neutral-900">₹{(cartSubtotal / 100).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee / 100}`}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-neutral-900">
                <span>Total Amount</span>
                <span>₹{(cartTotal / 100).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <Button
              size="lg"
              className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs font-semibold py-3"
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
                setCheckoutStep("details");
              }}
            >
              Checkout (₹{(cartTotal / 100).toLocaleString("en-IN")})
            </Button>
          </div>
        )}
      </Modal>

      {/* Size Guide Modal */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size & Measurement Guide"
        className="rounded-lg sm:max-w-md"
      >
        <div className="space-y-4 text-xs text-neutral-700">
          <p>All garment measurements are listed in inches. Designed with an intentional modern drape.</p>
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <table className="w-full text-left text-xs divide-y divide-neutral-200">
              <thead className="bg-neutral-50 font-bold text-neutral-900">
                <tr>
                  <th className="p-2">Size</th>
                  <th className="p-2">Chest</th>
                  <th className="p-2">Length</th>
                  <th className="p-2">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="p-2 font-bold">S</td>
                  <td className="p-2">40"</td>
                  <td className="p-2">27.5"</td>
                  <td className="p-2">19"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">M</td>
                  <td className="p-2">42"</td>
                  <td className="p-2">28.5"</td>
                  <td className="p-2">20"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">L</td>
                  <td className="p-2">44"</td>
                  <td className="p-2">29.5"</td>
                  <td className="p-2">21"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">XL</td>
                  <td className="p-2">46"</td>
                  <td className="p-2">30.5"</td>
                  <td className="p-2">22"</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-neutral-500">For an oversized look, select your usual size. For a regular fit, consider sizing down.</p>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Write a Review"
        description={`Share your feedback on ${product.title}`}
        className="rounded-lg"
      >
        {reviewSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-neutral-900">Thank you</h4>
            <p className="text-xs text-neutral-500">Your review has been submitted for verified inclusion.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1">Your Rating:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? "fill-amber-500" : "text-neutral-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Full Name *</label>
              <Input
                placeholder="e.g. Kavya Menon"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Review Comments *</label>
              <textarea
                rows={3}
                placeholder="How was the fabric quality, drape, and overall fit?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-2.5 rounded-md border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs">
              Submit Review
            </Button>
          </form>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={
          checkoutStep === "details"
            ? "1. Delivery Information"
            : checkoutStep === "payment"
            ? "2. Payment Method"
            : "Order Confirmed"
        }
        className="rounded-lg sm:max-w-lg"
      >
        {checkoutStep === "details" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Full Name *</label>
                <Input
                  placeholder="e.g. Arjun Singhal"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Mobile Phone *</label>
                <Input
                  placeholder="+91 9876543210"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Email (Optional)</label>
              <Input
                placeholder="name@example.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Shipping Address *</label>
              <Input
                placeholder="Flat / House / Street"
                value={custStreet}
                onChange={(e) => setCustStreet(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold block mb-1">City *</label>
                <Input
                  placeholder="City"
                  value={custCity}
                  onChange={(e) => setCustCity(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-bold block mb-1">State</label>
                <Input
                  placeholder="State"
                  value={custState}
                  onChange={(e) => setCustState(e.target.value)}
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Pincode *</label>
                <Input
                  placeholder="Pincode"
                  value={custPincode}
                  onChange={(e) => setCustPincode(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              className="w-full mt-4 bg-[#111111] text-white hover:bg-black rounded-md text-xs py-3"
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
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-md border text-left flex flex-col justify-between ${
                  paymentMethod === "upi"
                    ? "border-black bg-neutral-50 ring-1 ring-black"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-black" />
                  <span className="font-bold text-neutral-900">Direct UPI</span>
                </div>
                <span className="text-[11px] text-neutral-500">Scan QR / GPay / PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`p-3 rounded-md border text-left flex flex-col justify-between ${
                  paymentMethod === "cod"
                    ? "border-black bg-neutral-50 ring-1 ring-black"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-black" />
                  <span className="font-bold text-neutral-900">Cash on Delivery</span>
                </div>
                <span className="text-[11px] text-neutral-500">Pay at doorstep</span>
              </button>
            </div>

            {paymentMethod === "upi" && (
              <div className="p-4 rounded-md bg-neutral-50 border border-neutral-200 text-center space-y-3">
                <span className="text-xs font-semibold text-neutral-800 block">
                  Scan UPI QR to pay directly to seller: {store.upiId}
                </span>

                <div className="w-40 h-40 mx-auto p-2 bg-white rounded-md border border-neutral-200">
                  <img src={upiQrUrl} alt="UPI QR" className="w-full h-full object-contain" />
                </div>

                <div className="text-left pt-2">
                  <label className="text-[11px] font-bold text-neutral-800 block mb-1">
                    Enter Bank UTR / Reference No. (after payment):
                  </label>
                  <Input
                    placeholder="e.g. 428719283741"
                    value={paymentUtr}
                    onChange={(e) => setPaymentUtr(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-1/3 rounded-md text-xs"
                onClick={() => setCheckoutStep("details")}
              >
                Back
              </Button>
              <Button
                className="w-2/3 bg-[#111111] text-white hover:bg-black rounded-md text-xs"
                onClick={handlePlaceOrder}
              >
                Place Order (₹{(cartTotal / 100).toLocaleString("en-IN")})
              </Button>
            </div>
          </div>
        )}

        {checkoutStep === "success" && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-neutral-900">Order Placed Successfully</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Order <span className="font-bold text-neutral-800">{createdOrderNumber}</span> recorded.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link href={`/orders/${createdOrderToken}`}>
                <Button className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs">
                  Track Order Status
                </Button>
              </Link>
              <Link href={`/s/${subdomain}`}>
                <Button variant="outline" className="w-full rounded-md text-xs">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Rich Multi-Column Store Footer */}
      <StoreFooter store={store} />
    </div>
  );
}
