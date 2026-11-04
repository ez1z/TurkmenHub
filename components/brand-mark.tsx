// The TurkmenHub mark: a simplified carpet gül, an octagon medallion with a
// diamond cut out of it and a red diamond at the heart. Decorative, so it's
// hidden from screen readers; the wordmark next to it carries the name.
export default function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        fill="var(--brand)"
        fillRule="evenodd"
        d="M10 2h12l8 8v12l-8 8H10l-8-8V10zm6 5l-9 9 9 9 9-9z"
      />
      <path fill="var(--accent)" d="M16 11.5l4.5 4.5-4.5 4.5-4.5-4.5z" />
    </svg>
  );
}

// Mark plus name, for headers.
export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <BrandMark />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        TurkmenHub
      </span>
    </span>
  );
}
