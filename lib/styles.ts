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

// Full-width main action of a form or page.
export const primaryButtonClass =
  "flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]";

// For actions that can't be undone: block, delete account.
export const dangerButtonClass =
  "flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";

export const errorTextClass = "text-sm text-red-600 dark:text-red-400";
