import { useTranslations } from "next-intl";
import { Suspense } from "react";
import CardShell from "@/components/card-shell";
import ProfileFormLoader from "@/components/profile-form-loader";
import { leadClass, pageTitleClass, skeletonClass } from "@/lib/styles";

// Verified users without a nickname or city land here (see proxy.ts). The
// heading stays in the prerendered shell while the form waits for cookies.
export default function OnboardingPage() {
  const t = useTranslations("onboarding");

  return (
    <CardShell step={2}>
      <div className="flex flex-col gap-2">
        <h1 className={pageTitleClass}>{t("title")}</h1>
        <p className={leadClass}>{t("intro")}</p>
      </div>
      <Suspense fallback={<div className={`${skeletonClass} h-[36rem]`} />}>
        <ProfileFormLoader mode="onboarding" />
      </Suspense>
    </CardShell>
  );
}
