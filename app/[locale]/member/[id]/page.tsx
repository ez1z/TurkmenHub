import { Eye, EyeOff, MapPin, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import Avatar from "@/components/avatar";
import ContactButtons from "@/components/contact-buttons";
import PageShell, { BackLink } from "@/components/page-shell";
import SafetyActions from "@/components/safety-actions";
import { cityName } from "@/lib/city-name";
import {
  cardClass,
  noteClass,
  outlineButtonClass,
  pageTitleClass,
  skeletonClass,
} from "@/lib/styles";
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

// The top bar's back link and the page body both need the member, so the
// query runs once per request and both read the result.
const loadMember = cache(async (id: string) => {
  if (!UUID.test(id)) {
    return null;
  }
  const supabase = await createClient();
  const [{ data: claims }, { data: member }] = await Promise.all([
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
  return member ? { member, isSelf: member.id === claims?.claims.sub } : null;
});

// Back to the member's city, once we know which one it is.
async function Back({ params }: { params: PageProps<"/[locale]/member/[id]">["params"] }) {
  const { id } = await params;
  const [data, locale, tCommon] = await Promise.all([
    loadMember(id),
    getLocale(),
    getTranslations("common"),
  ]);
  const city = data?.member.cities;
  return city ? (
    <BackLink href={`/city/${city.slug}`} label={cityName(city, locale)} />
  ) : (
    <BackLink href="/" label={tCommon("back")} />
  );
}

async function Member({
  params,
}: {
  params: PageProps<"/[locale]/member/[id]">["params"];
}) {
  // params is request-time data, so this streams inside Suspense and a
  // notFound() can only send a 200; the proxy sends the real 404.
  const { id } = await params;
  const [t, locale, data] = await Promise.all([
    getTranslations("member"),
    getLocale(),
    loadMember(id),
  ]);

  if (!data) {
    notFound();
  }

  const { member, isSelf } = data;
  const nickname = member.nickname ?? t("fallbackName");
  const city = member.cities;
  const citySlug = city?.slug ?? null;
  const hasContacts = Boolean(member.contacts?.whatsapp || member.contacts?.telegram);

  return (
    <>
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <Avatar nickname={nickname} size="lg" />
        <div className="flex flex-col items-center gap-1.5">
          <h1 className={pageTitleClass}>{nickname}</h1>
          {city && (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              {cityName(city, locale)}
            </p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className={`${cardClass} px-5 py-4 leading-relaxed whitespace-pre-line text-ink`}>
          {member.bio}
        </p>
      )}

      {isSelf ? (
        // You can always read your own row, so say what others see instead.
        <div className="flex flex-col gap-4">
          <div className={noteClass}>
            {member.is_visible ? (
              <Eye aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <EyeOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>
              {member.is_visible
                ? t(`self.${reachNote(member.contacts)}`)
                : t("self.hidden")}
            </p>
          </div>
          <Link href="/settings" className={`h-12 w-full ${outlineButtonClass}`}>
            <Pencil aria-hidden="true" className="h-4 w-4" />
            {t("self.edit")}
          </Link>
        </div>
      ) : (
        <>
          {hasContacts ? (
            <ContactButtons nickname={nickname} contacts={member.contacts} size="lg" />
          ) : (
            <p className={`${noteClass} justify-center text-center`}>
              {t("noContacts", { nickname })}
            </p>
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
  const tCommon = useTranslations("common");

  return (
    <PageShell
      back={
        <Suspense fallback={<BackLink href="/" label={tCommon("back")} />}>
          <Back params={params} />
        </Suspense>
      }
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4 pt-2">
            <div className={`${skeletonClass} h-20 w-20 rounded-full`} />
            <div className={`${skeletonClass} h-9 w-40 rounded-xl`} />
            <div className={`${skeletonClass} mt-4 h-24 w-full`} />
          </div>
        }
      >
        <Member params={params} />
      </Suspense>
    </PageShell>
  );
}
