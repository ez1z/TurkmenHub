import { defineRouting } from "next-intl/routing";

// The language picked on this browser. Kept for a year, not just the
// session, so the choice survives a browser restart.
export const LOCALE_COOKIE = { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365 };

// URLs never carry the locale, so a shared /city/kuala-lumpur link works for
// everyone. The proxy rewrites each request to /tk/... or /en/... internally
// (from the NEXT_LOCALE cookie, else the browser's languages), which gives
// every page a prerendered shell per language.
export const routing = defineRouting({
  locales: ["tk", "en"],
  defaultLocale: "tk",
  localePrefix: "never",
  localeCookie: LOCALE_COOKIE,
});

export type Locale = (typeof routing.locales)[number];
