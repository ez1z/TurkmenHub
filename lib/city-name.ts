import type { Locale } from "@/i18n/routing";

// Cities are stored with an English and a Turkmen name: "Istanbul" and
// "Stambul". Show the one that matches the page's language.
export function cityName(
  city: { name_en: string; name_tk: string },
  locale: Locale | string,
) {
  return locale === "tk" ? city.name_tk : city.name_en;
}
