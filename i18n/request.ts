import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "@/i18n/routing";

// The locale comes from the [locale] segment, which is known while
// prerendering, so translated pages keep their static shells. An explicit
// locale (getTranslations({ locale })) wins, for code outside that segment.
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const param = await rootParams.locale();
    // [locale] also catches unknown paths like /favicon.txt.
    if (!hasLocale(routing.locales, param)) {
      notFound();
    }
    locale = param;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
