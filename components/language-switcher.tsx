"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { setLocale } from "@/lib/account-actions";

// Each language names itself, so someone who can't read the current one can
// still find theirs.
const NATIVE_NAMES: Record<Locale, string> = { tk: "Türkmençe", en: "English" };

// Saves the choice in a cookie (and on the profile when signed in), then
// reloads: the proxy picks the language per request, and a full load also
// drops pages the router cached in the old one.
export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) {
      return;
    }
    startTransition(async () => {
      await setLocale(locale);
      window.location.reload();
    });
  }

  return (
    <div role="group" aria-label={t("label")} className="flex rounded-full border border-black/[.08] p-1 dark:border-white/[.145]">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          disabled={pending}
          onClick={() => choose(locale)}
          className="h-9 flex-1 rounded-full px-4 text-sm font-medium text-zinc-600 transition-colors aria-pressed:bg-foreground aria-pressed:text-background disabled:opacity-60 dark:text-zinc-400"
        >
          {NATIVE_NAMES[locale]}
        </button>
      ))}
    </div>
  );
}
