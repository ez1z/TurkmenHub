import { createServerClient } from "@supabase/ssr";
import { io } from "next/cache";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Supabase client for Server Components, Server Functions and Route Handlers.
// Create a new client per request; never share one across requests.
export async function createClient() {
  const cookieStore = await cookies();
  // Supabase auth checks token expiry with Date.now(), which Cache Components
  // won't allow during prerendering. io() keeps the code that follows out of
  // the prerender, and resolves right away in actions and route handlers.
  await io();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. This is safe to ignore
            // because the proxy refreshes the session on every request.
          }
        },
      },
    },
  );
}
