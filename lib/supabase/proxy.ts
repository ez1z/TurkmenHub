import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isAdmin } from "@/lib/admin";
import { SLUG_PATTERN } from "@/lib/city-schema";
import {
  isReturnPath,
  RETURN_TO_COOKIE,
  RETURN_TO_MAX_AGE,
} from "@/lib/return-to";
import type { Database } from "@/types/database";

// Rewrites /city/x to /tk/city/x or /en/city/x (see i18n/routing.ts).
const handleI18nRouting = createMiddleware(routing);

// The steps a user goes through before they can use the app, in order.
const WELCOME = "/welcome";
const ONBOARDING = "/onboarding";
const STEPS = [WELCOME, ONBOARDING];

// Readable by anyone, signed in or not, at any step.
const PUBLIC_PAGES = ["/privacy", "/rules"];

// Set on /welcome when the user had a session that can't be refreshed any
// more, so the page can say why they're signing in again.
export const SESSION_EXPIRED_PARAM = "session";

// This project's session cookie, which supabase-js names after the project
// ref (sb-<ref>-auth-token), possibly split into .0, .1, ... chunks. Only
// this project's: another Supabase app on the same host (e.g. localhost on a
// different port) has its own cookie, which says nothing about this session.
// Not the PKCE code verifier, which only exists while a sign-in is under way.
const SESSION_COOKIE = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;

function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => {
    if (name === SESSION_COOKIE) {
      return true;
    }
    const chunk = name.startsWith(`${SESSION_COOKIE}.`)
      ? name.slice(SESSION_COOKIE.length + 1)
      : "";
    return /^\d+$/.test(chunk);
  });
}

const CITY_PAGE = /^\/city\/([^/]+)$/;
const MEMBER_PAGE = /^\/member\/([^/]+)$/;
const ADMIN_PAGE = "/admin";
// Anything else can't match a row, so it's not found without a query.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Whether a city, member or admin page has anything to show this viewer. Same RLS
// as the page itself, so a hidden or blocked member is missing here too.
// Other paths always count as existing; on a lookup error, let the page
// decide.
async function pageExists(
  supabase: SupabaseClient<Database>,
  pathname: string,
): Promise<boolean> {
  const city = CITY_PAGE.exec(pathname);
  if (city) {
    if (!SLUG_PATTERN.test(city[1])) {
      return false;
    }
    const { data, error } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", city[1])
      .maybeSingle();
    return Boolean(data) || Boolean(error);
  }

  // Members who aren't admins get a 404, not a page they can't use.
  if (pathname === ADMIN_PAGE) {
    return isAdmin(supabase).catch(() => true);
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
// and users without a finished profile to /onboarding. A shared city or
// member link opened on the way is remembered in a cookie. This is only for
// navigation; RLS is what protects the data.
// Requests that go through are handed to next-intl to pick the language.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};
  const hadSession = hasSessionCookie(request);

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

  function redirectTo(path: string, search = "") {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = search;
    return withSession(NextResponse.redirect(url));
  }

  // Supabase's session cookies have been written into the request above, and
  // next-intl forwards the request headers, so pages see the fresh session.
  function render() {
    return withSession(handleI18nRouting(request));
  }

  // A real 404 in the visitor's language: the same locale rewrite, pointed
  // at app/[locale]/[...missing], which calls notFound().
  function renderNotFound() {
    const missing = new NextRequest(new URL("/_missing", request.url), request);
    const rewrite = handleI18nRouting(missing);
    return withSession(
      new NextResponse(null, { status: 404, headers: rewrite.headers }),
    );
  }

  if (PUBLIC_PAGES.includes(pathname)) {
    return render();
  }

  let step: string | null = WELCOME;

  if (userId) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("nickname, city_id")
      .eq("id", userId)
      .maybeSingle();

    // Don't bounce members to /onboarding because of a network blip.
    if (error) {
      return supabaseResponse;
    }

    // Nickname and city are the required profile fields. Everyone who signs
    // in is a member; one removed by hand (verified_at null) gets through
    // here but RLS shows them nothing.
    step = !profile?.nickname || profile.city_id === null ? ONBOARDING : null;
  }

  if (step && pathname !== step) {
    // The cookie was there but getClaims() couldn't refresh it (expired or
    // revoked), and Supabase has just cleared it, so this shows once.
    const expired = step === WELCOME && hadSession;
    const response = redirectTo(
      step,
      expired ? `?${SESSION_EXPIRED_PARAM}=expired` : "",
    );
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
      return renderNotFound();
    }
  }

  // Every response built here goes through withSession(), which copies the
  // refreshed session cookies and cache headers over; without them the
  // session is lost.
  return render();
}
