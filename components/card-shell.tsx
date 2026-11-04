import { useTranslations } from "next-intl";
import { Wordmark } from "@/components/brand-mark";
import SiteFooter from "@/components/site-footer";

const STEPS = 2;

// The layout for the sign-up flow (sign-in, invite, onboarding): one column,
// a card from sm up. Invite and onboarding are steps 1 and 2, and say so.
export default function CardShell({
  children,
  step,
}: {
  children: React.ReactNode;
  step?: number;
}) {
  const t = useTranslations("flow");

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-8 pb-12 sm:pt-16">
        <div className="flex flex-col gap-8 sm:rounded-3xl sm:border sm:border-line sm:bg-surface sm:p-10 sm:shadow-card">
          {step && (
            <div className="flex items-center justify-between gap-4">
              <Wordmark />
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-ink-muted">
                  {t("step", { current: step, total: STEPS })}
                </span>
                <span aria-hidden="true" className="flex gap-1">
                  {Array.from({ length: STEPS }, (_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index < step ? "w-5 bg-brand" : "w-1.5 bg-line"
                      }`}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
