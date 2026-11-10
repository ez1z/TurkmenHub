import { ExternalLink, MapPin, Sparkles, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import BrandMark from "@/components/brand-mark";
import CopyLinkButton from "@/components/copy-link-button";
import MemberCard, { type Member } from "@/components/member-card";
import PageShell, { BackLink } from "@/components/page-shell";
import { cityName } from "@/lib/city-name";
import { countryName } from "@/lib/country-name";
import {
  cardClass,
  pageTitleClass,
  primaryButtonClass,
  sectionLabelClass,
  skeletonClass,
} from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Loads the city and the members this viewer may see. Kept out of the
// component because the "new this week" cutoff depends on the current time.
async function loadCity(slug: string) {
  const supabase = await createClient();

  // All three at once: members are matched on the city's slug, so they don't
  // wait for the city row.
  //
  // RLS already hides hidden, unverified and blocked members (both ways), but
  // a member can always read their own profile, so filter for visible and
  // verified here too. contacts comes back null unless RLS lets this viewer
  // read it, which is what decides whether contact buttons show.
  const [{ data: claims }, { data: city }, { data: members }] =
    await Promise.all([
      supabase.auth.getClaims(),
      supabase
        .from("city_member_counts")
        .select("id, name_en, name_tk, country_code, group_url, member_count")
        .eq("slug", slug)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select(
          "id, nickname, bio, verified_at, cities!inner(slug), contacts(whatsapp, telegram)",
        )
        .eq("cities.slug", slug)
        .eq("is_visible", true)
        .not("verified_at", "is", null)
        .order("nickname"),
    ]);

  if (!city?.id) {
    return null;
  }

  // New means newly verified, i.e. just joined TurkmenHub, not when they
  // first signed in with Google, which can be days before they got a code.
  const weekAgo = Date.now() - WEEK_MS;
  const newThisWeek = (members ?? [])
    .filter((member) => Date.parse(member.verified_at ?? "") >= weekAgo)
    .sort((a, b) => (b.verified_at ?? "").localeCompare(a.verified_at ?? ""));

  return {
    city,
    members: members ?? [],
    newThisWeek,
    userId: claims?.claims.sub,
  };
}

// params is request-time data (cities aren't prerendered), so the page reads
// it inside Suspense while the rest stays in the prerendered shell. That also
// means notFound() here can only send a 200; the proxy sends the real 404.
async function City({ params }: { params: PageProps<"/[locale]/city/[slug]">["params"] }) {
  const { slug } = await params;
  const [data, t, tHome, locale] = await Promise.all([
    loadCity(slug),
    getTranslations("city"),
    getTranslations("home"),
    getLocale(),
  ]);

  if (!data) {
    notFound();
  }

  const { city, members, newThisWeek, userId } = data;
  const name = cityName({ name_en: city.name_en!, name_tk: city.name_tk! }, locale);
  const country = countryName(city.country_code, locale);
  // Only you, or nobody you can see yet.
  const onlyYou = members.length === 1 && members[0].id === userId;

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className={`${pageTitleClass} text-4xl`}>{name}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
            {country && (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {country}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users aria-hidden="true" className="h-4 w-4" />
              {tHome("memberCount", { count: city.member_count ?? 0 })}
            </span>
          </p>
        </div>
        {city.group_url && (
          <a
            href={city.group_url}
            target="_blank"
            rel="noopener noreferrer"
            className={primaryButtonClass}
          >
            {t("joinGroup")}
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        )}
      </div>

      {newThisWeek.length > 0 && (
        <MemberList
          id="new-this-week"
          label={
            <span className="flex items-center gap-1.5 text-accent">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              {t("newThisWeek")}
            </span>
          }
          members={newThisWeek}
          userId={userId}
        />
      )}

      {members.length > 0 && !onlyYou ? (
        <MemberList id="members" label={t("members")} members={members} userId={userId} />
      ) : (
        <section aria-labelledby="members" className="flex flex-col gap-3">
          <h2 id="members" className={sectionLabelClass}>
            {t("members")}
          </h2>
          {onlyYou && (
            <ul className={`${cardClass} overflow-hidden`}>
              <MemberCard member={members[0]} isSelf />
            </ul>
          )}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line px-6 py-8 text-center">
            <BrandMark className="h-10 w-10 opacity-80" />
            <p className="max-w-xs text-sm leading-relaxed text-ink-muted text-pretty">
              {onlyYou ? t("onlyYou", { city: name }) : t("empty", { city: name })}
            </p>
            <CopyLinkButton
              path={`/city/${slug}`}
              label={t("copyLinkLabel", { city: name })}
            />
          </div>
        </section>
      )}
    </>
  );
}

function MemberList({
  id,
  label,
  members,
  userId,
}: {
  id: string;
  label: React.ReactNode;
  members: Member[];
  userId: string | undefined;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className={sectionLabelClass}>
        {label}
      </h2>
      <ul className={`${cardClass} flex flex-col divide-y divide-line overflow-hidden`}>
        {members.map((member) => (
          <MemberCard key={member.id} member={member} isSelf={member.id === userId} />
        ))}
      </ul>
    </section>
  );
}

// Shareable: a signed-out visitor is sent to sign in and brought back here
// (see lib/return-to.ts).
export default function CityPage({ params }: PageProps<"/[locale]/city/[slug]">) {
  const t = useTranslations("city");

  return (
    <PageShell back={<BackLink href="/" label={t("allCities")} />}>
      <Suspense
        fallback={
          <>
            <div className="flex flex-col gap-3">
              <div className={`${skeletonClass} h-10 w-2/3 rounded-xl`} />
              <div className={`${skeletonClass} h-5 w-1/2 rounded-full`} />
            </div>
            <div className={`${skeletonClass} h-96`} />
          </>
        }
      >
        <City params={params} />
      </Suspense>
    </PageShell>
  );
}
