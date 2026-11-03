import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed middleware.ts to proxy.ts. Runs before every matched
// request to keep the Supabase session fresh, to send users who haven't
// finished signing up to /welcome, /invite or /onboarding, and to pick the
// language (see i18n/routing.ts).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals, Vercel's own endpoints and static assets. The
    // PWA files must load for signed-out visitors too, or the app can't be
    // installed from the sign-in page.
    "/((?!_next/static|_next/image|_vercel|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
