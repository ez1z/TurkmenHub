import { Wordmark } from "@/components/brand-mark";
import SiteFooter from "@/components/site-footer";

// The layout for the sign-up flow (sign-in, onboarding): one column, a card
// from sm up. Onboarding has the wordmark on top; the welcome page has its
// own, bigger brand.
export default function CardShell({
  children,
  wordmark = false,
}: {
  children: React.ReactNode;
  wordmark?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-8 pb-12 sm:pt-16">
        <div className="flex flex-col gap-8 sm:rounded-3xl sm:border sm:border-line sm:bg-surface sm:p-10 sm:shadow-card">
          {wordmark && <Wordmark />}
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
