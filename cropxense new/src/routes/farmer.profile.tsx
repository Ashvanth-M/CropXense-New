/**
 * /farmer/profile — Farmer Profile, Language Preferences & Account Settings.
 *
 * Full-width desktop profile settings, extension officer contact,
 * language cycler, and explicit Logout action.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  UserRound,
  MapPin,
  Sprout,
  Languages,
  Phone,
  LogOut,
  FileCheck,
  Building,
  HelpCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { LANGS, useT } from "@/i18n";
import { useAsync } from "@/hooks/useAsync";
import { getDemoFarms, DEMO_OFFICER } from "@/data/farmerDemo";
import { useAuth } from "@/auth/AuthContext";

export const Route = createFileRoute("/farmer/profile")({
  head: () => ({
    meta: [
      { title: "Farmer Profile & Settings — CropXense" },
      {
        name: "description",
        content: "Farmer profile information, language preferences, registered holdings, and extension officer contacts.",
      },
      { property: "og:title", content: "Farmer Profile & Settings — CropXense" },
      {
        property: "og:description",
        content: "Farmer profile information, language preferences, registered holdings, and extension officer contacts.",
      },
    ],
  }),
  component: FarmerProfilePage,
});

function FarmerProfilePage() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useT();
  const { data: farms, loading } = useAsync(() => getDemoFarms(), []);
  const primaryFarm = farms?.[0];

  const totalArea = (farms ?? []).reduce((acc, f) => acc + f.areaHa, 0).toFixed(1);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <span className="text-caption text-forest">Account & Preferences</span>
        <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">Profile & Settings</h1>
      </div>

      {/* Main 2-Column Profile Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Personal and Holdings Info */}
        <div className="space-y-6 lg:col-span-7">
          {/* Identity Card */}
          <div className="border border-line bg-surface p-5">
            <h2 className="font-display text-[1.125rem] font-semibold border-b border-line pb-3">
              Farmer Identity & Land Records
            </h2>

            {loading ? (
              <Skeleton className="mt-4 h-32 w-full" />
            ) : (
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-[0.875rem]">
                <div className="border border-line bg-paper p-3">
                  <dt className="text-caption">Full Name</dt>
                  <dd className="mt-1 font-semibold text-ink">{user?.name || primaryFarm?.ownerName || "Ramesh Kumar"}</dd>
                </div>

                <div className="border border-line bg-paper p-3">
                  <dt className="text-caption">Role Type</dt>
                  <dd className="mt-1 font-semibold uppercase text-forest">Registered Farmer</dd>
                </div>

                <div className="border border-line bg-paper p-3">
                  <dt className="text-caption">Village & District</dt>
                  <dd className="mt-1 text-ink">{primaryFarm?.village || "Akola"}, Maharashtra</dd>
                </div>

                <div className="border border-line bg-paper p-3">
                  <dt className="text-caption">Contact Mobile</dt>
                  <dd className="num mt-1 text-ink">{user?.mobile || "+91 98765 43210"}</dd>
                </div>

                <div className="border border-line bg-paper p-3">
                  <dt className="text-caption">Registered Plots</dt>
                  <dd className="num mt-1 font-bold text-ink">{farms?.length || 3} Parcels</dd>
                </div>

                <div className="border border-line bg-paper p-3">
                  <dt className="text-caption">Total Land Area</dt>
                  <dd className="num mt-1 font-bold text-ink">{totalArea} Hectares</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Language Selection */}
          <div className="border border-line bg-surface p-5">
            <h2 className="font-display text-[1.125rem] font-semibold border-b border-line pb-3">
              Preferred Advisory Language
            </h2>
            <p className="mt-2 text-[0.8125rem] text-ink-2">
              Select your preferred language for pest advisories, notifications, and weather warnings.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {LANGS.map((item) => {
                const isSelected = lang === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    className={`flex flex-col items-center justify-center min-h-[52px] rounded-[var(--r)] border p-3 font-semibold text-[0.9375rem] transition-colors ${
                      isSelected
                        ? "border-forest bg-forest text-surface"
                        : "border-line bg-paper text-ink hover:bg-surface-2"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[0.6875rem] uppercase ${isSelected ? "text-surface/80" : "text-ink-2"}`}>
                      {item.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Support, Officer & Explicit Logout */}
        <div className="space-y-6 lg:col-span-5">
          {/* Extension Officer Contact */}
          <div className="border border-line bg-surface p-5">
            <h2 className="font-display text-[1.125rem] font-semibold border-b border-line pb-3">
              Assigned Extension Staff
            </h2>

            <div className="mt-4 border border-line bg-paper p-4 text-[0.875rem]">
              <p className="font-semibold text-ink">{DEMO_OFFICER.name}</p>
              <p className="text-[0.8125rem] text-ink-2">Agriculture Officer · Akola Sub-division</p>
              <p className="mt-2 text-[0.8125rem] text-ink-2">
                Available Mon–Sat (09:00–17:00) for field sample confirmations and chemical dosage approval.
              </p>

              <a
                href={`tel:${DEMO_OFFICER.phone}`}
                className="mt-3 flex min-h-[40px] items-center justify-center gap-2 border border-forest bg-forest text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
              >
                <Phone className="size-3.5" />
                <span>Call Officer ({DEMO_OFFICER.phone})</span>
              </a>
            </div>
          </div>

          {/* Prominent Explicit Logout Card */}
          <div className="border border-alert/30 bg-alert/5 p-5">
            <h2 className="font-display text-[1.125rem] font-semibold text-alert">
              Sign Out of Session
            </h2>
            <p className="mt-1 text-[0.8125rem] text-ink-2">
              End your authenticated farmer session. You will be returned to the public homepage.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--r)] border border-alert bg-alert text-[0.875rem] font-semibold text-surface hover:bg-alert/90"
            >
              <LogOut className="size-4" />
              <span>Sign Out of CropXense</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
