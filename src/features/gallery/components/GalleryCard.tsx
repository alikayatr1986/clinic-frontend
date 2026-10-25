"use client";

import { useTranslations } from "next-intl";
import { Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GalleryComparison } from "./GalleryComparison";
import {
  getProcedureLabel,
  getTimeframeLabel,
} from "../utils/gallery.utils";
import type {
  GalleryCaptionContent,
  GalleryPublicCase,
} from "../types/gallery.types";

export interface GalleryCardProps {
  item: GalleryPublicCase;
  caption?: GalleryCaptionContent;
  onEnlarge: (item: GalleryPublicCase) => void;
  priority?: boolean;
}

export function GalleryCard({
  item,
  caption,
  onEnlarge,
  priority = false,
}: GalleryCardProps) {
  const t = useTranslations("gallery");

  function getLabel(k: string) {
    return t(k as never);
  }

  const procedureLabel = getProcedureLabel(item.procedure_tag, getLabel);
  const timeframeLabel = getTimeframeLabel(item.timeframe_badge, getLabel);

  return (
    <article
      data-slot="gallery-card"
      data-testid="gallery-card"
      data-case-id={item.id}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-shadow hover:shadow-md"
    >
      <GalleryComparison
        item={item}
        caption={caption}
        variant="thumbnail"
        priority={priority}
      />

      <div className="flex flex-1 flex-col p-4 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {procedureLabel && (
            <Badge variant="secondary">{procedureLabel}</Badge>
          )}
          {timeframeLabel && (
            <Badge variant="outline">{timeframeLabel}</Badge>
          )}
        </div>

        {caption?.caption && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {caption.caption}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => onEnlarge(item)}
            aria-label={t("enlargeCase", { id: item.id })}
          >
            <Maximize2 aria-hidden="true" className="size-4 shrink-0" />
            <span>{t("enlarge")}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}