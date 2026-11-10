"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { setAdmin, type SetAdminState } from "@/app/[locale]/admin/actions";
import {
  cardClass,
  errorTextClass,
  fieldClass,
  ghostButtonClass,
  hintClass,
  labelClass,
  outlineButtonClass,
  sectionLabelClass,
} from "@/lib/styles";

export type TeamMember = {
  id: string;
  nickname: string;
  is_admin: boolean;
  is_superuser: boolean;
};

type AddAdminState = {
  error: SetAdminState["error"] | "memberRequired";
  // The picked member, echoed back so the select keeps it when adding fails.
  member: string;
};

// The superuser's list of admins, with a way to add and remove them. Members
// are sorted by nickname already.
export default function AdminTeam({ members }: { members: TeamMember[] }) {
  const t = useTranslations("admin.team");
  const admins = members.filter((member) => member.is_admin);
  const candidates = members.filter((member) => !member.is_admin);

  return (
    <section aria-labelledby="admin-team" className="flex flex-col gap-3">
      <h2 id="admin-team" className={sectionLabelClass}>
        {t("title")}
      </h2>
      <p className={hintClass}>{t("intro")}</p>
      <ul className={`${cardClass} flex flex-col divide-y divide-line overflow-hidden`}>
        {admins.map((admin) => (
          <li key={admin.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
            <span className="min-w-0 flex-1 truncate font-medium text-ink">
              {admin.nickname}
            </span>
            {admin.is_superuser ? (
              <span className="text-sm text-ink-muted">{t("superuser")}</span>
            ) : (
              <RemoveAdmin member={admin} />
            )}
          </li>
        ))}
      </ul>
      <AddAdmin candidates={candidates} />
    </section>
  );
}

function RemoveAdmin({ member }: { member: TeamMember }) {
  const t = useTranslations("admin.team");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(
    () => setAdmin(member.id, false),
    { error: "" } satisfies SetAdminState,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      {state.error && (
        <p role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-label={t("removeLabel", { name: member.nickname })}
        className={`h-10 shrink-0 px-3 ${ghostButtonClass} text-danger hover:text-danger`}
      >
        <UserMinus aria-hidden="true" className="h-4 w-4" />
        {pending ? t("removing") : t("remove")}
      </button>
    </form>
  );
}

function AddAdmin({ candidates }: { candidates: TeamMember[] }) {
  const t = useTranslations("admin.team");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(
    async (_prevState: AddAdminState, formData: FormData): Promise<AddAdminState> => {
      const member = String(formData.get("member") ?? "");
      if (!member) {
        return { error: "memberRequired", member };
      }
      const next = await setAdmin(member, true);
      return { error: next.error, member: next.error ? member : "" };
    },
    { error: "", member: "" } satisfies AddAdminState,
  );

  if (!candidates.length) {
    return <p className={hintClass}>{t("noCandidates")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="admin-member" className={labelClass}>
        {t("addLabel")}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Keyed on the echoed pick, like the selects in admin-cities.tsx. */}
        <select
          key={state.member}
          id="admin-member"
          name="member"
          required
          defaultValue={state.member}
          aria-invalid={state.error === "memberRequired" ? true : undefined}
          aria-describedby="admin-member-hint"
          className={`h-12 flex-1 ${fieldClass}`}
        >
          <option value="">{t("chooseMember")}</option>
          {candidates.map((member) => (
            <option key={member.id} value={member.id}>
              {member.nickname}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className={`h-12 shrink-0 px-5 ${outlineButtonClass}`}
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          {pending ? t("adding") : t("add")}
        </button>
      </div>
      {state.error ? (
        <p id="admin-member-hint" role="alert" className={errorTextClass}>
          {tErrors(state.error)}
        </p>
      ) : (
        <p id="admin-member-hint" className={hintClass}>
          {t("hint")}
        </p>
      )}
    </form>
  );
}
