/**
 * Canonical CropXense Shared Role Application Shell.
 *
 * Used by all 3 workspaces:
 * - Farmer: "FIELD HEALTH" (/farmer)
 * - Field Extension Officer: "FIELD OPERATIONS" (/app)
 * - Plant Protection Expert: "EXPERT VALIDATION" (/expert)
 *
 * Enforces identical:
 * - 250px left sidebar with LogoMark & workspace subtitle
 * - Standardized active/hover navigation styling
 * - Sidebar footer with User profile, Language cycler, and Logout
 * - Clean white/surface top header with Eyebrow Breadcrumb, Notifications, Language, and UserMenu
 * - Max-1440px responsive main content container
 * - Mobile navigation drawer and responsive breakpoints
 */

import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  Menu,
  X,
  Bell,
  Languages,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { LANGS, useT } from "@/i18n";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABELS, type UserRole } from "@/auth/roles";
import { cx } from "@/lib/cx";
import { UserMenu } from "./UserMenu";
import { DemoPanel } from "./DemoPanel";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface MobileTab {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface RoleShellConfig {
  role: UserRole;
  appSubtitle: string;
  eyebrowTitle: string;
  homePath: string;
  navItems: NavItem[];
  mobileTabs?: MobileTab[];
  statusBadge?: string;
  notificationPath?: string;
  notificationCount?: number;
  showDemoPanel?: boolean;
}

export function RoleAppShell({
  config,
  children,
}: {
  config: RoleShellConfig;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const { lang, cycle, t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLang = LANGS.find((l) => l.code === lang);
  const nextLang = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length];

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  const translateLabel = (label: string) => {
    const keyMap: Record<string, keyof typeof import("@/i18n/en").en> = {
      Overview: "nav.overview",
      "My Fields": "nav.fields",
      "Scan Crop": "nav.scan",
      "Weather & Risk": "nav.forecast",
      "Crop Care": "nav.cropCare",
      "Profile & Help": "nav.profile",
      Home: "nav.home",
      Fields: "nav.fields",
      Scan: "nav.scan",
      Profile: "nav.profile",
      Surveillance: "nav.surveillance",
      Cases: "nav.cases",
      Advisories: "nav.advisories",
    };
    const key = keyMap[label];
    return key ? t(key) : label;
  };

  // Determine current active page label for header breadcrumb
  const currentNav = config.navItems.find((item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to),
  );
  const rawPageTitle = currentNav?.label || "Overview";
  const pageTitle = translateLabel(rawPageTitle);

  const userInitial = (user?.name || "U")[0]?.toUpperCase();
  const userDistrict = user?.district || "India";

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* =========================================================================
          DESKTOP SIDEBAR (250px) — CANONICAL FOR ALL ROLES
      ========================================================================= */}
      <aside className="hidden w-[250px] shrink-0 flex-col border-r border-line bg-surface md:flex">
        {/* Brand Header */}
        <div className="flex min-h-[64px] items-center gap-2.5 border-b border-line px-5">
          <Link to={config.homePath} className="flex items-center gap-2.5" aria-label="CropXense Workspace Home">
            <LogoMark size={24} />
            <div>
              <span className="font-display text-[1.125rem] font-semibold leading-none tracking-[-0.02em]">
                Crop<span className="font-medium text-amber">X</span>ense
              </span>
              <span className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-forest">
                {config.appSubtitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav aria-label="Workspace navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {config.navItems.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            const localizedLabel = translateLabel(item.label);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  "group flex min-h-[44px] items-center gap-3 rounded-[var(--r)] px-3 text-[0.875rem] font-semibold transition-colors",
                  active
                    ? "bg-forest text-surface"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cx(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-amber" : "text-ink-2 group-hover:text-ink",
                  )}
                  aria-hidden
                />
                <span className="flex-1 truncate">{localizedLabel}</span>
                {active && <ChevronRight className="size-3 text-surface/60" aria-hidden />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Card, Language & Explicit Logout */}
        <div className="border-t border-line bg-surface p-3">
          <div className="rounded-[var(--r)] border border-line bg-paper p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--r)] bg-forest text-[0.8125rem] font-bold text-surface">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.875rem] font-semibold leading-tight">{user?.name || "User"}</p>
                <p className="truncate text-[0.6875rem] font-medium text-ink-2">
                  {ROLE_LABELS[config.role]} · {userDistrict}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
              <button
                type="button"
                onClick={cycle}
                aria-label={`${t("nav.language")}: ${currentLang?.label}. Switch to ${nextLang?.label}`}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--r)] border border-line bg-surface px-2.5 text-[0.75rem] font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                <Languages className="size-3.5 text-ink-2" aria-hidden />
                <span>{currentLang?.label}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out of CropXense"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--r)] border border-alert/30 bg-alert/5 px-2.5 text-[0.75rem] font-semibold text-alert transition-colors hover:bg-alert/15"
              >
                <LogOut className="size-3.5" aria-hidden />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE
      ========================================================================= */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header (Clean Surface/White Design for ALL Roles) */}
        <header className="sticky top-0 z-30 flex min-h-[60px] items-center justify-between border-b border-line bg-surface px-4 md:px-6">
          {/* Left: Mobile hamburger or Eyebrow Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex size-10 items-center justify-center rounded-[var(--r)] border border-line text-ink md:hidden"
            >
              <Menu className="size-5" />
            </button>

            {/* Mobile Logo Brand */}
            <Link to={config.homePath} className="flex items-center gap-2 md:hidden">
              <LogoMark size={20} />
              <span className="font-display text-[1rem] font-semibold">
                Crop<span className="text-amber">X</span>ense
              </span>
            </Link>

            {/* Desktop Eyebrow Breadcrumb */}
            <div className="hidden items-baseline gap-2 md:flex">
              <span className="text-caption text-forest uppercase tracking-wider">{config.eyebrowTitle}</span>
              <span className="text-ink-2">/</span>
              <h1 className="font-display text-[1.125rem] font-semibold text-ink">{pageTitle}</h1>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {config.showDemoPanel && (
              <div className="hidden sm:block">
                <DemoPanel />
              </div>
            )}

            {config.statusBadge ? (
              <span className="hidden items-center gap-1.5 rounded-[var(--r)] border border-forest/30 bg-forest/5 px-2.5 py-1 text-[0.75rem] font-semibold text-forest lg:inline-flex">
                <Sparkles className="size-3 text-forest" />
                <span>{config.statusBadge}</span>
              </span>
            ) : (
              <span className="num hidden text-[0.75rem] text-ink-2 lg:inline-block">
                Updated 8 min ago
              </span>
            )}

            {/* Notifications */}
            {config.notificationPath && (
              <Link
                to={config.notificationPath}
                aria-label="Notifications"
                className="relative inline-flex size-10 items-center justify-center rounded-[var(--r)] border border-line bg-surface text-ink transition-colors hover:bg-surface-2"
              >
                <Bell className="size-4" aria-hidden />
                {typeof config.notificationCount === "number" && config.notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-alert text-[0.625rem] font-bold text-surface">
                    {config.notificationCount}
                  </span>
                )}
              </Link>
            )}

            {/* Language Cycler (Desktop) */}
            <button
              type="button"
              onClick={cycle}
              aria-label={`${t("nav.language")}: ${currentLang?.label}`}
              className="hidden min-h-[40px] items-center gap-1.5 rounded-[var(--r)] border border-line bg-surface px-3 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-surface-2 sm:inline-flex"
            >
              <Languages className="size-4 text-ink-2" aria-hidden />
              <span>{currentLang?.label}</span>
            </button>

            {/* Reusable Desktop User Menu */}
            <div className="hidden md:block">
              <UserMenu />
            </div>

            {/* Quick Logout Button on Mobile Viewports */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="inline-flex size-10 items-center justify-center rounded-[var(--r)] border border-line text-alert hover:bg-alert/10 md:hidden"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6 pb-20 md:pb-8">
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER (Shared Across All Roles)
      ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-full max-w-[280px] flex-col border-r border-line bg-surface p-4 shadow-overlay">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <LogoMark size={22} />
                <div>
                  <span className="font-display text-[1.0625rem] font-semibold leading-none">
                    Crop<span className="text-amber">X</span>ense
                  </span>
                  <span className="block text-[0.625rem] font-semibold uppercase text-forest">
                    {config.appSubtitle}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="inline-flex size-9 items-center justify-center rounded-[var(--r)] border border-line text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {config.navItems.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cx(
                      "flex min-h-[46px] items-center gap-3 rounded-[var(--r)] px-3 text-[0.9375rem] font-semibold transition-colors",
                      active ? "bg-forest text-surface" : "text-ink hover:bg-surface-2",
                    )}
                  >
                    <Icon className={cx("size-4.5", active ? "text-amber" : "text-ink-2")} aria-hidden />
                    <span>{translateLabel(item.label)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-line pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-[var(--r)] border border-alert/30 bg-alert/5 text-[0.875rem] font-semibold text-alert"
              >
                <LogOut className="size-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE BOTTOM BAR (If Defined)
      ========================================================================= */}
      {config.mobileTabs && config.mobileTabs.length > 0 && (
        <nav
          aria-label="Mobile quick actions"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface md:hidden"
        >
          {config.mobileTabs.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cx(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-[0.6875rem] font-semibold transition-colors",
                  active ? "text-forest" : "text-ink-2 hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
