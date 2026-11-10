"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  citySchema,
  type CityFieldErrors,
  type CityFormValues,
} from "@/lib/city-schema";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type CityFormState = {
  error: "" | "generic" | "notAllowed" | "cityChanged";
  fieldErrors: CityFieldErrors;
  saved: boolean;
  // Echoed back so the form keeps what the admin typed when validation fails.
  values: CityFormValues;
};

export type RemoveCityState = {
  error:
    | ""
    | "generic"
    | "notAllowed"
    | "cityChanged"
    | "cityHasMembers"
    | "mergeTargetRequired";
};

export type MergeCityState = RemoveCityState & {
  // The picked city, echoed back so the select keeps it when merging fails.
  into: string;
};

export type SetAdminState = {
  error: "" | "generic" | "notAllowed" | "memberNotFound";
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

// A write RLS doesn't allow matches no rows rather than failing, and so does
// one on a city another admin has just merged or deleted. Tell them apart,
// and in the second case reload the list so the admin sees what changed.
async function noRowsError(supabase: Supabase) {
  if (!(await isAdmin(supabase).catch(() => false))) {
    return "notAllowed" as const;
  }
  refresh();
  return "cityChanged" as const;
}

// Adds a city (cityId null) or edits one. RLS only lets admins write cities,
// so a member calling this gets "notAllowed" whatever they send.
export async function saveCity(
  cityId: number | null,
  _prevState: CityFormState,
  formData: FormData,
): Promise<CityFormState> {
  const values: CityFormValues = {
    name_en: String(formData.get("name_en") ?? ""),
    name_tk: String(formData.get("name_tk") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    country_code: String(formData.get("country_code") ?? ""),
    group_url: String(formData.get("group_url") ?? ""),
  };

  const parsed = citySchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      saved: false,
      values,
    };
  }

  const supabase = await createClient();
  // Ask for the row back to tell "saved" from "matched nothing".
  const { data, error } =
    cityId === null
      ? await supabase.from("cities").insert(parsed.data).select("id")
      : await supabase.from("cities").update(parsed.data).eq("id", cityId).select("id");

  // 23505: another city already has this slug.
  if (error?.code === "23505") {
    return { error: "", fieldErrors: { slug: ["slugTaken"] }, saved: false, values };
  }
  // 42501: the insert policy turned a non-admin away.
  if (error?.code === "42501") {
    return { error: "notAllowed", fieldErrors: {}, saved: false, values };
  }
  if (!error && !data?.length) {
    return { error: await noRowsError(supabase), fieldErrors: {}, saved: false, values };
  }
  if (error) {
    return { error: "generic", fieldErrors: {}, saved: false, values };
  }

  refresh();
  return { error: "", fieldErrors: {}, saved: true, values };
}

// Deletes a city nobody lives in. Members' city_id keeps a city that's in
// use from being deleted (23503), and then it has to be merged instead:
// someone moved in since the list loaded, so reload it to offer the merge.
export async function deleteCity(cityId: number): Promise<RemoveCityState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .delete()
    .eq("id", cityId)
    .select("id");

  if (error?.code === "23503") {
    refresh();
    return { error: "cityHasMembers" };
  }
  if (!error && !data?.length) {
    return { error: await noRowsError(supabase) };
  }
  if (error) {
    return { error: "generic" };
  }

  refresh();
  return { error: "" };
}

// Moves everyone in cityId to the city picked in the form, then deletes
// cityId (see merge_cities() in the migrations).
export async function mergeCity(
  cityId: number,
  _prevState: MergeCityState,
  formData: FormData,
): Promise<MergeCityState> {
  const picked = String(formData.get("into_city") ?? "");
  const into = Number(picked);
  if (!Number.isInteger(into) || into <= 0 || into === cityId) {
    return { error: "mergeTargetRequired", into: picked };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("merge_cities", {
    from_city: cityId,
    into_city: into,
  });

  if (error?.code === "42501") {
    return { error: "notAllowed", into: picked };
  }
  // P0002: one of the two cities was just merged or deleted by another admin.
  if (error?.code === "P0002") {
    refresh();
    return { error: "cityChanged", into: picked };
  }
  if (error) {
    return { error: "generic", into: picked };
  }

  refresh();
  return { error: "", into: "" };
}

// Makes a member an admin, or stops them being one. Only the superuser may
// (see set_admin() in the migrations).
export async function setAdmin(
  memberId: string,
  makeAdmin: boolean,
): Promise<SetAdminState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_admin", {
    member: memberId,
    make_admin: makeAdmin,
  });

  if (error?.code === "42501") {
    return { error: "notAllowed" };
  }
  // P0002: they deleted their account or lost verification since the list loaded.
  if (error?.code === "P0002") {
    refresh();
    return { error: "memberNotFound" };
  }
  if (error) {
    return { error: "generic" };
  }

  refresh();
  return { error: "" };
}
