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
import { type UserRole } from "@/auth/roles";
import { cx } from "@/lib/cx";
import { UserMenu } from "./UserMenu";
import { DemoPanel } from "./DemoPanel";
import type { TranslationKey } from "@/i18n/en";

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
  const { lang, cycle, t, tRole, tDistrict } = useT();
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
    const keyMap: Record<string, TranslationKey> = {
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
      "Priority Cases": "nav.priorityCases",
      "Farms & Plots": "nav.farmsPlots",
      "Crop Health": "nav.cropHealth",
      "Surveillance Map": "nav.survMap",
      "Forecast & Risk": "nav.forecastRisk",
      "Pest Traps": "nav.pestTraps",
      "Canopy Sensors": "nav.canopySensors",
      "Reports & Validations": "nav.reports",
      "Pending Reviews": "nav.pendingReviews",
      "Validation History": "nav.validationHistory",
      "Disease Knowledge Base": "nav.diseaseKnowledge",
      Reviews: "nav.reviews",
      History: "nav.history",
      Knowledge: "nav.knowledge",
      Reports: "nav.reports",
      Map: "nav.survMap",
      Health: "nav.cropHealth",
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
  const userDistrict = user?.district ? tDistrict(user.district) : "India";

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
                {tRole(config.role)}
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
                  {tRole(config.role)} · {userDistrict}
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
                <span>{t("profile.logout")}</span>
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
              <span className="text-caption text-forest uppercase tracking-wider">{tRole(config.role)}</span>
              <span className="text-ink-2">/</span>
              <span className="text-[0.9375rem] font-semibold text-ink">{pageTitle}</span>
            </div>
          </div>

          {/* Right Header Actions: Status Badge, Notification, Language, User */}
          <div className="flex items-center gap-2 md:gap-3">
            {config.statusBadge && (
              <span className="hidden items-center gap-1.5 rounded-[var(--r)] border border-forest/20 bg-forest/5 px-2.5 py-1 text-[0.75rem] font-semibold text-forest lg:inline-flex">
                <span className="size-1.5 rounded-full bg-forest animate-pulse" />
                {config.statusBadge}
              </span>
            )}

            {config.notificationPath && (
              <Link
                to={config.notificationPath}
                aria-label={`${config.notificationCount ?? 0} unread alerts`}
                className="relative inline-flex size-10 items-center justify-center rounded-[var(--r)] border border-line bg-surface text-ink transition-colors hover:bg-surface-2"
              >
                <Bell className="size-4" />
                {(config.notificationCount ?? 0) > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber text-[0.625rem] font-bold text-surface">
                    {config.notificationCount}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop Language Switcher Button */}
            <button
              type="button"
              onClick={cycle}
              aria-label={`${t("nav.language")}: ${currentLang?.label}. Switch to ${nextLang?.label}`}
              className="hidden min-h-[40px] items-center gap-1.5 rounded-[var(--r)] border border-line bg-surface px-3 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-surface-2 sm:inline-flex"
            >
              <Languages className="size-4 text-ink-2" aria-hidden />
              <span>{currentLang?.label}</span>
            </button>

            <UserMenu />
          </div>
        </header>

        {/* SIH Evaluation Interactive Assistant Trigger */}
        {config.showDemoPanel && <DemoPanel />}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* =========================================================================
          MOBILE NAVIGATION DRAWER (Slide-over on small screens)
      ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 flex w-[280px] flex-col border-r border-line bg-surface shadow-panel">
            {/* Drawer Header */}
            <div className="flex min-h-[60px] items-center justify-between border-b border-line px-4">
              <Link to={config.homePath} className="flex items-center gap-2">
                <LogoMark size={24} />
                <div>
                  <span className="font-display text-[1.125rem] font-semibold">
                    Crop<span className="text-amber">X</span>ense
                  </span>
                  <span className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-forest">
                    {tRole(config.role)}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-[var(--r)] border border-line text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {config.navItems.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                const localizedLabel = translateLabel(item.label);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cx(
                      "flex min-h-[44px] items-center gap-3 rounded-[var(--r)] px-3 text-[0.875rem] font-semibold transition-colors",
                      active
                        ? "bg-forest text-surface"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <Icon className={cx("size-4", active ? "text-amber" : "text-ink-2")} />
                    <span>{localizedLabel}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="border-t border-line p-3 space-y-2">
              <button
                type="button"
                onClick={cycle}
                className="flex min-h-[40px] w-full items-center justify-between rounded-[var(--r)] border border-line bg-paper px-3 text-[0.8125rem] font-semibold text-ink"
              >
                <span className="flex items-center gap-2">
                  <Languages className="size-4 text-ink-2" />
                  <span>{t("nav.language")}</span>
                </span>
                <span className="text-forest">{currentLang?.label}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-[var(--r)] border border-alert/30 bg-alert/5 text-[0.8125rem] font-semibold text-alert"
              >
                <LogOut className="size-4" />
                <span>{t("profile.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (Bottom Navigation for Quick Access on Mobile)
      ========================================================================= */}
      {config.mobileTabs && (
        <nav
          aria-label="Mobile navigation tabs"
          className="fixed inset-x-0 bottom-0 z-40 flex min-h-[56px] items-center justify-around border-t border-line bg-surface md:hidden"
        >
          {config.mobileTabs.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            const Icon = tab.icon;
            const localizedLabel = translateLabel(tab.label);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cx(
                  "flex flex-1 flex-col items-center justify-center py-1.5 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-forest font-bold" : "text-ink-2",
                )}
              >
                <Icon className={cx("size-5", active ? "text-forest" : "text-ink-2")} />
                <span className="mt-0.5 max-w-[60px] truncate">{localizedLabel}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
