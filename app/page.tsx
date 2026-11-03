import Link from "next/link";
import { Suspense } from "react";
import PageShell from "@/components/page-shell";
import { sectionLabelClass, textLinkClass } from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

type CityRow = { slug: string; name_en: string; member_count: number };

function memberCount(count: number) {
  return count === 1 ? "1 member" : `${count} members`;
}

function CityLink({ city }: { city: CityRow }) {
  return (
    <li>
      <Link
        href={`/city/${city.slug}`}
        className="flex h-14 items-center justify-between gap-3 px-4 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.04]"
      >
        <span className="font-medium text-black dark:text-zinc-50">
          {city.name_en}
        </span>
        <span className="flex items-center gap-2 text-sm text-zinc-500">
          {memberCount(city.member_count)}
          <span aria-hidden="true">›</span>
        </span>
      </Link>
    </li>
  );
}

function CityGroup({ cities }: { cities: CityRow[] }) {
  return (
    <ul className="flex flex-col divide-y divide-black/[.08] overflow-hidden rounded-xl border border-black/[.08] dark:divide-white/[.145] dark:border-white/[.145]">
      {cities.map((city) => (
        <CityLink key={city.slug} city={city} />
      ))}
    </ul>
  );
}

// Counting happens in the city_member_counts view, under the viewer's RLS, so
// each number matches what that city page shows them.
async function Cities() {
  const supabase = await createClient();

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
      .select("id, slug, name_en, member_count")
      .order("member_count", { ascending: false })
      .order("name_en"),
    ownProfile,
  ]);

  // View columns are typed nullable, but these come from not-null columns.
  const cities = (rows ?? []).map((row) => ({
    id: row.id!,
    slug: row.slug!,
    name_en: row.name_en!,
    member_count: row.member_count ?? 0,
  }));
  const ownCity = cities.find((city) => city.id === profile?.city_id);
  const otherCities = cities.filter((city) => city !== ownCity);

  if (!cities.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No cities yet.
      </p>
    );
  }

  return (
    <>
      {ownCity && (
        <section aria-labelledby="your-city" className="flex flex-col gap-2">
          <h2 id="your-city" className={sectionLabelClass}>
            Your city
          </h2>
          <CityGroup cities={[ownCity]} />
        </section>
      )}
      {otherCities.length > 0 && (
        <section aria-labelledby="all-cities" className="flex flex-col gap-2">
          <h2 id="all-cities" className={sectionLabelClass}>
            {ownCity ? "Other cities" : "All cities"}
          </h2>
          <CityGroup cities={otherCities} />
        </section>
      )}
    </>
  );
}

// Only members with a finished profile get here (see proxy.ts).
export default function Home() {
  return (
    <PageShell>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          TurkmenHub
        </h1>
        <Link href="/settings" className={textLinkClass}>
          Settings
        </Link>
      </header>
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <Cities />
      </Suspense>
    </PageShell>
  );
}
