import Link from "next/link";
import { Suspense } from "react";
import ProfileFormLoader from "@/components/profile-form-loader";

// Only members with a finished profile get here (see proxy.ts).
export default function SettingsPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-white p-8 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Settings
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Edit your profile and choose who can see you and reach you.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          }
        >
          <ProfileFormLoader mode="settings" />
        </Suspense>
      </main>
    </div>
  );
}
