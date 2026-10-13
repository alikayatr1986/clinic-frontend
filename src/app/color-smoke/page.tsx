import { cn } from "@/lib/utils";

const primaryCta =
  "inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-crimson-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ghostCta =
  "inline-flex min-h-[48px] items-center justify-center rounded-full border px-6 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function HeroCta({ dir }: { dir: "ltr" | "rtl" }) {
  const isRtl = dir === "rtl";
  return (
    <section
      dir={dir}
      lang={isRtl ? "ar" : "en"}
      aria-label={isRtl ? "AR hero spot check" : "EN hero spot check"}
      className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm border-border"
    >
      <h2 className="text-2xl font-bold text-midnight-900 dark:text-linen">
        {isRtl ? "احجز استشارتك المجانية" : "Book your free consultation"}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {isRtl
          ? "استشارة فيديو مجانية مع جراح متخصص."
          : "A free video assessment with a specialist surgeon."}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a href="#consult" className={cn(primaryCta, "border border-transparent")}>
          {isRtl ? "احجز الاستشارة" : "Book consultation"}
        </a>
        <a
          href="#club"
          className={cn(
            ghostCta,
            "border-midnight-900/20 text-midnight-900 dark:border-white/20 dark:text-white",
          )}
        >
          {isRtl ? "نادي الخصومات" : "Discount Club"}
        </a>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="inline-flex size-2 rounded-full bg-primary" aria-hidden />
        {isRtl ? "شريط الثقة: شهادات حقيقية" : "Trust bar: real credentials"}
      </div>
    </section>
  );
}

export default function ColorSmokePage() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <header>
          <h1 className="text-3xl font-bold text-midnight-900 dark:text-linen">
            Color system smoke test
          </h1>
          <p className="mt-2 text-muted-foreground">
            Proves bg-background, bg-primary, bg-card + border-border in light
            and .dark, plus EN/AR hue parity. No hardcoded hex in TSX.
          </p>
        </header>

        <section aria-label="Light mode tokens" className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Light — :root</h2>
          <HeroCta dir="ltr" />
          <HeroCta dir="rtl" />
        </section>

        <section
          aria-label="Dark mode tokens"
          className="dark rounded-xl bg-midnight-900 p-6"
        >
          <h2 className="text-lg font-semibold text-linen">Dark — .dark flip</h2>
          <p className="mt-1 text-sm text-slate-400">
            Wrapped in .dark so --background, --card, --primary resolve to navy
            canvas with brightened crimson CTA.
          </p>
          <div className="mt-4 flex flex-col gap-4 rounded-lg bg-background p-4">
            <HeroCta dir="ltr" />
            <HeroCta dir="rtl" />
          </div>
        </section>

        <section
          aria-label="Brand scale swatches"
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
