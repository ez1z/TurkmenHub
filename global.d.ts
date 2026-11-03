import type { routing } from "@/i18n/routing";
import type messages from "@/messages/en.json";

// Typed locales and message keys: a typo in t("...") fails the type check,
// and tk.json is checked against en.json's shape by the same keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
