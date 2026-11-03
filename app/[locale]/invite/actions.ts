"use server";

import { redirect } from "next/navigation";
import { takeReturnTo } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// code is echoed back so a failed attempt keeps what the user typed (React
// resets an uncontrolled form after its action runs). error is a key in the
// "errors" messages, which the form translates.
export type InviteState = {
  error: "" | "codeRequired" | "codeInvalid" | "codeUnusable" | "codeUsed" | "generic";
  code: string;
};

// Verified now, so the next step is onboarding, unless the profile is already
// filled in (a member who lost verification and got a new code). Redirect
// straight there: the proxy's own redirect away from /onboarding would drop
// the remembered link.
async function afterVerified(supabase: SupabaseClient): Promise<never> {
  const { data } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, city_id")
    .eq("id", data?.claims.sub ?? "")
    .maybeSingle();

  if (profile?.nickname && profile.city_id !== null) {
    redirect(await takeReturnTo());
  }
  redirect("/onboarding");
}

// Verifies the signed-in user with an invite code via redeem_invite().
export async function redeemInvite(
  _prevState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  // Codes get shared in chats, so tolerate spaces and dashes. redeem_invite
  // uppercases the code itself.
  const code = String(formData.get("code") ?? "").replace(/[\s-]/g, "");

  if (!code) {
    return { error: "codeRequired", code };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", { invite_code: code });

  if (error) {
    switch (error.message) {
      // A double submit, or verified in another tab: just move on.
      case "Already verified":
        return afterVerified(supabase);
      case "Not signed in":
        redirect("/welcome");
      case "Invalid invite code":
        return { error: "codeInvalid", code };
      // Raised by redeem_invite before migration 20261026074341, which split
      // it into the two cases around it. Kept so the app still explains a bad
      // code if it ships before that migration reaches the database.
      case "Invalid or already used invite code":
        return { error: "codeUnusable", code };
      case "Invite code already used":
        return { error: "codeUsed", code };
      default:
        return { error: "generic", code };
    }
  }

  return afterVerified(supabase);
}
