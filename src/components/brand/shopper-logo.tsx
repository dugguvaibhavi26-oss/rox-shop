import { cn } from "@/lib/utils";

// Shopping bag with two wedge cut-outs that read as an "S". Drawn in currentColor.
const BAG =
  "M24 35L108 27Q116 26.3 116.8 34L124.6 103.5Q125.3 110 119 111.6L22.5 134Q9.6 136.6 8.3 124L18 44Q19 36 24 35Z" +
  "M50 60L111 47.5L113 77Z" +
  "M19.5 80L80 97L16.5 115.5Z";

export function ShopperMark({ className }: { className?: string }) {
  return (
    <svg viewBox="4 -1 124 139" aria-hidden className={className}>
      <path d="M48 33V21C48 1.5 89 1.5 89 21V29" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      <path d={BAG} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** Bag mark + "shoppersite" wordmark. Sized by the surrounding font size. */
export function ShopperLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.35em] leading-none", className)} role="img" aria-label="shoppersite">
      <ShopperMark className={cn("h-[1.45em] w-auto shrink-0", markClassName)} />
      <span aria-hidden className="font-semibold tracking-[-0.035em]">
        shoppersite
      </span>
    </span>
  );
}
