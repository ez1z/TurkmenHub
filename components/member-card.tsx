import Link from "next/link";
import ContactButtons, { type Contacts } from "@/components/contact-buttons";

export type Member = {
  id: string;
  nickname: string | null;
  bio: string | null;
  contacts: Contacts;
};

// The first character as a reader sees it, so an emoji or flag like 🇹🇲
// (several code points) isn't cut in half.
function firstCharacter(text: string) {
  const [first] = new Intl.Segmenter().segment(text);
  return first?.segment ?? "";
}

export function Avatar({ nickname }: { nickname: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-medium text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300"
    >
      {firstCharacter(nickname)}
    </span>
  );
}

// A member in a city list. The whole card opens their profile; the contact
// buttons sit above that link so they open the chat instead.
export default function MemberCard({
  member,
  isSelf,
}: {
  member: Member;
  isSelf: boolean;
}) {
  // Members without a nickname haven't finished onboarding, and the proxy
  // keeps them out of the app, but the column is still nullable.
  const nickname = member.nickname ?? "Member";

  return (
    <li className="relative flex flex-col gap-3 rounded-2xl border border-black/[.08] p-4 transition-colors hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.03]">
      <div className="flex items-start gap-3">
        <Avatar nickname={nickname} />
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/member/${member.id}`}
            className="font-medium text-black after:absolute after:inset-0 after:rounded-2xl dark:text-zinc-50"
          >
            {nickname}
            {isSelf && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                (you)
              </span>
            )}
          </Link>
          {member.bio && (
            <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {member.bio}
            </p>
          )}
        </div>
      </div>
      {/* Your own contacts are always readable to you; no point showing them. */}
      {!isSelf && (
        <ContactButtons
          nickname={nickname}
          contacts={member.contacts}
          className="relative pl-13"
        />
      )}
    </li>
  );
}
