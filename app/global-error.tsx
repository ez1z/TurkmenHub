"use client";

import "./globals.css";

// Only when the root layout itself fails, which also takes the translations
// and fonts down with it, so this page is static and in both languages. The
// colour tokens still work: they come from globals.css, not the layout.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="tk">
      <body className="flex min-h-screen items-center justify-center bg-canvas p-5 font-sans text-ink">
        <main className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-line bg-surface p-8 shadow-card">
          <h1 className="text-2xl font-semibold tracking-tight">Näsazlyk ýüze çykdy</h1>
          <p lang="en" className="text-sm leading-relaxed text-ink-muted">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand px-5 font-medium text-on-brand"
          >
            Täzeden synanyş · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
