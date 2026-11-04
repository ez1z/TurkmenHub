import { MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { outlineButtonClass, primaryButtonClass } from "@/lib/styles";

export type Contacts = {
  whatsapp: string | null;
  telegram: string | null;
} | null;

// Chips in a member list, or full-width buttons on a profile, where the
// first one is the page's main action.
function buttonClass(size: "sm" | "lg", index: number) {
  if (size === "sm") {
    return `h-9 px-3.5 ${outlineButtonClass}`;
  }
  return index === 0 ? primaryButtonClass : `h-12 w-full px-5 text-base ${outlineButtonClass}`;
}

// Chat links for a member. contacts is null when RLS didn't return the row,
// i.e. the member doesn't share their contacts with this viewer, so nothing
// is shown. The stored values are already in link form: WhatsApp as digits
// with the country code, Telegram as a bare username.
export default function ContactButtons({
  nickname,
  contacts,
  size = "sm",
  className = "",
}: {
  nickname: string;
  contacts: Contacts;
  size?: "sm" | "lg";
  className?: string;
}) {
  const t = useTranslations("contacts");

  if (!contacts?.whatsapp && !contacts?.telegram) {
    return null;
  }

  const links = [
    contacts.whatsapp && {
      href: `https://wa.me/${contacts.whatsapp}`,
      label: t("messageOnWhatsApp", { nickname }),
      name: "WhatsApp",
      Icon: MessageCircle,
    },
    contacts.telegram && {
      href: `https://t.me/${contacts.telegram}`,
      label: t("messageOnTelegram", { nickname }),
      name: "Telegram",
      Icon: Send,
    },
  ].filter((link) => !!link);

  return (
    <div
      className={`flex gap-2 ${size === "lg" ? "flex-col" : "flex-wrap"} ${className}`}
    >
      {links.map(({ href, label, name, Icon }, index) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={buttonClass(size, index)}
        >
          <Icon aria-hidden="true" className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
          {name}
        </a>
      ))}
    </div>
  );
}
