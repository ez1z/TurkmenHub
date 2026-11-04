"use client";

import { Trash2 } from "lucide-react";
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
        className="flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium text-danger transition-colors hover:bg-danger-soft"
      >
        <Trash2 aria-hidden="true" className="h-5 w-5" />
        {t("delete")}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("deleteTitle")}>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-ink-muted">
          <p>{t("deleteBody")}</p>
          <p>{t("deleteKept")}</p>
        </div>
        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-danger-soft p-4 text-sm text-ink">
            <input
              type="checkbox"
              name="confirm"
              required
              aria-describedby={state.error ? "delete-error" : undefined}
              className="mt-0.5 h-5 w-5 shrink-0 accent-danger"
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
