"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useOffline } from "next/offline";
import { outlineButtonClass, primaryButtonClass } from "@/lib/styles";

// A page failed to render, e.g. the database didn't answer. The layout is
// still there, so this can be translated. Offline gets its own message,
// since trying again won't help until the connection is back.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");
  const isOffline = useOffline();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-6 bg-white px-4 py-6 sm:my-8 sm:rounded-2xl sm:p-8 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {isOffline ? t("offlineTitle") : t("title")}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isOffline ? t("offlineBody") : t("body")}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={reset} className={primaryButtonClass}>
            {t("retry")}
          </button>
          <Link href="/" className={`flex h-12 w-full items-center justify-center ${outlineButtonClass}`}>
            {t("home")}
          </Link>
        </div>
      </main>
    </div>
  );
}
