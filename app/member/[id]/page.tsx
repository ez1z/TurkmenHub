import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ContactButtons from "@/components/contact-buttons";
import { Avatar } from "@/components/member-card";
import PageShell from "@/components/page-shell";
import { textLinkClass } from "@/lib/styles";
import { createClient } from "@/lib/supabase/server";

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
    return ", but you haven't added a WhatsApp or Telegram contact.";
  }
  return contacts.share_with_verified
    ? ", and message you."
    : ", but your contacts aren't shared.";
}

async function Member({
  params,
}: {
  params: PageProps<"/member/[id]">["params"];
}) {
  // params is request-time data, so this streams inside Suspense and a
  // notFound() can only send a 200; the proxy sends the real 404.
  const { id } = await params;
  if (!UUID.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: claims }, { data: member }] = await Promise.all([
    supabase.auth.getClaims(),
    // RLS returns the profile only if this viewer may see it (or it's their
    // own), and contacts only if the member shares them.
    supabase
      .from("profiles")
      .select(
        "id, nickname, bio, is_visible, cities(slug, name_en), contacts(whatsapp, telegram, share_with_verified)",
      )
      .eq("id", id)
      .not("verified_at", "is", null)
      .maybeSingle(),
  ]);

  if (!member) {
    notFound();
  }

  const isSelf = member.id === claims?.claims.sub;
  const nickname = member.nickname ?? "Member";

  return (
    <>
      {member.cities && (
        <Link href={`/city/${member.cities.slug}`} className={textLinkClass}>
          ← {member.cities.name_en}
        </Link>
      )}

      <div className="flex items-center gap-4">
        <Avatar nickname={nickname} />
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {nickname}
          </h1>
          {member.cities && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {member.cities.name_en}
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
            This is your profile.{" "}
            {member.is_visible
              ? "Members in your city can see it"
              : "It's hidden from other members"}
            {member.is_visible && reachNote(member.contacts)}
            {!member.is_visible && "."}
          </p>
          <Link href="/settings" className="font-medium underline">
            Edit in settings
          </Link>
        </div>
      ) : member.contacts?.whatsapp || member.contacts?.telegram ? (
        <ContactButtons nickname={nickname} contacts={member.contacts} />
      ) : (
        <p className="text-sm text-zinc-500">
          {nickname} hasn&apos;t shared any contact details.
        </p>
      )}
    </>
  );
}

export default function MemberPage({ params }: PageProps<"/member/[id]">) {
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
