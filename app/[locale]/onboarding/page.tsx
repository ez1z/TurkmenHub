import { useTranslations } from "next-intl";
import { Suspense } from "react";
import CardShell from "@/components/card-shell";
import ProfileFormLoader from "@/components/profile-form-loader";

// Verified users without a nickname or city land here (see proxy.ts). The
// heading stays in the prerendered shell while the form waits for cookies.
export default function OnboardingPage() {
  const t = useTranslations("onboarding");

  return (
    <CardShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>
      </div>
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <ProfileFormLoader mode="onboarding" />
      </Suspense>
    </CardShell>
  );
}
