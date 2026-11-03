import { Suspense } from "react";
import ProfileFormLoader from "@/components/profile-form-loader";

// Verified users without a nickname or city land here (see proxy.ts). The
// heading stays in the prerendered shell while the form waits for cookies.
export default function OnboardingPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-white p-8 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Set up your profile
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tell other Turkmens who you are and where you live.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          }
        >
          <ProfileFormLoader mode="onboarding" />
        </Suspense>
      </main>
    </div>
  );
}
