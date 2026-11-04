"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { redeemInvite, type InviteState } from "@/app/[locale]/invite/actions";
import { errorTextClass, fieldClass, labelClass, primaryButtonClass } from "@/lib/styles";

const initialState: InviteState = { error: "", code: "" };

export default function InviteForm() {
  const t = useTranslations("invite");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(
    redeemInvite,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="code" className={labelClass}>
        {t("codeLabel")}
      </label>
      <input
        id="code"
        name="code"
        type="text"
        required
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        defaultValue={state.code}
        placeholder="ABCDE23456"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "code-error" : undefined}
        // Big, spaced and centred, so a code read off a phone is easy to check.
        className={`h-16 text-center font-mono text-2xl tracking-[0.3em] uppercase placeholder:tracking-[0.3em] ${fieldClass}`}
      />

      {state.error && (
        <p id="code-error" role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      )}

      <button type="submit" disabled={pending} className={`mt-2 ${primaryButtonClass}`}>
        {pending ? t("checking") : t("continue")}
      </button>
    </form>
  );
}
