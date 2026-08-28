/**
 * Sign up page — /signup
 *
 * Strict 3-Role Choice:
 * 1. Farmer ("My Farm")
 * 2. Field Extension Officer ("Field Operations")
 * 3. Plant Protection Expert ("Expert Validation")
 *
 * Role-specific configuration fields with premium CropXense styling.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_REDIRECT,
  type UserRole,
} from "@/auth/roles";
import { DISTRICTS, CROPS } from "@/data/reference";
import { LANGS } from "@/i18n";
import { Sprout, Shield, FlaskConical, CheckCircle2, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_auth/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — CropXense" },
      {
        name: "description",
        content: "Create your CropXense account as a Farmer, Field Extension Officer, or Plant Protection Expert.",
      },
    ],
  }),
  component: SignupPage,
});

const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  farmer: Sprout,
  officer: Shield,
  expert: FlaskConical,
};

const ROLES: UserRole[] = ["farmer", "officer", "expert"];

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<"role" | "form" | "done">("role");
  const [role, setRole] = useState<UserRole>("farmer");

  // Base Form fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [district, setDistrict] = useState("akola");
  const [language, setLanguage] = useState("en");
  const [terms, setTerms] = useState(false);

  // Role-Specific fields
  const [farmName, setFarmName] = useState("");
  const [primaryCrop, setPrimaryCrop] = useState("cotton");
  const [farmArea, setFarmArea] = useState("4.5");
  const [subdivision, setSubdivision] = useState("Akola Central");
  const [expertiseArea, setExpertiseArea] = useState("Plant Pathology");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSelectRole(r: UserRole) {
    setRole(r);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("Please agree to the terms of use.");
      return;
    }

    setLoading(true);
    const result = await signup({
      name,
      email,
      password,
      mobile,
      role,
      district: district || "akola",
      language,
    });
    setLoading(false);

    if (result.ok && result.user) {
      setStep("done");
      setTimeout(() => {
        void navigate({ to: ROLE_REDIRECT[result.user!.role] ?? "/farmer" });
      }, 1200);
    } else {
      setError(result.error ?? "Unable to create account.");
    }
  }

  if (step === "done") {
    return (
      <div className="border border-line bg-surface p-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-leaf bg-leaf/10 text-leaf">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="mt-4 font-expanded text-[1.625rem]">Account Created</h1>
        <p className="mt-2 text-[0.875rem] text-ink-2">
          Welcome to CropXense, <strong>{name}</strong>. Opening your {ROLE_LABELS[role]} workspace…
        </p>
      </div>
    );
  }

  if (step === "role") {
    return (
      <div>
        <span className="text-caption text-forest">CropXense Account Creation</span>
        <h1 className="mt-1 font-expanded text-[1.75rem]">Create your CropXense account</h1>
        <p className="mt-1 text-[0.9375rem] text-ink-2">
          Choose how you'll use CropXense.
        </p>

        {/* EXACTLY 3 Role Selection Cards */}
        <div className="mt-6 grid gap-3">
          {ROLES.map((r) => {
            const Icon = ROLE_ICONS[r];
            const isSelected = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleSelectRole(r)}
                className={`group flex items-start gap-3.5 rounded-[var(--r)] border p-4 text-left transition-all ${
                  isSelected
                    ? "border-forest bg-surface ring-2 ring-forest shadow-panel"
                    : "border-line bg-surface hover:border-forest hover:bg-surface-2"
                }`}
              >
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[var(--r)] border border-line bg-paper text-forest group-hover:bg-forest group-hover:text-surface transition-colors">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="flex items-center justify-between">
                    <span className="block text-[1rem] font-bold text-ink">{ROLE_LABELS[r]}</span>
                    <ArrowRight className="size-4 text-ink-2 group-hover:text-forest transition-colors" />
                  </span>
                  <span className="mt-1 block text-[0.8125rem] text-ink-2 leading-relaxed">
                    {ROLE_DESCRIPTIONS[r]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[0.875rem] text-ink-2">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-forest hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // STEP 2: REGISTRATION FORM WITH ROLE-SPECIFIC FIELDS
  return (
    <div>
      <button
        type="button"
        onClick={() => setStep("role")}
        className="text-[0.8125rem] font-semibold text-forest hover:underline"
      >
        ← Change role ({ROLE_LABELS[role]})
      </button>

      <h1 className="mt-2 font-expanded text-[1.625rem]">Complete Registration</h1>
      <p className="mt-1 text-[0.875rem] text-ink-2">
        Registering as <strong className="text-ink">{ROLE_LABELS[role]}</strong>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-[0.875rem]">
        {error && (
          <div className="border border-alert/30 bg-alert/5 p-3 text-[0.8125rem] text-alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="signup-name" className="block text-[0.8125rem] font-semibold text-ink">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            placeholder={role === "expert" ? "Dr. Anjali Patil" : role === "officer" ? "Priya Sharma" : "Ramesh Kumar"}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-mobile" className="block text-[0.8125rem] font-semibold text-ink">
              Mobile Number
            </label>
            <input
              id="signup-mobile"
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-[0.8125rem] font-semibold text-ink">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-password" className="block text-[0.8125rem] font-semibold text-ink">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            />
          </div>
          <div>
            <label htmlFor="signup-confirm" className="block text-[0.8125rem] font-semibold text-ink">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            />
          </div>
        </div>

        {/* ROLE-SPECIFIC FIELDS */}
        {role === "farmer" && (
          <div className="rounded-[var(--r)] border border-line bg-surface-2 p-3.5 space-y-3">
            <span className="text-caption text-forest">Farm Details</span>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[0.75rem] font-semibold text-ink">Farm Plot Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Shree Ganesh Farm"
                  className="mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-[0.8125rem] outline-none focus:border-forest"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-semibold text-ink">Primary Crop</label>
                <select
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  className="mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-[0.8125rem] outline-none focus:border-forest"
                >
                  {CROPS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[0.75rem] font-semibold text-ink">Area (Hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  value={farmArea}
                  onChange={(e) => setFarmArea(e.target.value)}
                  placeholder="4.8"
                  className="num mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-[0.8125rem] outline-none focus:border-forest"
                />
              </div>
            </div>
          </div>
        )}

        {role === "officer" && (
          <div className="rounded-[var(--r)] border border-line bg-surface-2 p-3.5">
            <span className="text-caption text-forest">Extension Subdivision</span>
            <div className="mt-2">
              <label className="block text-[0.75rem] font-semibold text-ink">Sub-Division Jurisdiction</label>
              <input
                type="text"
                value={subdivision}
                onChange={(e) => setSubdivision(e.target.value)}
                placeholder="Akola Subdivision — Cluster B"
                className="mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-[0.8125rem] outline-none focus:border-forest"
              />
            </div>
          </div>
        )}

        {role === "expert" && (
          <div className="rounded-[var(--r)] border border-line bg-surface-2 p-3.5">
            <span className="text-caption text-forest">Scientific Specialization</span>
            <div className="mt-2">
              <label className="block text-[0.75rem] font-semibold text-ink">Area of Expertise</label>
              <select
                value={expertiseArea}
                onChange={(e) => setExpertiseArea(e.target.value)}
                className="mt-1 w-full border border-line bg-paper px-2.5 py-1.5 text-[0.8125rem] outline-none focus:border-forest"
              >
                <option value="Plant Pathology">Plant Pathology (Fungal & Bacterial Diseases)</option>
                <option value="Agricultural Entomology">Agricultural Entomology (Pests & Vectors)</option>
                <option value="Agronomy & Crop Physiology">Agronomy & Crop Physiology</option>
                <option value="Soil & Environmental Chemistry">Soil & Environmental Chemistry</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-district" className="block text-[0.8125rem] font-semibold text-ink">
              District
            </label>
            <select
              id="signup-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            >
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="signup-language" className="block text-[0.8125rem] font-semibold text-ink">
              Preferred Language
            </label>
            <select
              id="signup-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 block w-full border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-forest"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2 pt-1 text-[0.8125rem]">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 size-4 accent-forest"
          />
          <span>
            I agree to the <span className="font-semibold text-forest">Terms of Use</span> and data privacy policy.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[46px] w-full items-center justify-center border border-forest bg-forest text-[0.9375rem] font-semibold text-surface hover:bg-[#0e2b20] disabled:opacity-60"
        >
          {loading ? "Creating account…" : `Create ${ROLE_LABELS[role]} Account`}
        </button>
      </form>

      <p className="mt-5 text-center text-[0.8125rem] text-ink-2">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-forest hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
