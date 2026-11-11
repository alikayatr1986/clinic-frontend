import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { FOOTER_CONSTANTS } from "@/features/footer/constants/footer.constants";
import type { SocialLinkProps, SocialLinksProps } from "@/features/footer/types/footer.types";
import { cn } from "@/lib/utils";

function SocialLink({ href, channel }: SocialLinkProps) {
  const t = useTranslations("footer");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-12 flex-1 items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-4",
        "text-base font-medium text-linen transition-colors motion-reduce:transition-none",
        "hover:border-white/25 hover:bg-white/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <Image
        {...FOOTER_CONSTANTS.channelIcons[channel]}
        alt=""
        aria-hidden="true"
        className={cn("size-5 shrink-0", channel === "instagram" && "object-cover")}
      />
      <span className="min-w-0 flex-1">{t(channel)}</span>
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
      <span className="sr-only"> {t("opensInNewTab")}</span>
    </a>
  );
}

export function SocialLinks({ instagram, whatsapp, telegram, layout }: SocialLinksProps) {
  if (!instagram && !whatsapp && !telegram) return null;

  return (
    <div className={layout === "desktop"
      ? "mt-6 flex flex-wrap gap-3"
      : "mt-6 grid max-w-[528px] grid-cols-1 gap-3 min-[360px]:grid-cols-2 min-[360px]:[&>a:nth-child(3):last-child]:col-span-2 min-[360px]:[&>a:nth-child(3):last-child]:w-[calc((100%-0.75rem)/2)] min-[360px]:[&>a:nth-child(3):last-child]:justify-self-center"}>
      {instagram && <SocialLink href={instagram} channel="instagram" />}
      {whatsapp && <SocialLink href={whatsapp} channel="whatsapp" />}
      {telegram && <SocialLink href={telegram} channel="telegram" />}
    </div>
  );
}
