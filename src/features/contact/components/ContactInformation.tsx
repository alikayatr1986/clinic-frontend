import { useTranslations } from "next-intl";
import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactInformationProps } from "@/features/contact/types/contact.types";

export function ContactInformation({ config, locale }: ContactInformationProps) {
  const t = useTranslations("contact");
  const information = [
    config.address && {
      Icon: MapPin,
      labelKey: "location" as const,
      value: config.address[locale],
    },
    config.phone && {
      Icon: Phone,
      labelKey: "publicPhone" as const,
      value: config.phone,
      href: `tel:${config.phone}`,
    },
    config.email && {
      Icon: Mail,
      labelKey: "publicEmail" as const,
      value: config.email,
      href: `mailto:${config.email}`,
    },
  ].filter(Boolean);

  return (
    <>
        {(config.whatsapp || config.telegram) && (
          <div className="min-w-0 rounded-2xl border border-border/50 bg-card p-5 shadow-sm lg:col-start-1 lg:row-start-3">
            <h3 className="text-xl font-semibold">{t("directTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("directHelp")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["whatsapp", "telegram"] as const).map(
                (method) =>
                  config[method] && (
                    <a
                      key={method}
                      href={config[method]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-16 min-w-0 items-center justify-center rounded-lg border border-border p-4 text-center font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {t(`direct.${method}`)}
                      <span className="sr-only"> {t("newWindow")}</span>
                    </a>
                  ),
              )}
            </div>
          </div>
        )}
        {information.length > 0 && (
          <div className="grid min-w-0 gap-6 rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:grid-cols-3 lg:col-start-1 lg:row-start-4">
            {information.map(
              (item) =>
                item && (
                  <div key={item.labelKey} className="min-w-0 text-center">
                    <item.Icon
                      aria-hidden="true"
                      className="mx-auto mb-3 size-6 text-primary"
                    />
                    <h3 className="text-sm font-semibold">
                      {t(item.labelKey)}
                    </h3>
                    <p className="mt-2 break-words text-sm text-muted-foreground">
                      {item.href ? (
                        <a
                          href={item.href}
                          dir="ltr"
                          className="underline underline-offset-4"
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                ),
            )}
          </div>
        )}
    </>
  );
}
