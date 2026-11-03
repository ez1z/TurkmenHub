// Tailwind class strings shared across pages, so one edit restyles them all.

// Small uppercase heading above a list, e.g. "Your city" or "Members".
export const sectionLabelClass =
  "text-xs font-semibold tracking-wide text-zinc-500 uppercase";

// Quiet inline link, e.g. "← All cities" or "Settings".
export const textLinkClass =
  "text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50";

// Bordered pill button. Callers add the height and padding.
export const outlineButtonClass =
  "rounded-full border border-black/[.08] text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]";
