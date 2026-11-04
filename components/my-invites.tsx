import { Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import CopyButton from "@/components/copy-button";
import { hintClass } from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

// The codes redeem_invite() gave this member, and which ones are spent. RLS
// only returns codes the member created. Reads cookies, so render it inside
// <Suspense>.
export default async function MyInvites() {
  const supabase = await createClient();
  const [t, { data: claims }] = await Promise.all([
    getTranslations("invites"),
    supabase.auth.getClaims(),
  ]);
  const userId = claims?.claims.sub ?? "";

  const { data: invites } = await supabase
    .from("invites")
    .select("code, used_at")
    .eq("created_by", userId)
    .order("created_at")
    .order("code");

  if (!invites?.length) {
    return (
      <p className={`px-4 py-4 ${hintClass}`}>{t("none")}</p>
    );
  }

  const left = invites.filter((invite) => !invite.used_at).length;

  return (
    <div className="flex flex-col">
      <p className={`px-4 pt-4 pb-3 ${hintClass}`}>
        {t("left", { left, total: invites.length })}
      </p>
      {/* Codes look like tickets: a stub icon, then the code to copy. */}
      <ul className="flex flex-col divide-y divide-line border-t border-line">
        {invites.map((invite) => (
          <li
            key={invite.code}
            className="flex min-h-16 items-center justify-between gap-3 px-4 py-2"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  invite.used_at ? "bg-subtle text-ink-subtle" : "bg-accent-soft text-accent"
                }`}
              >
                <Ticket className="h-4 w-4" />
              </span>
              <span
                className={`truncate font-mono text-[15px] tracking-[0.18em] ${
                  invite.used_at ? "text-ink-subtle line-through" : "font-medium text-ink"
                }`}
              >
                {invite.code}
              </span>
            </span>
            {invite.used_at ? (
              <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-ink-muted">
                {t("used")}
              </span>
            ) : (
              <CopyButton
                text={invite.code}
                label={t("copyLabel", { code: invite.code })}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
