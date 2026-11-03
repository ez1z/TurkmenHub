import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import CardShell from "@/components/card-shell";
import GoogleSignInButton from "@/components/google-sign-in-button";
import LanguageSwitcher from "@/components/language-switcher";
import { errorTextClass } from "@/lib/styles";

// Why the user is here, from the query string: a failed Google sign-in, a
// session that expired (set by the proxy), or an account they just deleted.
// searchParams is request-time data, so it renders inside Suspense while the
// rest of the page stays in the prerendered shell.
async function Notice({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/welcome">["searchParams"];
}) {
  const [{ error, session, deleted }, t] = await Promise.all([
    searchParams,
    getTranslations("welcome"),
  ]);

  if (error === "oauth") {
    return (
      <p role="alert" className={errorTextClass}>
        {t("oauthError")}
      </p>
    );
  }
  if (deleted === "1") {
    return (
      <p role="status" className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {t("deleted")}
      </p>
    );
  }
  if (session === "expired") {
    return (
      <p role="status" className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {t("sessionExpired")}
      </p>
    );
  }
  return null;
}

export default function WelcomePage({ searchParams }: PageProps<"/[locale]/welcome">) {
  const t = useTranslations("welcome");

  return (
    <CardShell>
      <LanguageSwitcher />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>
      </div>
      <Suspense>
        <Notice searchParams={searchParams} />
      </Suspense>
      <GoogleSignInButton />
    </CardShell>
  );
}
