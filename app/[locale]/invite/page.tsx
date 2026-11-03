import { useTranslations } from "next-intl";
import CardShell from "@/components/card-shell";
import InviteForm from "@/components/invite-form";
import { signOut } from "@/lib/account-actions";
import { textLinkClass } from "@/lib/styles";

// Unverified users land here (see proxy.ts) until they redeem an invite code.
export default function InvitePage() {
  const t = useTranslations("invite");

  return (
    <CardShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>
      </div>
      <InviteForm />
      {/* Signed in with the wrong Google account, or just leaving. */}
      <form action={signOut} className="flex justify-center">
        <button type="submit" className={textLinkClass}>
          {t("signOut")}
        </button>
      </form>
    </CardShell>
  );
}
