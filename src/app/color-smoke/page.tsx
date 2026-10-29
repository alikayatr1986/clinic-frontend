import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { ColorSmokeHeroCtaProps } from "@/types/color-smoke.types";

async function HeroCta({ locale }: ColorSmokeHeroCtaProps) {
  const t = await getTranslations({ locale, namespace: "colorSmoke" });
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <section
      dir={dir}
      lang={locale}
      aria-label={t("previewLabel")}
      className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm border-border"
    >
      <h2 className="text-2xl font-bold text-midnight-900 dark:text-linen">
        {t("heroHeading")}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {t("heroDescription")}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <a href="#consult">{t("consultation")}</a>
        </Button>
        <Button asChild variant="outline">
          <a href="#club">{t("club")}</a>
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="inline-flex size-2 rounded-full bg-primary" aria-hidden />
        {t("trust")}
      </div>
    </section>
  );
}

export default async function ColorSmokePage() {
  const t = await getTranslations("colorSmoke");
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <header>
          <h1 className="text-3xl font-bold text-midnight-900 dark:text-linen">
            {t("heading")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("description")}
          </p>
        </header>

        <section aria-label={t("lightLabel")} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("lightHeading")}</h2>
          <HeroCta locale="en" />
          <HeroCta locale="ar" />
        </section>

        <section
          aria-label={t("darkLabel")}
          className="dark rounded-xl bg-midnight-900 p-6"
        >
          <h2 className="text-lg font-semibold text-linen">{t("darkHeading")}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {t("darkDescription")}
          </p>
          <div className="mt-4 flex flex-col gap-4 rounded-lg bg-background p-4">
            <HeroCta locale="en" />
            <HeroCta locale="ar" />
          </div>
        </section>

        <section
          aria-label={t("swatchesLabel")}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <div className="rounded-lg bg-midnight-950 p-4 text-linen">midnight-950</div>
          <div className="rounded-lg bg-crimson-600 p-4 text-white">crimson-600</div>
          <div className="rounded-lg bg-linen p-4 text-midnight-900 border border-border">
            linen
          </div>
          <div className="rounded-lg bg-muted p-4 text-slate-500">slate-500</div>
        </section>
      </div>
    </main>
  );
}
