import { useTranslations } from "next-intl";
import Link from "next/link";
import { Suspense } from "react";
import CardShell from "@/components/card-shell";
import DeleteAccount from "@/components/delete-account";
import LanguageSwitcher from "@/components/language-switcher";
import MyInvites from "@/components/my-invites";
import ProfileFormLoader from "@/components/profile-form-loader";
import { signOut } from "@/lib/account-actions";
import { outlineButtonClass, textLinkClass } from "@/lib/styles";

const sectionClass =
  "flex flex-col gap-3 border-t border-black/[.08] pt-6 dark:border-white/[.145]";
const headingClass = "text-base font-semibold text-black dark:text-zinc-50";

// Only members with a finished profile get here (see proxy.ts).
export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <CardShell>
      <div className="flex flex-col gap-2">
        <Link href="/" className={textLinkClass}>
          ← {t("home")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>
      </div>
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <ProfileFormLoader mode="settings" />
      </Suspense>

      <section aria-labelledby="language" className={sectionClass}>
        <h2 id="language" className={headingClass}>
          {t("language")}
        </h2>
        <LanguageSwitcher />
      </section>

      {/* scroll-mt so the "invite someone" link from an empty city doesn't
          land with the heading under the browser bar. */}
      <section aria-labelledby="my-invites" className={`${sectionClass} scroll-mt-6`}>
        <h2 id="my-invites" className={headingClass}>
          {t("invites")}
        </h2>
        <Suspense
          fallback={
            <div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          }
        >
          <MyInvites />
        </Suspense>
      </section>

      <section aria-labelledby="account" className={sectionClass}>
        <h2 id="account" className={headingClass}>
          {t("account")}
        </h2>
        <form action={signOut}>
          <button type="submit" className={`h-12 w-full ${outlineButtonClass}`}>
            {t("signOut")}
          </button>
        </form>
        <DeleteAccount />
      </section>
    </CardShell>
  );
}
