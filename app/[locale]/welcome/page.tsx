import { CircleAlert, Eye, Info, MessageCircle, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import BrandMark from "@/components/brand-mark";
import CardShell from "@/components/card-shell";
import GoogleSignInButton from "@/components/google-sign-in-button";
import LanguageSwitcher from "@/components/language-switcher";
import { leadClass, noteClass } from "@/lib/styles";

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
      <p role="alert" className={`${noteClass} bg-danger-soft text-danger`}>
        <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {t("oauthError")}
      </p>
    );
  }
  const status = deleted === "1" ? "deleted" : session === "expired" ? "sessionExpired" : null;
  if (status) {
    return (
      <p role="status" className={noteClass}>
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        {t(status)}
      </p>
    );
  }
  return null;
}

const POINTS = [
  { key: "inviteOnly", Icon: ShieldCheck },
  { key: "privacy", Icon: Eye },
  { key: "chat", Icon: MessageCircle },
] as const;

export default function WelcomePage({ searchParams }: PageProps<"/[locale]/welcome">) {
  const t = useTranslations("welcome");

  return (
    <CardShell>
      {/* Each language names itself, so it's findable before anything else. */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-col gap-5">
        {/* The mark leads into a carpet stripe, like the flag's border. */}
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-12 shrink-0" />
          <span aria-hidden="true" className="carpet-band h-3.5 flex-1 bg-accent/60" />
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-display text-lg font-semibold text-brand">TurkmenHub</p>
          <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-ink text-balance">
            {t("tagline")}
          </h1>
          <p className={leadClass}>{t("intro")}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {POINTS.map(({ key, Icon }) => (
          <li key={key} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink"
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="pt-1.5">{t(`points.${key}`)}</span>
          </li>
        ))}
      </ul>

      <Suspense>
        <Notice searchParams={searchParams} />
      </Suspense>
      <GoogleSignInButton />
    </CardShell>
  );
}
