import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Whether the signed-in user is an admin (the superuser counts as one). RLS
// only returns the caller's own row from admins, so there's nothing to filter
// on. This only decides what to show; RLS decides what an admin may change.
export async function isAdmin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("admins")
    .select("profile_id")
    .maybeSingle();
  if (error) {
    throw error;
  }
  return Boolean(data);
}
