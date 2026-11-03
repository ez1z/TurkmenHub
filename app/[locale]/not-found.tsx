import { useTranslations } from "next-intl";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { primaryButtonClass } from "@/lib/styles";

// A dead link: a city that doesn't exist, or a member who is hidden, blocked
// or deleted. Deliberately the same message for all of them, so a 404 can't
// tell someone whether a member blocked them or left.
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <PageShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("body")}</p>
      </div>
      <Link href="/" className={primaryButtonClass}>
        {t("home")}
      </Link>
    </PageShell>
  );
}
