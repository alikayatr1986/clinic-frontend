import { useTranslations } from "next-intl";

export default function BlogLoading() {
  const t = useTranslations("blogs");
  return (
    <div
      role="status"
      className="mx-auto grid max-w-7xl animate-pulse gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8"
    >
      <span className="sr-only">{t("loading")}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-[4/5] rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
