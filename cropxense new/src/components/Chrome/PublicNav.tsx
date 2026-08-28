/**
 * Public marketing navigation for the CropXense landing page.
 *
 * Desktop: Logo (left), section links (center), Sign in + Get started (right).
 * Mobile: hamburger menu.
 *
 * This component must NEVER show dashboard-specific items like
 * notifications, user profiles, or demo panels.
 */

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Languages } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { LANGS, useT } from "@/i18n";

const SECTIONS = [
  { label: "Product", href: "#how" },
  { label: "How it works", href: "#signals" },
  { label: "Technology", href: "#detection" },
  { label: "For Farmers", href: "#farmer-experience" },
  { label: "For Field Teams", href: "#surveillance" },
  { label: "For Experts", href: "#validation" },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[56px] max-w-[1200px] items-center gap-4 px-4 py-1">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="CropXense home">
          <LogoMark size={22} />
          <span className="font-display font-semibold leading-none tracking-[-0.02em] text-[1.0625rem]">
            Crop<span className="font-medium text-amber">X</span>ense
          </span>
        </Link>

        {/* Desktop nav — center */}
        <nav aria-label="Product sections" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="inline-flex min-h-[44px] items-center whitespace-nowrap px-3 text-[0.875rem] font-semibold text-ink-2 transition-colors hover:text-ink"
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Desktop right — auth links + language */}
        <div className="ms-auto hidden items-center gap-2 lg:flex">
          <PublicLanguageSwitcher />
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center px-3 text-[0.9375rem] font-semibold text-ink transition-colors hover:text-forest"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex min-h-[44px] items-center justify-center border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="ms-auto inline-flex size-11 items-center justify-center lg:hidden"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-line bg-paper px-4 pb-4 lg:hidden">
          <nav className="flex flex-col gap-1 py-2">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-[44px] items-center text-[0.9375rem] font-semibold text-ink-2 transition-colors hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <PublicLanguageSwitcher />
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-[44px] items-center justify-center border border-line px-4 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              className="inline-flex min-h-[44px] items-center justify-center border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/** Language switcher variant for the public navigation (light background). */
function PublicLanguageSwitcher() {
  const { lang, cycle, t } = useT();
  const current = LANGS.find((l) => l.code === lang);
  const next = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length];

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${t("nav.language")}: ${current?.label}. Switch to ${next?.label}`}
      className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap border border-line px-3 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-surface-2"
    >
      <Languages className="size-4 shrink-0" aria-hidden />
      <span>{current?.label}</span>
    </button>
  );
}
