"use server";

import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";
import { RETURN_TO_COOKIE } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error: "" | "confirmRequired" | "generic" };

// Signs out on this device and starts over at /welcome.
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/welcome");
}

// Deletes the member's auth user, and with it everything of theirs (see
// delete_account() in the migrations). The form must have the "I understand"
// box ticked, so a stray tap can't do it.
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  if (formData.get("confirm") !== "on") {
    return { error: "confirmRequired" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_account");

  if (error?.message === "Not signed in") {
    redirect("/welcome");
  }
  if (error) {
    return { error: "generic" };
  }

  // The user and their sessions are gone in the database; this clears the
  // session cookies. Supabase ignores the "session not found" it gets back.
  await supabase.auth.signOut();
  (await cookies()).delete(RETURN_TO_COOKIE);
  redirect("/welcome?deleted=1");
}

// Switches the language for this browser, and saves it on the profile when
// signed in so the next sign-in on another device starts in it too.
export async function setLocale(locale: string): Promise<void> {
  if (!hasLocale(routing.locales, locale)) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE.name, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: LOCALE_COOKIE.maxAge,
  });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (userId) {
    // Column grants allow members to update their own locale.
    await supabase.from("profiles").update({ locale }).eq("id", userId);
  }
}
