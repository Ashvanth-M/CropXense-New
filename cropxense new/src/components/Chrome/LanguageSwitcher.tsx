import { Languages } from "lucide-react";
import { LANGS, useT } from "@/i18n";

export function LanguageSwitcher() {
  const { lang, cycle, t } = useT();
  const current = LANGS.find((l) => l.code === lang);
  const next = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${t("nav.language")}: ${current?.label}. Switch to ${next?.label}`}
      className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-[var(--r)] border border-paper/25 px-3 text-[0.875rem] font-semibold text-paper transition-colors hover:bg-paper/10"
    >
      <Languages className="size-4 shrink-0" aria-hidden />
      <span>{current?.label}</span>
    </button>
  );
}
