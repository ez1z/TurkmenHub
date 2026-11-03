"use client";

import { useTranslations } from "next-intl";
import { useOffline } from "next/offline";

// Shown on every page while the network is down. Next.js holds navigations
// and saves until it's back (experimental.useOffline), so this explains why
// nothing seems to happen.
export default function OfflineBanner() {
  const isOffline = useOffline();
  const t = useTranslations("offline");

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-20 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      {t("banner")}
    </div>
  );
}
