import type { Messages } from "next-intl";

// A message in the "errors" namespace. Server Actions and the profile schema
// return these keys instead of text, and the form shows them translated.
export type ErrorKey = keyof Messages["errors"];
