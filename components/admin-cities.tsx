"use client";

import { Globe, Merge, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import {
  deleteCity,
  mergeCity,
  saveCity,
  type CityFormState,
  type MergeCityState,
  type RemoveCityState,
} from "@/app/[locale]/admin/actions";
import { describedBy, FieldMessage } from "@/components/field-message";
import Modal from "@/components/modal";
import { slugify, type CityFormValues } from "@/lib/city-schema";
import {
  cardClass,
  dangerButtonClass,
  errorTextClass,
  fieldClass,
  ghostButtonClass,
  labelClass,
  leadClass,
  outlineButtonClass,
  primaryButtonClass,
  sectionLabelClass,
} from "@/lib/styles";

export type AdminCity = {
  id: number;
  slug: string;
  name_en: string;
  name_tk: string;
  country_code: string;
  group_url: string | null;
  member_count: number;
  // In the page language.
  name: string;
};

export type AdminCountry = {
  code: string;
  name: string;
  cities: AdminCity[];
};

type CountryOption = { code: string; name: string };

type Dialog =
  // country is "" for "Add a country", where the admin picks it.
  | { kind: "add"; country: string }
  | { kind: "edit"; city: AdminCity; view: "edit" | "delete" | "merge" };

const cancelButtonClass = `h-12 w-full ${outlineButtonClass}`;
const bodyClass = "text-sm leading-relaxed text-ink-muted";
const selectClass = `h-12 ${fieldClass}`;
const initialRemove: RemoveCityState = { error: "" };
const initialMerge: MergeCityState = { error: "", into: "" };

const emptyCity: CityFormValues = {
  name_en: "",
  name_tk: "",
  slug: "",
  country_code: "",
  group_url: "",
};

// The admin's list of countries and their cities, with the dialogs to add,
// edit, delete and merge them. Each dialog's form is keyed, so opening one
// always starts fresh.
export default function AdminCities({
  countries,
  countryOptions,
}: {
  countries: AdminCountry[];
  countryOptions: CountryOption[];
}) {
  const t = useTranslations("admin");
  // Kept after closing, so the dialog doesn't go blank while it animates out.
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function show(next: Dialog) {
    setFormKey((key) => key + 1);
    setDialog(next);
    setOpen(true);
  }
  const close = () => setOpen(false);

  const countryLabel = (code: string) =>
    countryOptions.find((option) => option.code === code)?.name ?? code;

  // The open city as the list now has it: an action that fails because the
  // city changed reloads the list, and the dialog should show what's true
  // now (e.g. that people live there, so it can only be merged). Once it's
  // gone, keep the copy from when the dialog opened.
  const city =
    dialog?.kind === "edit"
      ? (countries
          .flatMap((country) => country.cities)
          .find((other) => other.id === dialog.city.id) ?? dialog.city)
      : null;

  let title = "";
  if (dialog?.kind === "add") {
    title = dialog.country
      ? t("addCityIn", { country: countryLabel(dialog.country) })
      : t("addCountryTitle");
  } else if (dialog?.kind === "edit" && city) {
    title = {
      edit: t("editCity", { city: city.name }),
      delete: t("remove.deleteTitle", { city: city.name }),
      merge: t("remove.mergeTitle", { city: city.name }),
    }[dialog.view];
  }

  return (
    <>
      <button
        type="button"
        onClick={() => show({ kind: "add", country: "" })}
        className={`h-12 self-start px-5 ${outlineButtonClass}`}
      >
        <Globe aria-hidden="true" className="h-4 w-4" />
        {t("addCountry")}
      </button>

      {!countries.length && <p className={leadClass}>{t("empty")}</p>}

      {countries.map((country) => (
        <section
          key={country.code}
          aria-labelledby={`country-${country.code}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`country-${country.code}`} className={sectionLabelClass}>
            {country.name}
            <span className="font-normal normal-case tracking-normal">
              · {t("cityCount", { count: country.cities.length })}
            </span>
          </h2>
          <ul className={`${cardClass} flex flex-col divide-y divide-line overflow-hidden`}>
            {country.cities.map((city) => (
              <li key={city.id}>
                <CityRow
                  city={city}
                  onEdit={() => show({ kind: "edit", city, view: "edit" })}
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => show({ kind: "add", country: country.code })}
                className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-medium text-brand-ink transition-colors hover:bg-subtle/60"
              >
                <Plus aria-hidden="true" className="h-5 w-5" />
                {t("addCityIn", { country: country.name })}
              </button>
            </li>
          </ul>
        </section>
      ))}

      <Modal open={open} onClose={close} title={title}>
        {dialog?.kind === "add" && (
          <CityForm
            key={formKey}
            cityId={null}
            initialValues={{ ...emptyCity, country_code: dialog.country }}
            countryOptions={countryOptions}
            hint={dialog.country ? undefined : t("addCountryHint")}
            onCancel={close}
            onDone={close}
          />
        )}
        {dialog?.kind === "edit" && city && dialog.view === "edit" && (
          <>
            <CityForm
              key={formKey}
              cityId={city.id}
              initialValues={{
                name_en: city.name_en,
                name_tk: city.name_tk,
                slug: city.slug,
                country_code: city.country_code,
                group_url: city.group_url ?? "",
              }}
              countryOptions={countryOptions}
              onCancel={close}
              onDone={close}
            />
            <RemoveChoice
              city={city}
              canMerge={countries.some((country) =>
                country.cities.some((other) => other.id !== city.id),
              )}
              onPick={(view) => setDialog({ ...dialog, view })}
            />
          </>
        )}
        {dialog?.kind === "edit" && city && dialog.view === "delete" && (
          <DeleteCity
            key={formKey}
            city={city}
            onBack={() => setDialog({ ...dialog, view: "edit" })}
            onDone={close}
          />
        )}
        {dialog?.kind === "edit" && city && dialog.view === "merge" && (
          <MergeCity
            key={formKey}
            city={city}
            countries={countries}
            onBack={() => setDialog({ ...dialog, view: "edit" })}
            onDone={close}
          />
        )}
      </Modal>
    </>
  );
}

function CityRow({ city, onEdit }: { city: AdminCity; onEdit: () => void }) {
  const t = useTranslations("admin");
  // The name in the other language, so both spellings can be checked at a glance.
  const otherName = city.name === city.name_en ? city.name_tk : city.name_en;

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={t("editCity", { city: city.name })}
      className="group flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-subtle/60"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-display text-lg font-semibold text-brand-ink"
      >
        {city.name.charAt(0)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-ink">{city.name}</span>
        <span className="truncate text-sm text-ink-muted">
          {otherName !== city.name && `${otherName} · `}/city/{city.slug}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-sm text-ink-muted tabular-nums">
        {t("memberCount", { count: city.member_count })}
        <Pencil aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
      </span>
    </button>
  );
}

// Adds a city (cityId null) or edits one. The dialog closes once it's saved,
// and the page behind it reloads its list (refresh() in the action).
function CityForm({
  cityId,
  initialValues,
  countryOptions,
  hint,
  onCancel,
  onDone,
}: {
  cityId: number | null;
  initialValues: CityFormValues;
  countryOptions: CountryOption[];
  hint?: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("admin.form");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(
    async (prevState: CityFormState, formData: FormData) => {
      const next = await saveCity(cityId, prevState, formData);
      if (next.saved) {
        onDone();
      }
      return next;
    },
    { error: "", fieldErrors: {}, saved: false, values: initialValues } satisfies CityFormState,
  );
  const { fieldErrors, values } = state;
  const adding = cityId === null;

  // A new city's link follows its English name until the admin edits the link
  // themselves. An existing city's link only changes when edited, since that
  // breaks links already shared.
  const [nameEn, setNameEn] = useState(initialValues.name_en);
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugEdited, setSlugEdited] = useState(!adding);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {hint && <p className={bodyClass}>{hint}</p>}

      <div className="flex flex-col gap-2">
        <label htmlFor="city-country_code" className={labelClass}>
          {t("country")}
        </label>
        {/* React resets the form after its action runs, and a select resets
            to the option that was its default when it mounted. Keyed on the
            echoed value, so it remounts with what the admin picked. */}
        <select
          key={values.country_code}
          id="city-country_code"
          name="country_code"
          required
          defaultValue={values.country_code}
          aria-invalid={fieldErrors.country_code ? true : undefined}
          aria-describedby={describedBy("city-country_code", fieldErrors.country_code)}
          className={selectClass}
        >
          <option value="">
            {t("chooseCountry")}
          </option>
          {countryOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
        <FieldMessage id="city-country_code" errors={fieldErrors.country_code} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="city-name_en" className={labelClass}>
          {t("nameEn")}
        </label>
        <input
          id="city-name_en"
          name="name_en"
          type="text"
          required
          maxLength={60}
          autoComplete="off"
          value={nameEn}
          onChange={(event) => {
            setNameEn(event.target.value);
            if (!slugEdited) {
              setSlug(slugify(event.target.value));
            }
          }}
          aria-invalid={fieldErrors.name_en ? true : undefined}
          aria-describedby={describedBy("city-name_en", fieldErrors.name_en)}
          className={`h-12 ${fieldClass}`}
        />
        <FieldMessage id="city-name_en" errors={fieldErrors.name_en} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="city-name_tk" className={labelClass}>
          {t("nameTk")}
        </label>
        <input
          id="city-name_tk"
          name="name_tk"
          type="text"
          required
          maxLength={60}
          autoComplete="off"
          defaultValue={values.name_tk}
          aria-invalid={fieldErrors.name_tk ? true : undefined}
          aria-describedby={describedBy("city-name_tk", fieldErrors.name_tk, true)}
          className={`h-12 ${fieldClass}`}
        />
        <FieldMessage id="city-name_tk" errors={fieldErrors.name_tk} hint={t("nameTkHint")} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="city-slug" className={labelClass}>
          {t("slug")}
        </label>
        <input
          id="city-slug"
          name="slug"
          type="text"
          required
          maxLength={60}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(true);
          }}
          aria-invalid={fieldErrors.slug ? true : undefined}
          aria-describedby={describedBy("city-slug", fieldErrors.slug, true)}
          className={`h-12 font-mono text-[15px] ${fieldClass}`}
        />
        <FieldMessage
          id="city-slug"
          errors={fieldErrors.slug}
          hint={
            <>
              {t("slugHint", { slug: slug || "…" })}
              {!adding && ` ${t("slugWarning")}`}
            </>
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="city-group_url" className={labelClass}>
          {t("groupUrl")} <span className="font-normal text-ink-muted">{t("optional")}</span>
        </label>
        <input
          id="city-group_url"
          name="group_url"
          type="url"
          inputMode="url"
          maxLength={300}
          autoComplete="off"
          placeholder="https://chat.whatsapp.com/…"
          defaultValue={values.group_url}
          aria-invalid={fieldErrors.group_url ? true : undefined}
          aria-describedby={describedBy("city-group_url", fieldErrors.group_url, true)}
          className={`h-12 ${fieldClass}`}
        />
        <FieldMessage id="city-group_url" errors={fieldErrors.group_url} hint={t("groupUrlHint")} />
      </div>

      {state.error && (
        <p role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {adding ? (pending ? t("adding") : t("add")) : pending ? t("saving") : t("save")}
        </button>
        <button type="button" onClick={onCancel} className={cancelButtonClass}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

// Under the edit form: delete an empty city, or merge one people live in.
// Each opens its own confirmation step.
function RemoveChoice({
  city,
  canMerge,
  onPick,
}: {
  city: AdminCity;
  canMerge: boolean;
  onPick: (view: "delete" | "merge") => void;
}) {
  const t = useTranslations("admin.remove");
  const buttonClass = `h-11 px-4 ${ghostButtonClass} text-danger hover:text-danger`;

  if (city.member_count === 0) {
    return (
      <div className="flex justify-center border-t border-line pt-4">
        <button type="button" onClick={() => onPick("delete")} className={buttonClass}>
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {t("delete")}
        </button>
      </div>
    );
  }
  if (!canMerge) {
    return null;
  }
  return (
    <div className="flex justify-center border-t border-line pt-4">
      <button type="button" onClick={() => onPick("merge")} className={buttonClass}>
        <Merge aria-hidden="true" className="h-4 w-4" />
        {t("merge")}
      </button>
    </div>
  );
}

function DeleteCity({
  city,
  onBack,
  onDone,
}: {
  city: AdminCity;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("admin.remove");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(async () => {
    const next = await deleteCity(city.id);
    if (!next.error) {
      onDone();
    }
    return next;
  }, initialRemove);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className={bodyClass}>{t("deleteBody", { city: city.name })}</p>
      {state.error && (
        <p role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button type="submit" disabled={pending} className={dangerButtonClass}>
          {pending ? t("deleting") : t("deleteConfirm")}
        </button>
        <button type="button" onClick={onBack} className={cancelButtonClass}>
          {t("back")}
        </button>
      </div>
    </form>
  );
}

// Moves everyone to the picked city, then removes this one. The city's own
// country is listed first, since a duplicate is most likely there.
function MergeCity({
  city,
  countries,
  onBack,
  onDone,
}: {
  city: AdminCity;
  countries: AdminCountry[];
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("admin.remove");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(
    async (prevState: MergeCityState, formData: FormData) => {
      const next = await mergeCity(city.id, prevState, formData);
      if (!next.error) {
        onDone();
      }
      return next;
    },
    initialMerge,
  );

  const groups = [...countries]
    .sort((a, b) => Number(b.code === city.country_code) - Number(a.code === city.country_code))
    .map((country) => ({
      ...country,
      cities: country.cities.filter((other) => other.id !== city.id),
    }))
    .filter((country) => country.cities.length);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className={bodyClass}>
        {t("mergeBody", { city: city.name, count: city.member_count })}
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="merge-into" className={labelClass}>
          {t("mergeInto")}
        </label>
        {/* Keyed on the echoed pick, like the country select in CityForm. */}
        <select
          key={state.into}
          id="merge-into"
          name="into_city"
          required
          defaultValue={state.into}
          aria-invalid={state.error === "mergeTargetRequired" ? true : undefined}
          className={selectClass}
        >
          <option value="">
            {t("chooseCity")}
          </option>
          {groups.map((country) => (
            <optgroup key={country.code} label={country.name}>
              {country.cities.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      {state.error && (
        <p role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button type="submit" disabled={pending} className={dangerButtonClass}>
          {pending ? t("merging") : t("mergeConfirm", { city: city.name })}
        </button>
        <button type="button" onClick={onBack} className={cancelButtonClass}>
          {t("back")}
        </button>
      </div>
    </form>
  );
}
