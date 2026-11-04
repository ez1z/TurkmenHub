import { useTranslations } from "next-intl";
import Link from "next/link";
import { textLinkClass } from "@/lib/styles";

// Rules and privacy, reachable from every page, signed in or not.
export default function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="flex flex-col items-center gap-4 px-4 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <span aria-hidden="true" className="carpet-band h-2.5 w-24 bg-line" />
      <nav className="flex gap-5">
        <Link href="/rules" className={textLinkClass}>
          {t("rules")}
        </Link>
        <Link href="/privacy" className={textLinkClass}>
          {t("privacy")}
        </Link>
      </nav>
    </footer>
  );
}
