"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  citySchema,
  type CityFieldErrors,
  type CityFormValues,
} from "@/lib/city-schema";
import { createClient } from "@/lib/supabase/server";

export type CityFormState = {
  error: "" | "generic" | "notAllowed";
  fieldErrors: CityFieldErrors;
  saved: boolean;
  // Echoed back so the form keeps what the admin typed when validation fails.
  values: CityFormValues;
};

export type RemoveCityState = {
  error: "" | "generic" | "notAllowed" | "cityHasMembers" | "mergeTargetRequired";
};

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
  // An update RLS doesn't allow matches no rows rather than failing, so ask
  // for the row back to tell "saved" from "not allowed".
  const { data, error } =
    cityId === null
      ? await supabase.from("cities").insert(parsed.data).select("id")
      : await supabase.from("cities").update(parsed.data).eq("id", cityId).select("id");

  // 23505: another city already has this slug.
  if (error?.code === "23505") {
    return { error: "", fieldErrors: { slug: ["slugTaken"] }, saved: false, values };
  }
  // 42501: the insert policy turned a non-admin away.
  if (error?.code === "42501" || (!error && !data?.length)) {
    return { error: "notAllowed", fieldErrors: {}, saved: false, values };
  }
  if (error) {
    return { error: "generic", fieldErrors: {}, saved: false, values };
  }

  refresh();
  return { error: "", fieldErrors: {}, saved: true, values };
}

// Deletes a city nobody lives in. Members' city_id keeps a city that's in
// use from being deleted (23503), and then it has to be merged instead.
export async function deleteCity(cityId: number): Promise<RemoveCityState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .delete()
    .eq("id", cityId)
    .select("id");

  if (error?.code === "23503") {
    return { error: "cityHasMembers" };
  }
  if (!error && !data?.length) {
    return { error: "notAllowed" };
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
  _prevState: RemoveCityState,
  formData: FormData,
): Promise<RemoveCityState> {
  const into = Number(formData.get("into_city"));
  if (!Number.isInteger(into) || into <= 0 || into === cityId) {
    return { error: "mergeTargetRequired" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("merge_cities", {
    from_city: cityId,
    into_city: into,
  });

  if (error?.code === "42501") {
    return { error: "notAllowed" };
  }
  if (error) {
    return { error: "generic" };
  }

  refresh();
  return { error: "" };
}
