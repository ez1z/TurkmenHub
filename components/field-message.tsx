import { useTranslations } from "next-intl";
import type { ErrorKey } from "@/lib/error-key";
import { errorTextClass, hintClass } from "@/lib/styles";

// The id of the message under a field: its error if it has one, else its
// hint. Both are built from id, which names the field within the page.
export function describedBy(id: string, errors: string[] | undefined, hasHint = false) {
  if (errors) {
    return `${id}-error`;
  }
  return hasHint ? `${id}-hint` : undefined;
}

// The field's first error, or its hint when there's none. Schema errors are
// keys in the "errors" messages (see lib/*-schema.ts).
export function FieldMessage({
  id,
  errors,
  hint,
}: {
  id: string;
  errors: string[] | undefined;
  hint?: React.ReactNode;
}) {
  const tErrors = useTranslations("errors");

  if (errors) {
    return (
      <p id={`${id}-error`} className={errorTextClass}>
        {tErrors(errors[0] as ErrorKey)}
      </p>
    );
  }
  return hint ? (
    <p id={`${id}-hint`} className={hintClass}>
      {hint}
    </p>
  ) : null;
}
