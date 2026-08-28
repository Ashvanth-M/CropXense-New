import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, UserRound } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DemoPanel } from "./DemoPanel";
import { useT } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";

const SECTIONS: { to: string; key: TranslationKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/dashboard", key: "nav.overview" },
  { to: "/styleguide", key: "nav.styleguide" },
];

export function TopNav() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/farmer")) return null;

  return (
    <header className="sticky top-0 z-40 bg-forest text-paper">
      <div className="mx-auto flex min-h-[56px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1">
        <Link to="/" className="flex items-center gap-2 text-paper" aria-label={t("app.name")}>
          <LogoMark size={22} />
          <span className="font-display font-semibold leading-none tracking-[-0.02em] text-[1.0625rem]">
            Crop<span className="font-medium text-amber">X</span>ense
          </span>
        </Link>

        <nav aria-label="Sections" className="flex flex-wrap items-center gap-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              activeOptions={{ exact: s.to === "/" }}
              className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-[var(--r)] px-3 text-[0.9375rem] font-semibold text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper [&.active]:bg-paper/15 [&.active]:text-paper"
            >
              {t(s.key)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <DemoPanel />
          <LanguageSwitcher />
          <button
            type="button"
            aria-label={t("nav.notifications")}
            className="inline-flex size-11 items-center justify-center rounded-[var(--r)] text-paper transition-colors hover:bg-paper/10"
          >
            <Bell className="size-4" aria-hidden />
          </button>
          <span className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--r)] border border-paper/25 px-3 text-[0.875rem]">
            <UserRound className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">A. Deshmukh</span>
          </span>
        </div>
      </div>
    </header>
  );
}
