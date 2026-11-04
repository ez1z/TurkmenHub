import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Avatar from "@/components/avatar";
import ContactButtons, { type Contacts } from "@/components/contact-buttons";

export type Member = {
  id: string;
  nickname: string | null;
  bio: string | null;
  contacts: Contacts;
};

// A member in a city list. The whole row opens their profile; the contact
// chips sit above that link so they open the chat instead.
export default function MemberCard({
  member,
  isSelf,
}: {
  member: Member;
  isSelf: boolean;
}) {
  // Members without a nickname haven't finished onboarding, and the proxy
  // keeps them out of the app, but the column is still nullable.
  const t = useTranslations("member");
  const nickname = member.nickname ?? t("fallbackName");

  return (
    <li className="group relative flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-subtle/60">
      <div className="flex items-start gap-3.5">
        <Avatar nickname={nickname} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
          <Link
            href={`/member/${member.id}`}
            className="flex items-center gap-2 font-medium text-ink after:absolute after:inset-0"
          >
            <span className="truncate">{nickname}</span>
            {isSelf && (
              <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-ink">
                {t("you")}
              </span>
            )}
          </Link>
          {member.bio && (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
              {member.bio}
            </p>
          )}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="mt-3 h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </div>
      {/* Your own contacts are always readable to you; no point showing them. */}
      {!isSelf && (
        <ContactButtons
          nickname={nickname}
          contacts={member.contacts}
          className="relative pl-[3.6rem]"
        />
      )}
    </li>
  );
}
