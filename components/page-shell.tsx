import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Wordmark } from "@/components/brand-mark";
import SiteFooter from "@/components/site-footer";

// "← All cities" in the top bar.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 flex h-11 min-w-0 items-center gap-1.5 rounded-full pr-3 pl-2 text-sm font-medium text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
    >
      <ArrowLeft aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

// The layout for in-app pages (home, city, member, settings, rules,
// privacy): a sticky top bar, then one centred column. The bar shows the
// logo on home, or a <BackLink> on pages one level down.
export default function PageShell({
  children,
  back,
  action,
}: {
  children: React.ReactNode;
  back?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line/60 bg-canvas/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-3 px-4">
          {back ?? (
            <Link href="/" className="-ml-1 rounded-lg p-1">
              <Wordmark />
            </Link>
          )}
          {action}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 pt-6 pb-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
