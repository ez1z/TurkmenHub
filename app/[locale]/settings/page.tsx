import { ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import DeleteAccount from "@/components/delete-account";
import LanguageSwitcher from "@/components/language-switcher";
import MyInvites from "@/components/my-invites";
import PageShell, { BackLink } from "@/components/page-shell";
import ProfileFormLoader from "@/components/profile-form-loader";
import { signOut } from "@/lib/account-actions";
import { isAdmin } from "@/lib/admin";
import {
  cardClass,
  leadClass,
  pageTitleClass,
  sectionLabelClass,
  skeletonClass,
} from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

// A titled group, like the sections of a phone's settings app.
function Group({
  id,
  title,
  children,
  className = "",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`flex flex-col gap-3 ${className}`}>
      <h2 id={id} className={sectionLabelClass}>
        {title}
      </h2>
      <div className={`${cardClass} overflow-hidden`}>{children}</div>
    </section>
  );
}

// Shown to admins only. If the check fails, leave it out rather than break
// the page: the admin page itself is still reachable.
async function AdminGroup() {
  const supabase = await createClient();
  const [t, admin] = await Promise.all([
    getTranslations("settings"),
    isAdmin(supabase).catch(() => false),
  ]);
  if (!admin) {
    return null;
  }

  return (
    <Group id="admin" title={t("admin")}>
      <Link
        href="/admin"
        className="flex min-h-14 w-full items-center gap-3 px-4 font-medium text-ink transition-colors hover:bg-subtle"
      >
        <ShieldCheck aria-hidden="true" className="h-5 w-5 text-ink-muted" />
        <span className="flex-1">{t("adminLink")}</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-subtle" />
      </Link>
    </Group>
  );
}

// Only members with a finished profile get here (see proxy.ts).
export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <PageShell back={<BackLink href="/" label={t("home")} />}>
      <div className="flex flex-col gap-2">
        <h1 className={pageTitleClass}>{t("title")}</h1>
        <p className={leadClass}>{t("intro")}</p>
      </div>

      <div className={`${cardClass} p-5 sm:p-6`}>
        <Suspense fallback={<div className={`${skeletonClass} h-[36rem]`} />}>
          <ProfileFormLoader mode="settings" />
        </Suspense>
      </div>

      <Group id="language" title={t("language")}>
        <div className="p-3">
          <LanguageSwitcher />
        </div>
      </Group>

      {/* scroll-mt so the "invite someone" link from an empty city doesn't
          land with the heading under the sticky top bar. */}
      <Group id="my-invites" title={t("invites")} className="scroll-mt-20">
        <Suspense fallback={<div className={`${skeletonClass} h-48 rounded-none`} />}>
          <MyInvites />
        </Suspense>
      </Group>

      <Suspense fallback={null}>
        <AdminGroup />
      </Suspense>

      <Group id="account" title={t("account")}>
        <div className="flex flex-col divide-y divide-line">
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left font-medium text-ink transition-colors hover:bg-subtle"
            >
              <LogOut aria-hidden="true" className="h-5 w-5 text-ink-muted" />
              {t("signOut")}
            </button>
          </form>
          <DeleteAccount />
        </div>
      </Group>
    </PageShell>
  );
}
