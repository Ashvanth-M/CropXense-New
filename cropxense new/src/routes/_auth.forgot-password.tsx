/**
 * Forgot password page — /forgot-password
 *
 * Connected with Supabase Auth for password recovery links.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "@/auth/authStore";

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
        <h1 className="mt-4 font-expanded text-[1.75rem]">Check your inbox</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">
          If an account exists for <span className="font-semibold text-ink">{email}</span>,
          we've sent reset instructions. Please check your email.
        </p>
        <Link
          to="/login"
          className="mt-6 flex min-h-[44px] w-full items-center justify-center border border-forest bg-forest text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-expanded text-[1.75rem]">Reset your CropXense password</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-2">
        Enter the email or mobile number associated with your account and we'll
        send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-[0.875rem] font-semibold">
            Email or mobile number
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
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-[0.9375rem]">
        <Link to="/login" className="font-semibold text-forest hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
