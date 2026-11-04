import { useTranslations } from "next-intl";
import PageShell, { BackLink } from "@/components/page-shell";
import { cardClass, leadClass, pageTitleClass } from "@/lib/styles";

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
    <PageShell back={<BackLink href="/" label={tCommon("back")} />}>
      <div className="flex flex-col gap-2">
        <h1 className={pageTitleClass}>{t("title")}</h1>
        <p className={leadClass}>{t("intro")}</p>
      </div>

      {sections.map((section, index) => (
        <section
          key={section}
          aria-labelledby={`${namespace}-${section}`}
          className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}
        >
          <h2
            id={`${namespace}-${section}`}
            className="flex items-baseline gap-3 font-display text-xl font-semibold tracking-tight text-ink"
          >
            <span aria-hidden="true" className="font-display text-base text-accent tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            {/* Keys are checked against en.json by the message types. */}
            {t(`${section}.title` as Parameters<typeof t>[0])}
          </h2>
          {/* Bullets are small carpet diamonds in the accent colour. */}
          <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink-muted">
            {(t.raw(`${section}.items` as Parameters<typeof t>[0]) as string[]).map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rotate-45 bg-accent"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="px-1 text-xs text-ink-muted">{t("updated")}</p>
    </PageShell>
  );
}
