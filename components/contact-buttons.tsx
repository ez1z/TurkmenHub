import { useTranslations } from "next-intl";
import { outlineButtonClass } from "@/lib/styles";

export type Contacts = {
  whatsapp: string | null;
  telegram: string | null;
} | null;

const buttonClass = `flex h-10 items-center justify-center px-4 ${outlineButtonClass}`;

// Chat links for a member. contacts is null when RLS didn't return the row,
// i.e. the member doesn't share their contacts with this viewer, so nothing
// is shown. The stored values are already in link form: WhatsApp as digits
// with the country code, Telegram as a bare username.
export default function ContactButtons({
  nickname,
  contacts,
  className = "",
}: {
  nickname: string;
  contacts: Contacts;
  className?: string;
}) {
  const t = useTranslations("contacts");

  if (!contacts?.whatsapp && !contacts?.telegram) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {contacts.whatsapp && (
        <a
          href={`https://wa.me/${contacts.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("messageOnWhatsApp", { nickname })}
          className={buttonClass}
        >
          WhatsApp
        </a>
      )}
      {contacts.telegram && (
        <a
          href={`https://t.me/${contacts.telegram}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("messageOnTelegram", { nickname })}
          className={buttonClass}
        >
          Telegram
        </a>
      )}
    </div>
  );
}
