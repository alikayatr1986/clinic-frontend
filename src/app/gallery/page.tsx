import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { absoluteUrl } from "@/features/blogs/utils/blogs-metadata.utils";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GalleryBrowser } from "@/features/gallery/components/GalleryBrowser";
import {
  GALLERY_CTA_HREF,
  GALLERY_NAV_ITEMS,
} from "@/features/gallery/constants/gallery.constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gallery");
  const title = t("pageTitle");
  const description = t("pageDescription");
  const canonical = absoluteUrl("/gallery");
  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    openGraph: { type: "website", title, description, ...(canonical && { url: canonical }) },
    twitter: { card: "summary", title, description },
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

