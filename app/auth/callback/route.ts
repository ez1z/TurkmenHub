import { NextResponse } from "next/server";
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
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/welcome?error=oauth", origin));
  }

  // The proxy sends the user on to /invite or /onboarding if they need it.
  return NextResponse.redirect(new URL("/", origin));
}
