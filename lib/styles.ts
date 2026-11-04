// Tailwind class strings shared across pages, so one edit restyles them all.
// Colours are the semantic tokens from app/globals.css, which already switch
// for dark mode, so nothing here needs a dark: variant.

// Big serif page title.
export const pageTitleClass =
  "font-display text-3xl font-semibold tracking-tight text-ink text-balance";

// The sentence under a page title.
export const leadClass = "text-[15px] leading-relaxed text-ink-muted text-pretty";

// Small uppercase heading above a list, e.g. "Your city" or "Members".
export const sectionLabelClass =
  "flex items-center gap-1.5 px-1 text-xs font-semibold tracking-wider text-ink-muted uppercase";

// A white panel on the ivory page.
export const cardClass = "rounded-2xl border border-line bg-surface shadow-card";

// Quiet inline link, e.g. "Rules" in the footer.
export const textLinkClass =
  "text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline";

// Pressed buttons shrink a touch, so a tap always visibly lands.
const pressClass =
  "transition-[background-color,border-color,color,scale] duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

// Full-width main action of a form or page. One per screen.
export const primaryButtonClass = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 font-medium text-on-brand hover:bg-brand-strong ${pressClass}`;

// Bordered pill button. Callers add the height and padding.
export const outlineButtonClass = `inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-medium text-ink hover:border-ink-subtle hover:bg-subtle ${pressClass}`;

// Text-only button for minor actions, e.g. Report or Block.
export const ghostButtonClass = `inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium text-ink-muted hover:bg-subtle hover:text-ink ${pressClass}`;

// For actions that can't be undone: block, delete account.
export const dangerButtonClass = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-danger px-5 font-medium text-on-danger hover:opacity-90 ${pressClass}`;

// Text inputs and textareas. Callers add the height or padding.
export const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-150 hover:border-ink-subtle focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none aria-invalid:border-danger aria-invalid:focus:ring-danger/15 disabled:opacity-60";

export const labelClass = "text-sm font-medium text-ink";
export const hintClass = "text-sm text-ink-muted";
export const errorTextClass = "text-sm text-danger";

// A tinted note: what others see of your profile, a deleted account, etc.
export const noteClass = "flex gap-3 rounded-2xl bg-subtle p-4 text-sm leading-relaxed text-ink-muted";

// Loading placeholder for a Suspense boundary. Callers add the height.
export const skeletonClass = "animate-pulse rounded-2xl bg-subtle motion-reduce:animate-none";
