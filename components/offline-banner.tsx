"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOffline } from "next/offline";

// Shown on every page while the network is down. Next.js holds navigations
// and saves until it's back (experimental.useOffline), so this explains why
// nothing seems to happen. It floats at the bottom so it never covers the
// sticky top bar.
export default function OfflineBanner() {
  const isOffline = useOffline();
  const t = useTranslations("offline");

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <p className="flex max-w-md items-start gap-2.5 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn-ink shadow-xl">
        <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {t("banner")}
      </p>
    </div>
  );
}
