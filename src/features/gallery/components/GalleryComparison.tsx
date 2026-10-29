import Image from "next/image";
import { useTranslations } from "next-intl";
import type { GalleryComparisonProps } from "../types/gallery.types";

export function GalleryComparison({
  item,
  caption,
  priority = false,
  variant = "featured",
  className = "",
}: GalleryComparisonProps) {
  const t = useTranslations("gallery");
  const isBeforeLeft = item.before_position === "left";
  const altText = caption?.alt_text?.trim() || t("defaultAlt");

  const isThumbnail = variant === "thumbnail";

  return (
    <div
      data-testid="gallery-comparison"
      data-case-id={item.id}
      data-before-position={item.before_position}
      className={`relative isolate overflow-hidden rounded-2xl bg-neutral-900/5 border border-border/60 ${className}`}
    >
      <div className="relative w-full overflow-hidden flex items-center justify-center">
        <Image
          src={isThumbnail && item.thumbnail_url ? item.thumbnail_url : item.url}
          alt={altText}
          width={item.width || 1200}
          height={item.height || 800}
          unoptimized
          loading={priority ? undefined : "lazy"}
          priority={priority}
          className="h-auto w-full max-h-[540px] object-contain"
        />

        {/* Physical Before and After overlays */}
        {/* We use physical CSS left / right so labels do NOT mirror in RTL */}
        <span
          data-testid="overlay-before"
          className={`absolute bottom-3 z-10 select-none rounded bg-black/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs shadow-xs ${
            isBeforeLeft ? "left-3" : "right-3"
          }`}
        >
          {t("before")}
        </span>
        <span
          data-testid="overlay-after"
          className={`absolute bottom-3 z-10 select-none rounded bg-black/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs shadow-xs ${
            isBeforeLeft ? "right-3" : "left-3"
          }`}
        >
          {t("after")}
        </span>
      </div>
    </div>
  );
}

