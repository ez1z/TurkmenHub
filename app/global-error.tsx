"use client";

import "./globals.css";

// Only when the root layout itself fails, which also takes the translations
// down with it, so this page is static and in both languages.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="tk">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-black">
        <main className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Näsazlyk ýüze çykdy
          </h1>
          <p lang="en" className="text-sm text-zinc-600 dark:text-zinc-400">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background"
          >
            Täzeden synanyş · Try again
          </button>
        </main>
      </body>
    </html>
  );
}
