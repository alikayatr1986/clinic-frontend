import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { absoluteUrl } from "@/features/blogs/utils/blogs-metadata.utils";
import { LandingPage } from "@/features/landing/components/LandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const title = t("title");
  const description = t("description");
  const canonical = absoluteUrl("/");
  return {
    ...(canonical && { alternates: { canonical } }),
    openGraph: { type: "website", title, description, ...(canonical && { url: canonical }) },
  };
}

export default function Home() {
  return <LandingPage />;
}
