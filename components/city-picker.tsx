"use client";

import { useId, useMemo, useRef, useState } from "react";

export type City = {
  id: number;
  name_en: string;
  name_tk: string;
  country_code: string;
};

const popupClass =
  "absolute z-10 mt-2 w-full rounded-xl border border-black/[.08] bg-white shadow-lg dark:border-white/[.145] dark:bg-zinc-900";

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
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [selected, setSelected] = useState(
    () => cities.find((city) => String(city.id) === defaultValue) ?? null,
  );
  const [query, setQuery] = useState(selected?.name_en ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    // Show every city while the field still shows the picked one.
    if (!query || query === selected?.name_en) {
      return cities;
    }
    const needle = fold(query.trim());
    return cities.filter(
      (city) =>
        fold(city.name_en).includes(needle) ||
        fold(city.name_tk).includes(needle),
    );
  }, [cities, query, selected]);

  function pick(city: City) {
    setSelected(city);
    setQuery(city.name_en);
    setOpen(false);
  }

  function close() {
    setQuery(selected?.name_en ?? "");
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
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        value={query}
        disabled={!cities.length}
        placeholder={cities.length ? "Search for your city" : "No cities yet"}
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
        className={className}
      />
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Cities"
        hidden={!showList || !matches.length}
        className={`${popupClass} max-h-60 overflow-y-auto py-1`}
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
            className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-black dark:text-zinc-50 ${
              index === active ? "bg-zinc-100 dark:bg-zinc-800" : ""
            }`}
          >
            <span className={city.id === selected?.id ? "font-medium" : ""}>
              {city.name_en}
            </span>
            <span className="text-xs text-zinc-500">{city.country_code}</span>
          </li>
        ))}
      </ul>
      {showList && !matches.length && (
        <p className={`${popupClass} px-4 py-2.5 text-sm text-zinc-500`}>
          No city matches &ldquo;{query.trim()}&rdquo;.
        </p>
      )}
    </div>
  );
}
