import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// The steps a user goes through before they can use the app, in order.
const WELCOME = "/welcome";
const INVITE = "/invite";
const ONBOARDING = "/onboarding";
const STEPS = [WELCOME, INVITE, ONBOARDING];

// Refreshes the Supabase auth session and forwards the updated cookies to
// both Server Components (via the request) and the browser (via the response).
// Then routes the user to the step they're on: logged-out users to /welcome,
// unverified users to /invite, and users without a finished profile to
// /onboarding. This is only for navigation; RLS is what protects the data.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // No-cache headers so a CDN never serves one user's session
          // cookies to another user.
          cacheHeaders = headers;
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Don't run code between createServerClient and getClaims(): it verifies the
  // JWT and refreshes an expired session. Skipping it causes random sign-outs.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  const { pathname } = request.nextUrl;

  // The OAuth callback is how a user signs in, so it must run for everyone.
  if (pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  // A redirect is a new response, so it has to carry over the refreshed
  // session cookies and cache headers, or the user gets signed out.
  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  }

  let step: string | null = WELCOME;

  if (userId) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("verified_at, nickname, city_id")
      .eq("id", userId)
      .maybeSingle();

    // Don't bounce verified members to /invite because of a network blip.
    // RLS still keeps an unverified user from reading anything.
    if (error) {
      return supabaseResponse;
    }

    if (!profile?.verified_at) {
      step = INVITE;
    } else if (!profile.nickname || profile.city_id === null) {
      // Nickname and city are the required profile fields.
      step = ONBOARDING;
    } else {
      step = null;
    }
  }

  if (step && pathname !== step) {
    return redirectTo(step);
  }

  // Finished users have no reason to see the setup steps again.
  if (!step && STEPS.includes(pathname)) {
    return redirectTo("/");
  }

  // Always return supabaseResponse. If you build a different response, copy
  // its cookies and cache headers over, or the refreshed session is lost.
  return supabaseResponse;
}
