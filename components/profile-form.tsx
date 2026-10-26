"use client";

import { useActionState } from "react";
import CityPicker, { type City } from "@/components/city-picker";
import {
  completeOnboarding,
  updateSettings,
  type ProfileFormState,
} from "@/lib/profile-actions";
import type { ProfileFieldErrors, ProfileFormValues } from "@/lib/profile-schema";

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";
const hintClass = "text-sm text-zinc-500";
const fieldClass =
  "w-full rounded-xl border border-black/[.08] bg-transparent px-4 text-black placeholder:text-zinc-400 focus:border-foreground focus:outline-none aria-invalid:border-red-600 disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-50 dark:aria-invalid:border-red-400";
const errorClass = "text-sm text-red-600 dark:text-red-400";
const legendClass = "mb-1 text-base font-semibold text-black dark:text-zinc-50";

// The id of the message under a field: its error if it has one, else its hint.
function describedBy(
  name: keyof ProfileFieldErrors,
  fieldErrors: ProfileFieldErrors,
  hasHint = false,
) {
  if (fieldErrors[name]) {
    return `${name}-error`;
  }
  return hasHint ? `${name}-hint` : undefined;
}

function FieldMessage({
  name,
  fieldErrors,
  hint,
}: {
  name: keyof ProfileFieldErrors;
  fieldErrors: ProfileFieldErrors;
  hint?: string;
}) {
  if (fieldErrors[name]) {
    return (
      <p id={`${name}-error`} className={errorClass}>
        {fieldErrors[name][0]}
      </p>
    );
  }
  return hint ? (
    <p id={`${name}-hint`} className={hintClass}>
      {hint}
    </p>
  ) : null;
}

function Switch({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer items-start justify-between gap-4"
    >
      <span className="flex flex-col gap-1">
        <span className={labelClass}>{label}</span>
        <span className={hintClass}>{hint}</span>
      </span>
      <input
        id={name}
        name={name}
        type="checkbox"
        role="switch"
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-zinc-300 transition-colors peer-checked:bg-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 dark:bg-zinc-700 dark:peer-checked:after:bg-black"
      />
    </label>
  );
}

// Profile and contact details. Onboarding uses it to finish setup and sends
// the member home; settings uses it to edit and stays on the page.
export default function ProfileForm({
  mode,
  cities,
  initialValues,
}: {
  mode: "onboarding" | "settings";
  cities: City[];
  initialValues: ProfileFormValues;
}) {
  const [state, formAction, pending] = useActionState(
    mode === "onboarding" ? completeOnboarding : updateSettings,
    { error: "", fieldErrors: {}, saved: false, values: initialValues } satisfies ProfileFormState,
  );
  const { fieldErrors, values } = state;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-5">
        <legend className={legendClass}>Profile</legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className={labelClass}>
            Nickname
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            autoFocus={mode === "onboarding"}
            autoComplete="nickname"
            minLength={2}
            maxLength={30}
            defaultValue={values.nickname}
            aria-invalid={fieldErrors.nickname ? true : undefined}
            aria-describedby={describedBy("nickname", fieldErrors)}
            className={`h-12 ${fieldClass}`}
          />
          <FieldMessage name="nickname" fieldErrors={fieldErrors} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <CityPicker
            id="city"
            name="city_id"
            cities={cities}
            defaultValue={values.city_id}
            invalid={Boolean(fieldErrors.city_id)}
            describedBy={describedBy("city_id", fieldErrors, true)}
            className={`h-12 ${fieldClass}`}
          />
          <FieldMessage
            name="city_id"
            fieldErrors={fieldErrors}
            hint="Not listed? Pick the nearest city."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className={labelClass}>
            Bio <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={values.bio}
            placeholder="Studying at UM, happy to help newcomers."
            aria-invalid={fieldErrors.bio ? true : undefined}
            aria-describedby={describedBy("bio", fieldErrors, true)}
            className={`resize-none py-3 ${fieldClass}`}
          />
          <FieldMessage
            name="bio"
            fieldErrors={fieldErrors}
            hint="Up to 500 characters."
          />
        </div>

        <Switch
          name="is_visible"
          label="Visible to other members"
          hint="Members in your city can find you. Only your city is shown, never your exact location."
          defaultChecked={values.is_visible}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className={legendClass}>
          Contacts{" "}
          <span className="text-sm font-normal text-zinc-500">(optional)</span>
        </legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="whatsapp" className={labelClass}>
            WhatsApp number
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500"
            >
              +
            </span>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={values.whatsapp}
              placeholder="60 12 345 6789"
              aria-invalid={fieldErrors.whatsapp ? true : undefined}
              aria-describedby={describedBy("whatsapp", fieldErrors, true)}
              className={`h-12 pl-8 ${fieldClass}`}
            />
          </div>
          <FieldMessage
            name="whatsapp"
            fieldErrors={fieldErrors}
            hint="Country code first, e.g. 60 for Malaysia."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="telegram" className={labelClass}>
            Telegram username
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-zinc-500"
            >
              @
            </span>
            <input
              id="telegram"
              name="telegram"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={64}
              defaultValue={values.telegram}
              placeholder="username"
              aria-invalid={fieldErrors.telegram ? true : undefined}
              aria-describedby={describedBy("telegram", fieldErrors)}
              className={`h-12 pl-9 ${fieldClass}`}
            />
          </div>
          <FieldMessage name="telegram" fieldErrors={fieldErrors} />
        </div>

        <Switch
          name="share_with_verified"
          label="Share with verified members"
          hint="Verified members who can see your profile will be able to message you."
          defaultChecked={values.share_with_verified}
        />
      </fieldset>

      {state.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending || !cities.length}
          className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {pending ? "Saving..." : mode === "onboarding" ? "Continue" : "Save changes"}
        </button>
        {/* Cleared while the next save is in flight. */}
        <p role="status" className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {state.saved && !pending ? "Saved." : ""}
        </p>
      </div>
    </form>
  );
}
