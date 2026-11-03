"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { outlineButtonClass } from "@/lib/styles";

export default function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const t = useTranslations("invites");
  const [copied, setCopied] = useState(false);
  // Each copy restarts the 2s "Copied" window, so a second click doesn't get
  // reset early by the first click's timer.
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the code is on screen to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`h-8 px-3 ${outlineButtonClass}`}
    >
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}
