/**
 * Forgot password page — /forgot-password
 *
 * Connected with Supabase Auth for password recovery links.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "@/auth/authStore";
import { useT } from "@/i18n";

export const Route = createFileRoute("/_auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — CropXense" },
      { name: "description", content: "Reset your CropXense account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <div className="mx-auto flex size-16 items-center justify-center border border-leaf bg-leaf/10">
          <svg viewBox="0 0 24 24" className="size-8 text-leaf" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="mt-4 font-expanded text-[1.75rem]">{t("auth.checkInbox")}</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">
          {t("auth.resetSent", { email })}
        </p>
        <Link
          to="/login"
          className="mt-6 flex min-h-[44px] w-full items-center justify-center border border-forest bg-forest text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
        >
          {t("auth.backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-expanded text-[1.75rem]">{t("auth.resetTitle")}</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-2">
        {t("auth.resetSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-[0.875rem] font-semibold">
            {t("auth.emailOrMobile")}
          </label>
          <input
            id="reset-email"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none transition-colors focus:border-forest"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full min-h-[44px] items-center justify-center border border-forest bg-forest text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20] disabled:opacity-60"
        >
          {loading ? t("auth.sending") : t("auth.sendResetLink")}
        </button>
      </form>

      <p className="mt-6 text-center text-[0.9375rem]">
        <Link to="/login" className="font-semibold text-forest hover:underline">
          {t("auth.backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
