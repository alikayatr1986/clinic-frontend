"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { BlogCover as BlogCoverData } from "@/features/blogs/types/blogs.types";

interface BlogCoverProps {
  cover?: BlogCoverData | null;
  className?: string;
}

/** Cropped cover with a stable-ratio neutral placeholder when missing or broken. */
export function BlogCover({ cover, className }: BlogCoverProps) {
  const [broken, setBroken] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {cover && !broken ? (
        // Gated derivative URLs must bypass the image optimizer cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.url}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          loading="lazy"
          onError={() => setBroken(true)}
          style={{
            objectPosition: `${cover.focal_point.x * 100}% ${cover.focal_point.y * 100}%`,
          }}
          className="size-full object-cover"
        />
      ) : null}
    </div>
  );
}
