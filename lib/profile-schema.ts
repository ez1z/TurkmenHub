import { z } from "zod";

// Mirrors the check constraints on public.profiles, so bad input gets a
// friendly message here instead of a constraint error from Postgres. Error
// messages are keys in the "errors" messages; the form translates them.
export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, { error: "nicknameMin" })
    .max(30, { error: "nicknameMax" }),
  // The city picker sends "" when nothing is chosen, which coerces to 0.
  city_id: z.coerce
    .number({ error: "cityRequired" })
    .int()
    .positive({ error: "cityRequired" }),
  bio: z
    .string()
    .trim()
    .max(500, { error: "bioMax" })
    .transform((bio) => bio || null),
  is_visible: z.boolean(),
});

// Mirrors the check constraints on public.contacts. Both channels are
// optional, and an empty field is stored as null.
export const contactSchema = z.object({
  // Keep digits only, which also drops a leading "+" and any spaces, dashes
  // or brackets: "+60 12-345 6789" becomes "60123456789", ready for wa.me.
  whatsapp: z
    .string()
    .transform((number) => number.replace(/\D/g, ""))
    .refine((number) => !number.startsWith("0"), {
      error: "whatsappLeadingZero",
      abort: true,
    })
    .refine((number) => !number || /^[1-9][0-9]{6,14}$/.test(number), {
      error: "whatsappInvalid",
    })
    .transform((number) => number || null),
  // Accept "@name" and t.me links as well, since that's how people copy it.
  telegram: z
    .string()
    .trim()
    .transform((username) =>
      username.replace(/^(https?:\/\/)?(t\.me\/|telegram\.me\/)/i, "").replace(/^@/, ""),
    )
    .refine((username) => !username || /^[A-Za-z0-9_]{5,32}$/.test(username), {
      error: "telegramInvalid",
    })
    .transform((username) => username || null),
  share_with_verified: z.boolean(),
});

export const profileFormSchema = profileSchema.extend(contactSchema.shape);

export type ProfileFormValues = {
  nickname: string;
  city_id: string;
  bio: string;
  is_visible: boolean;
  whatsapp: string;
  telegram: string;
  share_with_verified: boolean;
};

export type ProfileFieldErrors = Partial<
  Record<keyof ProfileFormValues, string[]>
>;
