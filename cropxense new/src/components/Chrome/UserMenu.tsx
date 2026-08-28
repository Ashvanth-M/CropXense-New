/**
 * Reusable user menu and logout button for all authenticated roles.
 * Provides consistent account details and a prominent, reliable Logout action.
 */

import { useState, useRef, useEffect } from "react";
import { UserRound, LogOut, ChevronDown, Shield, Sprout, FlaskConical, BarChart3, Languages } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { ROLE_LABELS, type UserRole } from "@/auth/roles";
import { LANGS, useT } from "@/i18n";
import { cx } from "@/lib/cx";

const ROLE_ICONS: Record<UserRole, typeof Sprout> = {
  farmer: Sprout,
  officer: Shield,
  expert: FlaskConical,
};

export function UserMenu({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const { lang, cycle, t } = useT();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGS.find((l) => l.code === lang);
  const nextLang = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  if (!user) return null;

  const RoleIcon = ROLE_ICONS[user.role] || UserRound;

  return (
    <div ref={menuRef} className={cx("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex min-h-[44px] items-center gap-2.5 rounded-[var(--r)] border border-line bg-surface px-3 py-1.5 text-left text-ink transition-colors hover:bg-surface-2 focus-visible:outline-2"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[var(--r)] bg-forest/10 text-forest">
          <RoleIcon className="size-4" aria-hidden />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[0.875rem] font-semibold text-ink">{user.name}</span>
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
        <ChevronDown className={cx("size-3.5 text-ink-2 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-[var(--r)] border border-line bg-surface p-2 shadow-overlay"
        >
          {/* User summary */}
          <div className="border-b border-line px-3 py-2 text-[0.8125rem]">
            <p className="font-semibold text-ink">{user.name}</p>
            <p className="text-ink-2">{user.email}</p>
            <p className="mt-1 inline-block rounded-[var(--r)] bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-forest">
              {ROLE_LABELS[user.role]} · {user.district}
            </p>
          </div>

          {/* Language Switch */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              cycle();
              setOpen(false);
            }}
            className="mt-1 flex w-full min-h-[40px] items-center gap-2.5 rounded-[var(--r)] px-3 py-2 text-left text-[0.875rem] font-medium text-ink hover:bg-surface-2"
          >
            <Languages className="size-4 text-ink-2" aria-hidden />
            <span>
              {t("nav.language")}: <strong className="font-semibold">{currentLang?.label}</strong> (Switch to {nextLang?.label})
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="mt-1 flex w-full min-h-[40px] items-center gap-2.5 rounded-[var(--r)] border-t border-line px-3 py-2 text-left text-[0.875rem] font-semibold text-alert hover:bg-alert/10"
          >
            <LogOut className="size-4" aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated prominent Logout Button for sidebars, top bars, and settings
 */
export function LogoutButton({
  variant = "secondary",
  className,
}: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  const styles = {
    primary: "bg-forest text-surface hover:bg-[#0e2b20] border-forest",
    secondary: "bg-surface text-ink hover:bg-surface-2 border-line",
    ghost: "bg-transparent text-ink-2 hover:text-ink hover:bg-surface-2 border-transparent",
    danger: "bg-alert/10 text-alert hover:bg-alert/20 border-alert/30",
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Sign out of CropXense"
      className={cx(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--r)] border px-3 text-[0.875rem] font-semibold transition-colors",
        styles[variant],
        className,
      )}
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      <span>Sign out</span>
    </button>
  );
}
