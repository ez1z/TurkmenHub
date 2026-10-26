"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  profileFormSchema,
  type ProfileFieldErrors,
  type ProfileFormValues,
} from "@/lib/profile-schema";

export type ProfileFormState = {
  error: string;
  fieldErrors: ProfileFieldErrors;
  saved: boolean;
  // Echoed back so the form keeps what the user typed when validation fails
  // (React resets an uncontrolled form after its action runs).
  values: ProfileFormValues;
};

// Validates the form and writes it to profiles and contacts.
async function save(formData: FormData): Promise<ProfileFormState> {
  const values = {
    nickname: String(formData.get("nickname") ?? ""),
    city_id: String(formData.get("city_id") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    telegram: String(formData.get("telegram") ?? ""),
    // An unchecked checkbox isn't sent at all.
    is_visible: formData.get("is_visible") === "on",
    share_with_verified: formData.get("share_with_verified") === "on",
  };

  const parsed = profileFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      saved: false,
      values,
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) {
    redirect("/welcome");
  }

  const { nickname, city_id, bio, is_visible, whatsapp, telegram, share_with_verified } =
    parsed.data;

  // RLS only lets users write their own rows, and column grants limit the
  // profile update to nickname, city_id, bio, is_visible and locale.
  const [profile, contacts] = await Promise.all([
    supabase
      .from("profiles")
      .update({ nickname, city_id, bio, is_visible })
      .eq("id", userId),
    supabase
      .from("contacts")
      .upsert({ profile_id: userId, whatsapp, telegram, share_with_verified }),
  ]);

  // 23503: city_id doesn't match a row in cities.
  if (profile.error?.code === "23503") {
    return {
      error: "",
      fieldErrors: { city_id: ["Choose a city from the list."] },
      saved: false,
      values,
    };
  }
  if (profile.error || contacts.error) {
    return {
      error: "Something went wrong. Please try again.",
      fieldErrors: {},
      saved: false,
      values,
    };
  }

  // Show what was stored, e.g. the WhatsApp number as digits only.
  return {
    error: "",
    fieldErrors: {},
    saved: true,
    values: {
      ...values,
      nickname,
      bio: bio ?? "",
      whatsapp: whatsapp ?? "",
      telegram: telegram ?? "",
    },
  };
}

// Last onboarding step: once nickname and city are saved, the proxy lets the
// member into the app.
export async function completeOnboarding(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const state = await save(formData);
  if (state.saved) {
    redirect("/");
  }
  return state;
}

export async function updateSettings(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  return save(formData);
}
