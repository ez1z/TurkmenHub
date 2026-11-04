import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { leadClass, pageTitleClass, primaryButtonClass } from "@/lib/styles";

// A dead link: a city that doesn't exist, or a member who is hidden, blocked
// or deleted. Deliberately the same message for all of them, so a 404 can't
// tell someone whether a member blocked them or left.
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <PageShell>
      <div className="flex flex-col items-center gap-5 pt-10 text-center">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-subtle text-ink-muted"
        >
          <SearchX className="h-7 w-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className={pageTitleClass}>{t("title")}</h1>
          <p className={`${leadClass} max-w-xs`}>{t("body")}</p>
        </div>
      </div>
      <Link href="/" className={primaryButtonClass}>
        {t("home")}
      </Link>
    </PageShell>
  );
}
