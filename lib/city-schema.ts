import { z } from "zod";
import { isCountryCode } from "@/lib/countries";

// The slug in /city/<slug>: lowercase words joined by single dashes, as the
// check constraint on public.cities requires.
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// "Kuala Lumpur" → "kuala-lumpur", "Aşgabat" → "asgabat". Used to suggest a
// slug from the English name; the admin can still change it.
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "cityNameRequired" })
  .max(60, { error: "cityNameMax" });

// Mirrors the check constraints on public.cities. Error messages are keys in
// the "errors" messages; the form translates them.
export const citySchema = z.object({
  name_en: nameSchema,
  name_tk: nameSchema,
  slug: z
    .string()
    .trim()
    .max(60, { error: "slugInvalid" })
    .regex(SLUG_PATTERN, { error: "slugInvalid" }),
  country_code: z
    .string()
    .refine(isCountryCode, { error: "countryRequired" }),
  // WhatsApp or Telegram group invite link. Optional; empty is stored as null.
  group_url: z
    .string()
    .trim()
    .max(300, { error: "groupUrlInvalid" })
    .refine((url) => !url || (URL.canParse(url) && url.startsWith("https://")), {
      error: "groupUrlInvalid",
    })
    .transform((url) => url || null),
});

export type CityFormValues = {
  name_en: string;
  name_tk: string;
  slug: string;
  country_code: string;
  group_url: string;
};

export type CityFieldErrors = Partial<Record<keyof CityFormValues, string[]>>;
