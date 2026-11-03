import { useTranslations } from "next-intl";
import Link from "next/link";
import { textLinkClass } from "@/lib/styles";

// Rules and privacy, reachable from every page, signed in or not.
export default function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto flex justify-center gap-4 border-t border-black/[.08] pt-4 dark:border-white/[.145]">
      <Link href="/rules" className={textLinkClass}>
        {t("rules")}
      </Link>
      <Link href="/privacy" className={textLinkClass}>
        {t("privacy")}
      </Link>
    </footer>
  );
}
