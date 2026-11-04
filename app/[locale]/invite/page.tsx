import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import CardShell from "@/components/card-shell";
import InviteForm from "@/components/invite-form";
import { signOut } from "@/lib/account-actions";
import { ghostButtonClass, leadClass, pageTitleClass } from "@/lib/styles";

// Unverified users land here (see proxy.ts) until they redeem an invite code.
export default function InvitePage() {
  const t = useTranslations("invite");

  return (
    <CardShell step={1}>
      <div className="flex flex-col gap-2">
        <h1 className={pageTitleClass}>{t("title")}</h1>
        <p className={leadClass}>{t("intro")}</p>
      </div>
      <InviteForm />
      {/* Signed in with the wrong Google account, or just leaving. */}
      <form action={signOut} className="flex justify-center">
        <button type="submit" className={`h-10 px-4 ${ghostButtonClass}`}>
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {t("signOut")}
        </button>
      </form>
    </CardShell>
  );
}
