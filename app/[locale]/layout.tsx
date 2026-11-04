import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import OfflineBanner from "@/components/offline-banner";
import ServiceWorker from "@/components/service-worker";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Turkmen needs latin-ext for ş, ň, ž, ý and ä.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

// Headings and big numbers. SOFT rounds the serifs (see font-display in
// globals.css); opsz keeps large titles from looking heavy.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "opsz"],
});

// One prerendered shell per language (Cache Components needs at least one).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("title"),
    description: t("description"),
    // Opened from the iPhone home screen, run full screen like an app.
    appleWebApp: { capable: true, title: "TurkmenHub", statusBarStyle: "default" },
  };
}

// Matches the page background (--canvas in globals.css), so the browser bar
// and an installed app's status bar blend in.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-ink">
        {/* Inherits the locale and messages from i18n/request.ts. */}
        <NextIntlClientProvider>
          <OfflineBanner />
          {children}
        </NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
