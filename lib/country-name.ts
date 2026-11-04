// A country's name in the page language, from its ISO code ("MY" →
// "Malaysia" / "Malaýziýa"). Node's ICU data has Turkmen names too. Falls
// back to the code if the runtime doesn't know it.
export function countryName(code: string | null | undefined, locale: string) {
  if (!code) {
    return "";
  }
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
