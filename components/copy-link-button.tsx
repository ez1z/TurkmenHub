"use client";

import { Check, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { outlineButtonClass } from "@/lib/styles";

// Copies a link to a page in the app, like /city/kuala-lumpur, as a full URL
// on whatever host the app is running on.
export default function CopyLinkButton({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const t = useTranslations("copyLink");
  const [copied, setCopied] = useState(false);
  // Each copy restarts the 2s "Copied" window, so a second click doesn't get
  // reset early by the first click's timer.
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, location.origin).href);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the address bar has the same link.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`h-10 px-4 ${outlineButtonClass} ${copied ? "border-brand text-brand-ink" : ""}`}
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Link2 aria-hidden="true" className="h-4 w-4" />
      )}
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}
