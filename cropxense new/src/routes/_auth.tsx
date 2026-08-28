/**
 * Pathless layout route for authentication pages (login, signup, forgot-password).
 *
 * Desktop: two-column layout — left: CropXense branding + field survey visual,
 * right: authentication form.
 * Mobile: single-column centered form.
 *
 * Uses a minimal shell — no marketing navbar, no dashboard chrome.
 */

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LogoMark } from "@/components/Logo";
import { FieldSurveyVisual } from "@/components/auth/FieldSurveyVisual";
import { RedirectIfAuth } from "@/auth/guards";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <RedirectIfAuth>
      <div className="flex min-h-screen bg-paper">
        {/* Left panel — branding + visual (desktop only) */}
        <div className="hidden w-[480px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex items-center gap-2 px-6 py-5">
            <Link to="/" className="flex items-center gap-2" aria-label="CropXense home">
              <LogoMark size={22} />
              <span className="font-display font-semibold leading-none tracking-[-0.02em] text-[1.0625rem]">
                Crop<span className="font-medium text-amber">X</span>ense
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <FieldSurveyVisual />
          </div>
          <p className="px-6 py-4 text-[0.75rem] text-ink-2">
            Crop disease and pest surveillance for the Department of Agriculture,
            Government of Maharashtra.
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header */}
          <div className="flex items-center gap-2 px-6 py-4 lg:hidden">
            <Link to="/" className="flex items-center gap-2" aria-label="CropXense home">
              <LogoMark size={20} />
              <span className="font-display font-semibold leading-none tracking-[-0.02em] text-[1rem]">
                Crop<span className="font-medium text-amber">X</span>ense
              </span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 py-8">
            <div className="w-full max-w-[440px]">
              <Outlet />
            </div>
          </div>

          <p className="px-6 py-4 text-center text-[0.75rem] text-ink-2 lg:text-left">
            © 2026 CropXense · Smart India Hackathon · PS 26131
          </p>
        </div>
      </div>
    </RedirectIfAuth>
  );
}
