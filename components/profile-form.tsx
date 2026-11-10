"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import CityPicker, { type City } from "@/components/city-picker";
import { describedBy, FieldMessage } from "@/components/field-message";
import {
  completeOnboarding,
  updateSettings,
  type ProfileFormState,
} from "@/lib/profile-actions";
import type { ErrorKey } from "@/lib/error-key";
import type { ProfileFormValues } from "@/lib/profile-schema";
import {
  errorTextClass,
  fieldClass,
  hintClass,
  labelClass,
  primaryButtonClass,
} from "@/lib/styles";

// A legend sits outside its fieldset's flex gap, so it brings its own margin.
const legendClass = "mb-4 font-display text-xl font-semibold tracking-tight text-ink";
const prefixClass =
  "pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted";

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
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-subtle p-4"
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
        className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line transition-colors duration-200 peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
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
  const t = useTranslations("profileForm");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    mode === "onboarding" ? completeOnboarding : updateSettings,
    { error: "", fieldErrors: {}, saved: false, values: initialValues } satisfies ProfileFormState,
  );
  const { fieldErrors, values } = state;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      {/* Onboarding saves it as the member's language. */}
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="flex flex-col gap-5">
        <legend className={legendClass}>{t("profile")}</legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="nickname" className={labelClass}>
            {t("nickname")}
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
            aria-describedby={describedBy("nickname", fieldErrors.nickname)}
            className={`h-12 ${fieldClass}`}
          />
          <FieldMessage id="nickname" errors={fieldErrors.nickname} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="city" className={labelClass}>
            {t("city")}
          </label>
          <CityPicker
            id="city"
            name="city_id"
            cities={cities}
            defaultValue={values.city_id}
            invalid={Boolean(fieldErrors.city_id)}
            describedBy={describedBy("city_id", fieldErrors.city_id, true)}
            className={`h-12 ${fieldClass}`}
          />
          <FieldMessage
            id="city_id"
            errors={fieldErrors.city_id}
            hint={t("cityHint")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className={labelClass}>
            {t("bio")} <span className="font-normal text-ink-muted">{t("optional")}</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={values.bio}
            placeholder={t("bioPlaceholder")}
            aria-invalid={fieldErrors.bio ? true : undefined}
            aria-describedby={describedBy("bio", fieldErrors.bio, true)}
            className={`resize-none py-3 ${fieldClass}`}
          />
          <FieldMessage
            id="bio"
            errors={fieldErrors.bio}
            hint={t("bioHint")}
          />
        </div>

        <Switch
          name="is_visible"
          label={t("visible")}
          hint={t("visibleHint")}
          defaultChecked={values.is_visible}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className={legendClass}>
          {t("contacts")}{" "}
          <span className="font-sans text-sm font-normal tracking-normal text-ink-muted">
            {t("optional")}
          </span>
        </legend>

        <div className="flex flex-col gap-2">
          <label htmlFor="whatsapp" className={labelClass}>
            {t("whatsapp")}
          </label>
          <div className="relative">
            <span aria-hidden="true" className={prefixClass}>
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
              aria-describedby={describedBy("whatsapp", fieldErrors.whatsapp, true)}
              className={`h-12 pl-8 ${fieldClass}`}
            />
          </div>
          <FieldMessage
            id="whatsapp"
            errors={fieldErrors.whatsapp}
            hint={t("whatsappHint")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="telegram" className={labelClass}>
            {t("telegram")}
          </label>
          <div className="relative">
            <span aria-hidden="true" className={prefixClass}>
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
              placeholder={t("telegramPlaceholder")}
              aria-invalid={fieldErrors.telegram ? true : undefined}
              aria-describedby={describedBy("telegram", fieldErrors.telegram)}
              className={`h-12 pl-9 ${fieldClass}`}
            />
          </div>
          <FieldMessage id="telegram" errors={fieldErrors.telegram} />
        </div>

        <Switch
          name="share_with_verified"
          label={t("share")}
          hint={t("shareHint")}
          defaultChecked={values.share_with_verified}
        />
      </fieldset>

      {state.error && (
        <p role="alert" className={errorTextClass}>
          {tErrors(state.error as ErrorKey)}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending || !cities.length}
          className={primaryButtonClass}
        >
          {pending ? t("saving") : mode === "onboarding" ? t("continue") : t("save")}
        </button>
        {/* Cleared while the next save is in flight. */}
        <p role="status" className="text-center text-sm font-medium text-brand-ink">
          {state.saved && !pending ? t("saved") : ""}
        </p>
      </div>
    </form>
  );
}
