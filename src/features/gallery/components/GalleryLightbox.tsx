"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProcedures } from "@/features/procedures/hooks/useProcedures";
import { Badge } from "@/components/ui/badge";
import { GalleryComparison } from "./GalleryComparison";
import {
  getTimeframeLabel,
} from "../utils/gallery.utils";
import type {
  GalleryCaptionContent,
  GalleryPublicCase,
} from "../types/gallery.types";

export interface GalleryLightboxProps {
  item: GalleryPublicCase | null;
  caption?: GalleryCaptionContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GalleryLightbox({
  item,
  caption,
  open,
  onOpenChange,
}: GalleryLightboxProps) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const { procedures } = useProcedures();

  if (!item) {
    return null;
  }

  function getLabel(k: string) {
    return t(k as never);
  }

  const procedure = procedures.find((p) => p.code === item.procedure_tag);
  const procedureLabel = procedure ? (locale === "ar" ? procedure.ar : procedure.en) : item.procedure_tag;
  const timeframeLabel = getTimeframeLabel(item.timeframe_badge, getLabel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {caption?.alt_text || t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <GalleryComparison item={item} caption={caption} priority />

          <div className="flex flex-wrap items-center gap-2">
            {procedureLabel && (
              <Badge variant="secondary">{procedureLabel}</Badge>
            )}
            {timeframeLabel && (
              <Badge variant="outline">{timeframeLabel}</Badge>
            )}
          </div>

          {caption?.caption && (
            <p className="text-sm text-muted-foreground">{caption.caption}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}