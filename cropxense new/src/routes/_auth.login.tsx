/**
 * Sign in page — /login
 *
 * Direct email/password login and 1-click Demo Account Selector for the 3 roles:
 * 1. Farmer (Ramesh Kumar -> /farmer)
 * 2. Field Extension Officer (Priya Sharma -> /app)
 * 3. Plant Protection Expert (Dr. Anjali Patil -> /expert)
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { DEMO_USERS, ROLE_REDIRECT, ROLE_LABELS, type UserRole } from "@/auth/roles";
import { Sprout, Shield, FlaskConical, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({
    meta: [
      { title: "Sign In — CropXense" },
      { name: "description", content: "Sign in to CropXense platform as a Farmer, Officer, or Expert." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password, remember);
    setLoading(false);

    if (result.ok && result.user) {
      const redirect = ROLE_REDIRECT[result.user.role] ?? "/app";
      void navigate({ to: redirect });
    } else {
      setError(result.error ?? "Unable to sign in. Please check your credentials.");
    }
  }

  async function handleDemoLogin(role: UserRole) {
    setError(null);
    setLoading(true);
    const demoUser = DEMO_USERS.find((u) => u.role === role);
    if (!demoUser) return;

    const result = await login(demoUser.email, demoUser.password);
    setLoading(false);

    if (result.ok && result.user) {
      void navigate({ to: ROLE_REDIRECT[result.user.role] ?? "/app" });
    }
  }

  return (
    <div>
      <span className="text-caption text-forest">CropXense Surveillance Platform</span>
      <h1 className="mt-1 font-expanded text-[1.75rem]">Sign in to CropXense</h1>
      <p className="mt-1 text-[0.875rem] text-ink-2">
        Access parcel surveillance, field operations, and scientific validation.
      </p>

      {/* 1-Click Demo Accounts for SIH Evaluators */}
      <div className="mt-6 rounded-[var(--r)] border border-amber/40 bg-amber/5 p-4">
        <div className="flex items-center gap-1.5 text-[0.8125rem] font-bold text-amber">
          <Sparkles className="size-4" />
          <span>Try CropXense Demo (1-Click Login)</span>
        </div>
        <p className="mt-0.5 text-[0.75rem] text-ink-2">
          Select an authenticated role for instant demonstration:
        </p>

        <div className="mt-3 grid gap-2">
          {DEMO_USERS.map((demo) => {
            const Icon =
              demo.role === "farmer"
                ? Sprout
                : demo.role === "officer"
                  ? Shield
                  : FlaskConical;

            return (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleDemoLogin(demo.role)}
                disabled={loading}
                className="flex min-h-[44px] items-center justify-between rounded-[var(--r)] border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-forest hover:bg-surface-2 disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-[var(--r)] bg-paper text-forest">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <span className="block text-[0.8125rem] font-bold text-ink">{ROLE_LABELS[demo.role]}</span>
                    <span className="block text-[0.6875rem] text-ink-2">{demo.name} · {demo.district}</span>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-ink-2" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-paper px-3 text-[0.75rem] uppercase tracking-wider text-ink-2 font-semibold">
          Or sign in with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-[0.875rem]">
        {error && (
          <div className="border border-alert/30 bg-alert/5 p-3 text-[0.8125rem] text-alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-[0.8125rem] font-semibold text-ink">
            Email or Mobile Number
          </label>
          <input
            id="login-email"
            type="text"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            placeholder="farmer@cropxense.demo"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-[0.8125rem] font-semibold text-ink">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between text-[0.8125rem]">
          <label className="flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-3.5 accent-forest"
            />
            <span>Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="font-semibold text-forest hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[46px] w-full items-center justify-center border border-forest bg-forest text-[0.9375rem] font-semibold text-surface hover:bg-[#0e2b20] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-[0.8125rem] text-ink-2">
        Don't have an account yet?{" "}
        <Link to="/signup" className="font-semibold text-forest hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
