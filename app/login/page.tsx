import { Suspense } from "react";
import GoogleSignInButton from "@/components/google-sign-in-button";

// searchParams is request-time data, so it renders inside Suspense while the
// rest of the page stays in the prerendered shell.
async function CallbackError({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;

  if (error !== "oauth") {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      Sign-in failed. Please try again.
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-white p-8 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Sign in
        </h1>
        <Suspense>
          <CallbackError searchParams={searchParams} />
        </Suspense>
        <GoogleSignInButton />
      </main>
    </div>
  );
}
