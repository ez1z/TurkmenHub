// One per locale: building a DisplayNames loads its ICU data, and country
// lists call this once per country.
const displayNames = new Map<string, Intl.DisplayNames>();

// A country's name in the page language, from its ISO code ("MY" →
// "Malaysia" / "Malaýziýa"). Node's ICU data has Turkmen names too. Falls
// back to the code if the runtime doesn't know it.
export function countryName(code: string | null | undefined, locale: string) {
  if (!code) {
    return "";
  }
  try {
    let names = displayNames.get(locale);
    if (!names) {
      names = new Intl.DisplayNames([locale], { type: "region" });
      displayNames.set(locale, names);
    }
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}
