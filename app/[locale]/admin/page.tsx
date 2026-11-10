import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AdminCities, { type AdminCountry } from "@/components/admin-cities";
import AdminTeam from "@/components/admin-team";
import PageShell, { BackLink } from "@/components/page-shell";
import { isAdmin } from "@/lib/admin";
import { cityName } from "@/lib/city-name";
import { countryOptions } from "@/lib/countries";
import { countryName } from "@/lib/country-name";
import { leadClass, pageTitleClass, skeletonClass } from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

// Every city, grouped by country, both sorted by name in the page language.
// admin_cities() counts every member, hidden ones too, so an admin can tell
// which cities are empty. It returns nothing to a non-admin, so it runs
// alongside the role check rather than after it.
async function Cities() {
  const supabase = await createClient();
  const [locale, admin, { data: rows, error }] = await Promise.all([
    getLocale(),
    isAdmin(supabase),
    supabase.rpc("admin_cities"),
  ]);
  // The proxy already sends non-admins a 404; this is for a role removed
  // since that check.
  if (!admin) {
    notFound();
  }
  if (error) {
    throw error;
  }

  const collator = new Intl.Collator(locale);
  const byCountry = new Map<string, AdminCountry>();
  for (const row of rows) {
    const country = byCountry.get(row.country_code) ?? {
      code: row.country_code,
      name: countryName(row.country_code, locale),
      cities: [],
    };
    country.cities.push({ ...row, name: cityName(row, locale) });
    byCountry.set(row.country_code, country);
  }
  const countries = [...byCountry.values()].sort((a, b) =>
    collator.compare(a.name, b.name),
  );
  for (const country of countries) {
    country.cities.sort((a, b) => collator.compare(a.name, b.name));
  }

  return (
    <AdminCities countries={countries} countryOptions={countryOptions(locale)} />
  );
}

// The superuser's admin list. superuser_members() returns nothing to anyone
// else, and always includes the superuser, so an empty list means this
// viewer isn't the superuser.
async function Team() {
  const supabase = await createClient();
  const [locale, { data: members, error }] = await Promise.all([
    getLocale(),
    supabase.rpc("superuser_members"),
  ]);
  if (error) {
    throw error;
  }
  if (!members.length) {
    return null;
  }

  const collator = new Intl.Collator(locale);
  members.sort((a, b) => collator.compare(a.nickname, b.nickname));
  return <AdminTeam members={members} />;
}

// Only admins get here (see proxy.ts).
export default function AdminPage() {
  const t = useTranslations("admin");

  return (
    <PageShell back={<BackLink href="/settings" label={t("settings")} />}>
      <div className="flex flex-col gap-2">
        <h1 className={pageTitleClass}>{t("title")}</h1>
        <p className={leadClass}>{t("intro")}</p>
      </div>
      <Suspense fallback={<div className={`${skeletonClass} h-96`} />}>
        <Cities />
      </Suspense>
      <Suspense>
        <Team />
      </Suspense>
    </PageShell>
  );
}
