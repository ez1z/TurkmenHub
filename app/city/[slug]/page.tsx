import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import MemberCard from "@/components/member-card";
import PageShell from "@/components/page-shell";
import { sectionLabelClass, textLinkClass } from "@/lib/styles";
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
        .select("id, name_en, group_url, member_count")
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
async function City({ params }: { params: PageProps<"/city/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await loadCity(slug);

  if (!data) {
    notFound();
  }

  const { city, members, newThisWeek, userId } = data;

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {city.name_en}
          <span className="font-normal text-zinc-500">
            {" "}
            · {city.member_count ?? 0}
          </span>
        </h1>
        {city.group_url && (
          <a
            href={city.group_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Join the city group
          </a>
        )}
      </div>

      {newThisWeek.length > 0 && (
        <section aria-labelledby="new-this-week" className="flex flex-col gap-2">
          <h2 id="new-this-week" className={sectionLabelClass}>
            New this week
          </h2>
          <ul className="flex flex-col gap-2">
            {newThisWeek.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={member.id === userId}
              />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="members" className="flex flex-col gap-2">
        <h2 id="members" className={sectionLabelClass}>
          Members
        </h2>
        {members.length ? (
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={member.id === userId}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No members here yet. Invite someone you know in {city.name_en}.
          </p>
        )}
      </section>
    </>
  );
}

// Shareable: a signed-out visitor is sent to sign in and brought back here
// (see lib/return-to.ts).
export default function CityPage({ params }: PageProps<"/city/[slug]">) {
  return (
    <PageShell>
      <Link href="/" className={textLinkClass}>
        ← All cities
      </Link>
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <City params={params} />
      </Suspense>
    </PageShell>
  );
}
