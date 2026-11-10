import { hasLocale } from "next-intl";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";
import { takeReturnTo } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/server";

// OAuth (PKCE) callback: exchanges the authorization code for a session.
// The session is written to cookies by the server client's setAll.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/welcome?error=oauth", origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/welcome?error=oauth", origin));
  }

  // Back to the shared link the user opened, if any. If they still have setup
  // steps left, the proxy sends them on to /onboarding and remembers the link
  // again.
  const response = NextResponse.redirect(new URL(await takeReturnTo(), origin));

  // First sign-in on this browser: use the language saved on the profile.
  // A language already picked here wins.
  const hasLocaleCookie = request.headers
    .get("cookie")
    ?.split(/;\s*/)
    .some((cookie) => cookie.startsWith(`${LOCALE_COOKIE.name}=`));
  if (!hasLocaleCookie) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("locale, nickname")
      .eq("id", data.user.id)
      .maybeSingle();
    // A profile that hasn't been through onboarding only has the column
    // default, not a choice.
    if (profile?.nickname && hasLocale(routing.locales, profile.locale)) {
      response.cookies.set(LOCALE_COOKIE.name, profile.locale, {
        path: "/",
        sameSite: "lax",
        maxAge: LOCALE_COOKIE.maxAge,
      });
    }
  }

  return response;
}
