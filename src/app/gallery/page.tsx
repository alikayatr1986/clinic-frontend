import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GalleryBrowser } from "@/features/gallery/components/GalleryBrowser";
import {
  GALLERY_CTA_HREF,
  GALLERY_NAV_ITEMS,
} from "@/features/gallery/constants/gallery.constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gallery");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function GalleryPage() {
  return (
    <>
      <SiteHeader
        items={GALLERY_NAV_ITEMS}
        ctaHref={GALLERY_CTA_HREF}
        activePath="/gallery"
      />
      <main id="main-content" className="flex-1 pt-24 pb-16 lg:pt-32">
        <Suspense fallback={null}>
          <GalleryBrowser />
        </Suspense>
      </main>
    </>
  );
}

