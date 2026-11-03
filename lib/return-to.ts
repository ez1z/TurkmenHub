import { cookies } from "next/headers";

// Remembers the shared link (a city or member page) someone opened before
// signing in, so they land there once sign-in, invite and onboarding are done.
// A cookie rather than a ?next= param, because it has to survive the Google
// round trip and every setup step in between.
export const RETURN_TO_COOKIE = "return_to";

// Long enough to go and ask a friend for an invite code.
export const RETURN_TO_MAX_AGE = 60 * 60 * 24;

// Only pages worth sharing. Anything else (and anything that isn't a plain
// same-site path, like "//evil.example") is ignored, so the cookie can't be
// used as an open redirect.
const RETURNABLE = /^\/(city|member)\/[A-Za-z0-9-]+$/;

export function isReturnPath(path: string | undefined): path is string {
  return Boolean(path && RETURNABLE.test(path));
}

// Where a member goes once setup is done: the remembered link, or home. Clears
// the cookie so it can't send them anywhere later. For Server Actions and
// Route Handlers; the proxy reads request cookies directly.
export async function takeReturnTo(): Promise<string> {
  const cookieStore = await cookies();
  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value;
  if (returnTo !== undefined) {
    cookieStore.delete(RETURN_TO_COOKIE);
  }
  return isReturnPath(returnTo) ? returnTo : "/";
}
