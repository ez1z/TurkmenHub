import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components. Session cookies are read and
// written via document.cookie, so it stays in sync with the server clients.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
