"use client";

import { Ban, Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import type { ReportState } from "@/app/[locale]/member/[id]/actions";
import Modal from "@/components/modal";
import { REPORT_REASONS } from "@/lib/report-reasons";
import {
  dangerButtonClass,
  errorTextClass,
  fieldClass,
  ghostButtonClass,
  labelClass,
  outlineButtonClass,
  primaryButtonClass,
} from "@/lib/styles";

const smallButtonClass = `h-10 px-4 ${ghostButtonClass}`;
const cancelButtonClass = `h-12 w-full ${outlineButtonClass}`;
const bodyClass = "text-sm leading-relaxed text-ink-muted";
const checkboxClass = "mt-0.5 h-5 w-5 shrink-0 accent-brand";

const initialReport: ReportState = { error: "", sent: false };

// Block and Report for someone else's profile. Both actions come bound to
// this member from the page. A block, or a report that also blocks, leaves
// the profile (it's hidden from now on), so only a plain report shows a
// "sent" message here.
export default function SafetyActions({
  nickname,
  block,
  report,
}: {
  nickname: string;
  block: () => Promise<{ error: "" | "generic" }>;
  report: (state: ReportState, formData: FormData) => Promise<ReportState>;
}) {
  const t = useTranslations("safety");
  const tErrors = useTranslations("errors");
  const [dialog, setDialog] = useState<"block" | "report" | null>(null);
  // Keyed so reopening the report dialog starts with a fresh form.
  const [reportKey, setReportKey] = useState(0);

  const [blockState, blockAction, blocking] = useActionState(
    async () => block(),
    { error: "" } as Awaited<ReturnType<typeof block>>,
  );

  function openReport() {
    setReportKey((key) => key + 1);
    setDialog("report");
  }

  return (
    <>
      <div className="flex justify-center gap-2 border-t border-line pt-6">
        <button type="button" onClick={openReport} className={smallButtonClass}>
          <Flag aria-hidden="true" className="h-4 w-4" />
          {t("report")}
        </button>
        <button type="button" onClick={() => setDialog("block")} className={smallButtonClass}>
          <Ban aria-hidden="true" className="h-4 w-4" />
          {t("block")}
        </button>
      </div>

      <Modal
        open={dialog === "block"}
        onClose={() => setDialog(null)}
        title={t("blockTitle", { nickname })}
      >
        <p className={bodyClass}>{t("blockBody", { nickname })}</p>
        {blockState.error && (
          <p role="alert" className={errorTextClass}>
            {tErrors(blockState.error)}
          </p>
        )}
        <form action={blockAction} className="flex flex-col gap-3">
          <button type="submit" disabled={blocking} className={dangerButtonClass}>
            {blocking ? t("blocking") : t("blockConfirm")}
          </button>
          <button type="button" onClick={() => setDialog(null)} className={cancelButtonClass}>
            {t("cancel")}
          </button>
        </form>
      </Modal>

      <Modal
        open={dialog === "report"}
        onClose={() => setDialog(null)}
        title={t("reportTitle", { nickname })}
      >
        <ReportForm
          key={reportKey}
          nickname={nickname}
          report={report}
          onDone={() => setDialog(null)}
        />
      </Modal>
    </>
  );
}

function ReportForm({
  nickname,
  report,
  onDone,
}: {
  nickname: string;
  report: (state: ReportState, formData: FormData) => Promise<ReportState>;
  onDone: () => void;
}) {
  const t = useTranslations("safety");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(report, initialReport);

  if (state.sent) {
    return (
      <>
        <p role="status" className={bodyClass}>
          {t("reportSent")}
        </p>
        <button type="button" onClick={onDone} className={primaryButtonClass}>
          {t("close")}
        </button>
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={state.error === "reasonRequired" ? "reason-error" : undefined}
      >
        <legend className={`mb-2 ${labelClass}`}>{t("reasonLegend")}</legend>
        {/* Each reason is a whole tappable row; the picked one turns green. */}
        {REPORT_REASONS.map((reason) => (
          <label
            key={reason}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line px-4 text-sm text-ink transition-colors hover:bg-subtle has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink"
          >
            <input
              type="radio"
              name="reason"
              value={reason}
              required
              className="h-4 w-4 accent-brand"
            />
            {t(`reasons.${reason}`)}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="report-details" className={labelClass}>
          {t("detailsLabel")}{" "}
          <span className="font-normal text-ink-muted">{t("optional")}</span>
        </label>
        <textarea
          id="report-details"
          name="details"
          rows={3}
          maxLength={1000}
          className={`resize-none py-3 ${fieldClass}`}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input type="checkbox" name="also_block" className={checkboxClass} />
        {t("alsoBlock", { nickname })}
      </label>

      {state.error && (
        <p id="reason-error" role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? t("sending") : t("send")}
        </button>
        <button type="button" onClick={onDone} className={cancelButtonClass}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
