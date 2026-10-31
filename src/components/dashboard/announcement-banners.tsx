"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { storeService, type PlatformBanner } from "@/lib/store-service";

/**
 * Image-only strip of the banners the platform admin uploads. Swipeable and auto-rotating;
 * links of the form `/dashboard?tab=<tab>` are handed to `onOpenTab` so they switch tabs in place.
 */
export function AnnouncementBanners({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const [banners, setBanners] = useState<PlatformBanner[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setBanners([...storeService.getPlatformBanners()]);
    sync();
    return storeService.subscribe(sync);
  }, []);

  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      const next = (active + 1) % count;
      const slide = track?.children[next] as HTMLElement | undefined;
      if (track && slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }, 6000);
    return () => clearInterval(id);
  }, [active, count, paused]);

  const onScroll = () => {
    const track = trackRef.current;
    if (track) setActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
  };

  const open = (href?: string) => {
    if (!href) return;
    const tab = href.match(/^\/dashboard\?tab=([\w-]+)/)?.[1];
    if (tab && onOpenTab) onOpenTab(tab);
    else window.open(href, href.startsWith("/") ? "_self" : "_blank");
  };

  if (count === 0) {
    return (
      <div className="aspect-[2/1] md:aspect-[3/1] w-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-100/70 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-neutral-300" aria-hidden />
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      onScroll={onScroll}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {banners.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => open(b.link)}
          className={`group relative shrink-0 snap-start w-full aspect-[2/1] md:aspect-[3/1] overflow-hidden bg-neutral-100 ${b.link ? "cursor-pointer" : "cursor-default"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        </button>
      ))}
    </div>
  );
}
