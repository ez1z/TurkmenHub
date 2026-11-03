import SiteFooter from "@/components/site-footer";

// The layout for in-app pages (home, city, member): full width on a phone, a
// card on larger screens.
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-6 bg-white px-4 py-6 sm:my-8 sm:rounded-2xl sm:p-8 dark:bg-zinc-950">
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
