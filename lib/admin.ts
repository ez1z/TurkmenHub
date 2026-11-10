import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Whether the signed-in user is an admin (the superuser counts as one). Asks
// the database (my_admin_role() in the migrations), so an admin who lost
// verification counts as a member here just as RLS treats them. This only
// decides what to show; RLS decides what an admin may change.
export async function isAdmin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("my_admin_role");
  if (error) {
    throw error;
  }
  return data !== null;
}
