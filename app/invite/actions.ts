"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type InviteState = { error: string };

// Verifies the signed-in user with an invite code via redeem_invite().
export async function redeemInvite(
  _prevState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  // Codes get shared in chats, so tolerate spaces and dashes. redeem_invite
  // uppercases the code itself.
  const code = String(formData.get("code") ?? "").replace(/[\s-]/g, "");

  if (!code) {
    return { error: "Enter your invite code." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", { invite_code: code });

  if (error) {
    switch (error.message) {
      // A double submit, or verified in another tab: just move on.
      case "Already verified":
        redirect("/onboarding");
      case "Not signed in":
        redirect("/welcome");
      case "Invalid or already used invite code":
        return { error: "This code is invalid or has already been used." };
      default:
        return { error: "Something went wrong. Please try again." };
    }
  }

  redirect("/onboarding");
}
