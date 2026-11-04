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
    // A segmented control: the picked language sits on a raised white pill.
    <div role="group" aria-label={t("label")} className="flex rounded-full bg-subtle p-1">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          disabled={pending}
          onClick={() => choose(locale)}
          className="h-10 flex-1 rounded-full px-4 text-sm font-medium text-ink-muted transition-[background-color,color,box-shadow] duration-150 hover:text-ink disabled:opacity-60 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card"
        >
          {NATIVE_NAMES[locale]}
        </button>
      ))}
    </div>
  );
}
