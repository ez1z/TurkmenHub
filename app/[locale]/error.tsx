"use client";

import { CircleAlert, RotateCcw, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useOffline } from "next/offline";
import {
  leadClass,
  outlineButtonClass,
  pageTitleClass,
  primaryButtonClass,
} from "@/lib/styles";

// A page failed to render, e.g. the database didn't answer. The layout is
// still there, so this can be translated. Offline gets its own message,
// since trying again won't help until the connection is back.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("error");
  const isOffline = useOffline();
  const Icon = isOffline ? WifiOff : CircleAlert;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-20 pb-12">
      <div className="flex flex-col items-center gap-5 text-center">
        <span
          aria-hidden="true"
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
            isOffline ? "bg-warn-soft text-warn-ink" : "bg-danger-soft text-danger"
          }`}
        >
          <Icon className="h-7 w-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className={pageTitleClass}>
            {isOffline ? t("offlineTitle") : t("title")}
          </h1>
          <p className={leadClass}>{isOffline ? t("offlineBody") : t("body")}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={reset} className={primaryButtonClass}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t("retry")}
        </button>
        <Link href="/" className={`h-12 w-full text-base ${outlineButtonClass}`}>
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
