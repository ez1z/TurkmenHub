"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import Modal from "@/components/modal";
import { deleteAccount, type DeleteAccountState } from "@/lib/account-actions";
import { dangerButtonClass, errorTextClass, outlineButtonClass } from "@/lib/styles";

const initialState: DeleteAccountState = { error: "" };

// Opens a dialog that says what deleting removes and needs a ticked box
// before it does anything. On success the action signs out and redirects.
export default function DeleteAccount() {
  const t = useTranslations("account");
  const tErrors = useTranslations("errors");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 w-full rounded-full border border-red-600/30 text-sm font-medium text-red-600 transition-colors hover:bg-red-600/[.06] dark:border-red-400/30 dark:text-red-400"
      >
        {t("delete")}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("deleteTitle")}>
        <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>{t("deleteBody")}</p>
          <p>{t("deleteKept")}</p>
        </div>
        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirm"
              required
              aria-describedby={state.error ? "delete-error" : undefined}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            {t("deleteConfirm")}
          </label>
          {state.error && (
            <p id="delete-error" role="alert" className={errorTextClass}>
              {tErrors(state.error)}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button type="submit" disabled={pending} className={dangerButtonClass}>
              {pending ? t("deleting") : t("deleteButton")}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`h-12 w-full ${outlineButtonClass}`}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
