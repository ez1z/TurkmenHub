import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  isReturnPath,
  RETURN_TO_COOKIE,
  RETURN_TO_MAX_AGE,
} from "@/lib/return-to";
import type { Database } from "@/types/database";

// The steps a user goes through before they can use the app, in order.
const WELCOME = "/welcome";
const INVITE = "/invite";
const ONBOARDING = "/onboarding";
const STEPS = [WELCOME, INVITE, ONBOARDING];

const CITY_PAGE = /^\/city\/([^/]+)$/;
const MEMBER_PAGE = /^\/member\/([^/]+)$/;
// Anything else can't match a row, so it's not found without a query.
const SLUG = /^[a-z0-9-]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Whether a city or member page has anything to show this viewer. Same RLS
// as the page itself, so a hidden or blocked member is missing here too.
// Other paths always count as existing; on a lookup error, let the page
// decide.
async function pageExists(
  supabase: SupabaseClient<Database>,
  pathname: string,
): Promise<boolean> {
  const city = CITY_PAGE.exec(pathname);
  if (city) {
    if (!SLUG.test(city[1])) {
      return false;
    }
    const { data, error } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", city[1])
      .maybeSingle();
    return Boolean(data) || Boolean(error);
  }

  const member = MEMBER_PAGE.exec(pathname);
  if (member) {
    if (!UUID.test(member[1])) {
      return false;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", member[1])
      .not("verified_at", "is", null)
      .maybeSingle();
    return Boolean(data) || Boolean(error);
  }

  return true;
}

// Refreshes the Supabase auth session and forwards the updated cookies to
// both Server Components (via the request) and the browser (via the response).
// Then routes the user to the step they're on: logged-out users to /welcome,
// unverified users to /invite, and users without a finished profile to
// /onboarding. A shared city or member link opened on the way is remembered
// in a cookie. This is only for navigation; RLS is what protects the data.
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

  // A redirect or rewrite is a new response, so it has to carry over the
  // refreshed session cookies and cache headers, or the user gets signed out.
  function withSession(response: NextResponse) {
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  }

  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return withSession(NextResponse.redirect(url));
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
    const response = redirectTo(step);
    // Someone opened a shared city or member link before finishing setup:
    // send them back there afterwards (see /auth/callback and onboarding).
    if (isReturnPath(pathname)) {
      response.cookies.set(RETURN_TO_COOKIE, pathname, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: RETURN_TO_MAX_AGE,
      });
    }
    return response;
  }

  if (!step) {
    // Setup is done, so a remembered link is either used now or never. Server
    // Actions and /auth/callback take it themselves (takeReturnTo); this
    // catches any way out of setup that doesn't, so a stale cookie can't
    // redirect a later sign-in.
    const returnTo = request.cookies.get(RETURN_TO_COOKIE)?.value;

    // Finished users have no reason to see the setup steps again.
    if (STEPS.includes(pathname)) {
      const response = redirectTo(isReturnPath(returnTo) ? returnTo : "/");
      response.cookies.delete(RETURN_TO_COOKIE);
      return response;
    }
    if (returnTo !== undefined) {
      supabaseResponse.cookies.delete(RETURN_TO_COOKIE);
    }

    // City and member pages stream, so a notFound() there can only send a
    // 200. Check here, before rendering starts, to send a real 404 for a dead
    // shared link.
    if (!(await pageExists(supabase, pathname))) {
      return withSession(
        NextResponse.rewrite(new URL("/_not-found", request.url), {
          status: 404,
        }),
      );
    }
  }

  // Always return supabaseResponse. If you build a different response, copy
  // its cookies and cache headers over, or the refreshed session is lost.
  return supabaseResponse;
}
