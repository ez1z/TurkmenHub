import SiteFooter from "@/components/site-footer";

// The layout for single-purpose pages (sign-in, invite, onboarding,
// settings, rules, privacy): one card in the middle of the screen.
export default function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans sm:py-8 dark:bg-black">
      <main className="flex w-full max-w-sm flex-col gap-6 bg-white p-8 sm:rounded-2xl dark:bg-zinc-950">
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
