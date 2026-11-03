import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ContactButtons from "@/components/contact-buttons";
import { Avatar } from "@/components/member-card";
import PageShell from "@/components/page-shell";
import SafetyActions from "@/components/safety-actions";
import { cityName } from "@/lib/city-name";
import { textLinkClass } from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";
import { blockMember, reportMember } from "./actions";

// Postgres rejects a malformed uuid with an error; treat it as not found.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// What your own profile says about who can reach you. Sharing only matters
// once there's a WhatsApp or Telegram contact to share.
function reachNote(contacts: {
  whatsapp: string | null;
  telegram: string | null;
  share_with_verified: boolean;
} | null) {
  if (!contacts?.whatsapp && !contacts?.telegram) {
    return "visibleNoContacts";
  }
  return contacts.share_with_verified ? "visibleShared" : "visibleNotShared";
}

async function Member({
  params,
}: {
  params: PageProps<"/[locale]/member/[id]">["params"];
}) {
  // params is request-time data, so this streams inside Suspense and a
  // notFound() can only send a 200; the proxy sends the real 404.
  const { id } = await params;
  if (!UUID.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [t, locale, { data: claims }, { data: member }] = await Promise.all([
    getTranslations("member"),
    getLocale(),
    supabase.auth.getClaims(),
    // RLS returns the profile only if this viewer may see it (or it's their
    // own): verified, visible, and no block either way. Contacts come back
    // only if the member shares them.
    supabase
      .from("profiles")
      .select(
        "id, nickname, bio, is_visible, cities(slug, name_en, name_tk), contacts(whatsapp, telegram, share_with_verified)",
      )
      .eq("id", id)
      .not("verified_at", "is", null)
      .maybeSingle(),
  ]);

  if (!member) {
    notFound();
  }

  const isSelf = member.id === claims?.claims.sub;
  const nickname = member.nickname ?? t("fallbackName");
  const city = member.cities;
  const citySlug = city?.slug ?? null;

  return (
    <>
      {city && (
        <Link href={`/city/${city.slug}`} className={textLinkClass}>
          ← {cityName(city, locale)}
        </Link>
      )}

      <div className="flex items-center gap-4">
        <Avatar nickname={nickname} />
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {nickname}
          </h1>
          {city && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {cityName(city, locale)}
            </p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {member.bio}
        </p>
      )}

      {isSelf ? (
        // You can always read your own row, so say what others see instead.
        <div className="flex flex-col gap-2 rounded-xl bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p>
            {member.is_visible
              ? t(`self.${reachNote(member.contacts)}`)
              : t("self.hidden")}
          </p>
          <Link href="/settings" className="font-medium underline">
            {t("self.edit")}
          </Link>
        </div>
      ) : (
        <>
          {member.contacts?.whatsapp || member.contacts?.telegram ? (
            <ContactButtons nickname={nickname} contacts={member.contacts} />
          ) : (
            <p className="text-sm text-zinc-500">{t("noContacts", { nickname })}</p>
          )}
          <SafetyActions
            nickname={nickname}
            block={blockMember.bind(null, member.id, citySlug)}
            report={reportMember.bind(null, member.id, citySlug)}
          />
        </>
      )}
    </>
  );
}

export default function MemberPage({ params }: PageProps<"/[locale]/member/[id]">) {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <Member params={params} />
      </Suspense>
    </PageShell>
  );
}
