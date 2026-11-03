import { useTranslations } from "next-intl";
import Link from "next/link";
import CardShell from "@/components/card-shell";
import { textLinkClass } from "@/lib/styles";

type Namespace = "privacy" | "rules";

// A short plain-language page made of titled lists: privacy and rules. The
// text lives in messages/*.json under the namespace, so both languages stay
// side by side and a section can be added there without touching this file.
export default function PolicyPage({
  namespace,
  sections,
}: {
  namespace: Namespace;
  sections: readonly string[];
}) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations("common");

  return (
    <CardShell>
      <div className="flex flex-col gap-2">
        <Link href="/" className={textLinkClass}>
          ← {tCommon("back")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>
      </div>

      {sections.map((section) => (
        <section key={section} aria-labelledby={`${namespace}-${section}`} className="flex flex-col gap-2">
          <h2
            id={`${namespace}-${section}`}
            className="text-base font-semibold text-black dark:text-zinc-50"
          >
            {/* Keys are checked against en.json by the message types. */}
            {t(`${section}.title` as Parameters<typeof t>[0])}
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-zinc-700 marker:text-zinc-400 dark:text-zinc-300">
            {(t.raw(`${section}.items` as Parameters<typeof t>[0]) as string[]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-zinc-500">{t("updated")}</p>
    </CardShell>
  );
}
