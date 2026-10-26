import InviteForm from "@/components/invite-form";

// Unverified users land here (see proxy.ts) until they redeem an invite code.
export default function InvitePage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-white p-8 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Enter your invite code
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            TurkmenHub is invite-only. Ask a member for a code.
          </p>
        </div>
        <InviteForm />
      </main>
    </div>
  );
}
