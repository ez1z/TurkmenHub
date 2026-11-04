"use client";

import { Check, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import { cityName } from "@/lib/city-name";
import { countryName } from "@/lib/country-name";

export type City = {
  id: number;
  name_en: string;
  name_tk: string;
  country_code: string;
};

const popupClass =
  "absolute z-20 mt-2 w-full rounded-2xl border border-line bg-surface shadow-xl";

// Lowercase without accents, so "asgabat" finds "Aşgabat" and "turkmenabat"
// finds "Türkmenabat". NFD splits ş, ü, ň, ý, ž and ä into a base letter plus
// a mark; ı is the one letter it doesn't split.
function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .toLowerCase();
}

// A searchable list of cities that only ever submits a city_id from the list.
// Typing filters the list; leaving the field without picking a city puts the
// last picked city back, so free text can never be submitted.
export default function CityPicker({
  id,
  name,
  cities,
  defaultValue,
  invalid,
  describedBy,
  className,
}: {
  id: string;
  name: string;
  cities: City[];
  defaultValue: string;
  invalid: boolean;
  describedBy?: string;
  className: string;
}) {
  const t = useTranslations("cityPicker");
  const locale = useLocale();
  const label = (city: City | null) => (city ? cityName(city, locale) : "");
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [selected, setSelected] = useState(
    () => cities.find((city) => String(city.id) === defaultValue) ?? null,
  );
  const selectedLabel = label(selected);
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    // Show every city while the field still shows the picked one.
    if (!query || query === selectedLabel) {
      return cities;
    }
    // Either spelling finds a city, whatever language the page is in.
    const needle = fold(query.trim());
    return cities.filter(
      (city) =>
        fold(city.name_en).includes(needle) ||
        fold(city.name_tk).includes(needle),
    );
  }, [cities, query, selectedLabel]);

  function pick(city: City) {
    setSelected(city);
    setQuery(label(city));
    setOpen(false);
  }

  function close() {
    setQuery(selectedLabel);
    setOpen(false);
  }

  function moveTo(index: number) {
    setActive(index);
    listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open || !matches.length) {
        setOpen(true);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      moveTo((active + step + matches.length) % matches.length);
    } else if (event.key === "Enter" && open) {
      // Pick the highlighted city instead of submitting the form.
      event.preventDefault();
      if (matches[active]) {
        pick(matches[active]);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  }

  const showList = open && cities.length > 0;

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-ink-subtle"
      />
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        value={query}
        disabled={!cities.length}
        placeholder={cities.length ? t("search") : t("noCities")}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && matches[active] ? `${listId}-${matches[active].id}` : undefined
        }
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(event) => {
          event.target.select();
          setOpen(true);
        }}
        onClick={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
        className={`${className} pl-11`}
      />
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t("listLabel")}
        hidden={!showList || !matches.length}
        className={`${popupClass} max-h-64 overflow-y-auto p-1.5`}
      >
        {matches.map((city, index) => (
          <li
            key={city.id}
            id={`${listId}-${city.id}`}
            role="option"
            aria-selected={city.id === selected?.id}
            // mousedown fires before the input's blur, which would close the
            // list before the click lands.
            onMouseDown={(event) => {
              event.preventDefault();
              pick(city);
            }}
            onMouseMove={() => setActive(index)}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-ink ${
              index === active ? "bg-subtle" : ""
            }`}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`truncate ${city.id === selected?.id ? "font-medium" : ""}`}>
                {label(city)}
              </span>
              <span className="truncate text-xs text-ink-muted">
                {countryName(city.country_code, locale)}
              </span>
            </span>
            {city.id === selected?.id && (
              <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" />
            )}
          </li>
        ))}
      </ul>
      {showList && !matches.length && (
        <p className={`${popupClass} px-4 py-3 text-sm text-ink-muted`}>
          {t("noMatch", { query: query.trim() })}
        </p>
      )}
    </div>
  );
}
