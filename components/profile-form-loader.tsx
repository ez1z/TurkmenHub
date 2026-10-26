import ProfileForm from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";

// Loads the cities and the member's saved profile and contacts, then renders
// the form prefilled. Reads cookies, so render it inside <Suspense>.
export default async function ProfileFormLoader({
  mode,
}: {
  mode: "onboarding" | "settings";
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub ?? "";

  const [{ data: cities }, { data: profile }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("cities")
        .select("id, name_en, name_tk, country_code")
        .order("name_en"),
      supabase
        .from("profiles")
        .select("nickname, city_id, bio, is_visible")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("contacts")
        .select("whatsapp, telegram, share_with_verified")
        .eq("profile_id", userId)
        .maybeSingle(),
    ]);

  // Prefill whatever is already saved, e.g. a nickname kept after the
  // member's city was removed.
  return (
    <ProfileForm
      mode={mode}
      cities={cities ?? []}
      initialValues={{
        nickname: profile?.nickname ?? "",
        city_id: profile?.city_id?.toString() ?? "",
        bio: profile?.bio ?? "",
        is_visible: profile?.is_visible ?? false,
        whatsapp: contacts?.whatsapp ?? "",
        telegram: contacts?.telegram ?? "",
        share_with_verified: contacts?.share_with_verified ?? false,
      }}
    />
  );
}
