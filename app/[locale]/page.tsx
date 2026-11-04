import { ChevronRight, MapPin, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";
import PageShell from "@/components/page-shell";
import { cityName } from "@/lib/city-name";
import { countryName } from "@/lib/country-name";
import {
  cardClass,
  leadClass,
  pageTitleClass,
  sectionLabelClass,
  skeletonClass,
} from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

type CityRow = {
  id: number;
  slug: string;
  name: string;
  country: string;
  member_count: number;
};

// Your own city, up top and in brand green, like a home base.
function OwnCity({ city }: { city: CityRow }) {
  const t = useTranslations("home");

  return (
    <section aria-labelledby="your-city" className="flex flex-col gap-3">
      <h2 id="your-city" className={sectionLabelClass}>
        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
        {t("yourCity")}
      </h2>
      <Link
        href={`/city/${city.slug}`}
        className="group relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-feature p-6 text-on-feature shadow-card transition-[scale] duration-150 active:scale-[.99]"
      >
        <span
          aria-hidden="true"
          className="carpet-band absolute inset-x-0 top-0 h-3 bg-on-feature/20"
        />
        <span className="flex flex-col gap-1 pt-2">
          <span className="font-display text-3xl font-semibold tracking-tight">
            {city.name}
          </span>
          {city.country && (
            <span className="text-sm text-on-feature/75">{city.country}</span>
          )}
        </span>
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 rounded-full bg-on-feature/15 px-3 py-1.5 text-sm font-medium">
            <Users aria-hidden="true" className="h-4 w-4" />
            {t("memberCount", { count: city.member_count })}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-on-feature/15 transition-transform duration-200 group-hover:translate-x-0.5">
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </span>
        </span>
      </Link>
    </section>
  );
}

function CityLink({ city }: { city: CityRow }) {
  const t = useTranslations("home");

  return (
    <li>
      <Link
        href={`/city/${city.slug}`}
        className="group flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-subtle/60"
      >
        {/* A monogram tile, like a destination card without a photo. */}
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-display text-lg font-semibold text-brand-ink"
        >
          {city.name.charAt(0)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-ink">{city.name}</span>
          {city.country && (
            <span className="truncate text-sm text-ink-muted">{city.country}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm text-ink-muted tabular-nums">
          {t("memberCount", { count: city.member_count })}
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </Link>
    </li>
  );
}

// Counting happens in the city_member_counts view, under the viewer's RLS, so
// each number matches what that city page shows them.
async function Cities() {
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("home"), getLocale()]);

  // The counts don't depend on who's asking (beyond RLS), so they load while
  // getClaims() works out whose city to pin.
  const ownProfile = supabase.auth.getClaims().then(({ data: claims }) =>
    supabase
      .from("profiles")
      .select("city_id")
      .eq("id", claims?.claims.sub ?? "")
      .maybeSingle(),
  );
  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from("city_member_counts")
      .select("id, slug, name_en, name_tk, country_code, member_count")
      .order("member_count", { ascending: false })
      .order(locale === "tk" ? "name_tk" : "name_en"),
    ownProfile,
  ]);

  // View columns are typed nullable, but these come from not-null columns.
  const cities: CityRow[] = (rows ?? []).map((row) => ({
    id: row.id!,
    slug: row.slug!,
    name: cityName({ name_en: row.name_en!, name_tk: row.name_tk! }, locale),
    country: countryName(row.country_code, locale),
    member_count: row.member_count ?? 0,
  }));
  const ownCity = cities.find((city) => city.id === profile?.city_id);
  const otherCities = cities.filter((city) => city !== ownCity);
  const members = cities.reduce((sum, city) => sum + city.member_count, 0);

  if (!cities.length) {
    return <p className={`${leadClass} -mt-6`}>{t("noCities")}</p>;
  }

  return (
    <>
      {/* Sits under the static title, closer than the page's section gap. */}
      <p className={`${leadClass} -mt-6`}>
        {t("summary", { members, cities: cities.length })}
      </p>
      {ownCity && <OwnCity city={ownCity} />}
      {otherCities.length > 0 && (
        <section aria-labelledby="all-cities" className="flex flex-col gap-3">
          <h2 id="all-cities" className={sectionLabelClass}>
            {ownCity ? t("otherCities") : t("allCities")}
          </h2>
          <ul className={`${cardClass} flex flex-col divide-y divide-line overflow-hidden`}>
            {otherCities.map((city) => (
              <CityLink key={city.slug} city={city} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// Only members with a finished profile get here (see proxy.ts).
export default function Home() {
  const t = useTranslations("home");

  return (
    <PageShell
      action={
        <Link
          href="/settings"
          aria-label={t("settings")}
          className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
        >
          <Settings aria-hidden="true" className="h-5 w-5" />
        </Link>
      }
    >
      <h1 className={pageTitleClass}>{t("title")}</h1>
      <Suspense fallback={<CitiesSkeleton />}>
        <Cities />
      </Suspense>
    </PageShell>
  );
}

// Shaped like what's coming: the summary line, your city, then the list.
function CitiesSkeleton() {
  return (
    <>
      <div className={`${skeletonClass} -mt-6 h-5 w-56 rounded-full`} />
      <div className={`${skeletonClass} h-44 rounded-3xl`} />
      <div className={`${skeletonClass} h-64`} />
    </>
  );
}
