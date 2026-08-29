/**
 * /farmer/advisories — Integrated Pest Management (IPM) Advisory Center.
 *
 * Full-width desktop inbox of localized agricultural advisories, detailing
 * cultural, biological, and chemical response protocols issued by subdivision
 * plant protection officers.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  UserCheck,
  ScanLine,
  ChevronDown,
  Layers,
  Phone,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getFarmerFarms, getAdvisories, acknowledgeAdvisory } from "@/services";
import { DEMO_OFFICER } from "@/data/farmerDemo";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import type { Advisory } from "@/types";

export const Route = createFileRoute("/farmer/advisories")({
  head: () => ({
    meta: [
      { title: "Advisory Center — CropXense Farmer" },
      {
        name: "description",
        content: "Personalized IPM advisories and cultural, biological, and chemical recommendations for your farm parcels.",
      },
      { property: "og:title", content: "Advisory Center — CropXense Farmer" },
      {
        property: "og:description",
        content: "Personalized IPM advisories and cultural, biological, and chemical recommendations for your farm parcels.",
      },
    ],
  }),
  component: FarmerAdvisoriesPage,
});

function FarmerAdvisoriesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: farms } = useAsync(() => getFarmerFarms(user), [user]);
  const primaryFarm = farms?.[0];

  const { data: advisories, loading, reload } = useAsync(
    () => (primaryFarm ? getAdvisories(primaryFarm.id) : getAdvisories()),
    [primaryFarm?.id],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "acknowledged">("all");

  const list = (advisories ?? []).filter((a) => {
    if (filter === "active") return !a.acknowledged;
    if (filter === "acknowledged") return a.acknowledged;
    return true;
  });

  async function handleAcknowledge(id: string) {
    await acknowledgeAdvisory(id);
    toast("Advisory marked as acknowledged and stored in your farm ledger.", "healthy");
    if (reload) reload();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Integrated Pest Management</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">Extension Advisories & Action Plans</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Official crop protection advisories issued for your plots by the Department of Agriculture, Maharashtra.
            </p>
          </div>

          <Link
            to="/farmer/scan"
            className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.875rem] font-semibold text-surface hover:bg-[#0e2b20]"
          >
            <ScanLine className="size-4" />
            <span>Scan Crop Today</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
          {[
            { id: "all", label: `All Advisories (${advisories?.length || 0})` },
            { id: "active", label: `Active (${(advisories ?? []).filter((a) => !a.acknowledged).length})` },
            { id: "acknowledged", label: `Acknowledged (${(advisories ?? []).filter((a) => a.acknowledged).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`inline-flex min-h-[36px] items-center rounded-[var(--r)] px-3 text-[0.8125rem] font-semibold transition-colors ${
                filter === tab.id
                  ? "bg-forest text-surface"
                  : "border border-line bg-paper text-ink hover:bg-surface-2"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advisories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="border border-line bg-surface p-8 text-center text-ink-2">
            Loading extension advisories…
          </div>
        ) : list.length === 0 ? (
          <div className="border border-line bg-surface p-8 text-center text-[0.9375rem] text-ink-2">
            No advisories found under the selected filter.
          </div>
        ) : (
          list.map((advisory) => {
            const isExpanded = expandedId === advisory.id || list.length === 1;

            return (
              <div
                key={advisory.id}
                className="border border-line bg-surface overflow-hidden transition-all"
              >
                {/* Advisory Header Card */}
                <div className="p-5 flex flex-col justify-between gap-3 md:flex-row md:items-center border-b border-line bg-paper">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-[0.75rem] font-bold text-ink-2">{advisory.id}</span>
                      {advisory.acknowledged ? (
                        <span className="rounded-[var(--r)] bg-leaf/15 px-2 py-0.5 text-[0.6875rem] font-bold text-leaf">
                          Acknowledged
                        </span>
                      ) : (
                        <span className="rounded-[var(--r)] bg-amber/15 px-2 py-0.5 text-[0.6875rem] font-bold text-amber">
                          Active Action Window
                        </span>
                      )}
                      <span className="num text-[0.75rem] text-ink-2">Issued: {advisory.issuedAt.slice(0, 10)}</span>
                    </div>

                    <h2 className="font-display text-[1.125rem] font-bold text-ink">{advisory.title}</h2>
                    <p className="text-[0.8125rem] text-ink-2">
                      Target Window: <strong className="text-ink">{advisory.window}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!advisory.acknowledged && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(advisory.id)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 border border-forest bg-forest px-3 text-[0.8125rem] font-semibold text-surface hover:bg-[#0e2b20]"
                      >
                        <CheckCircle2 className="size-4" />
                        <span>Mark Acknowledged</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : advisory.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex min-h-[40px] items-center gap-1 border border-line bg-surface px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
                    >
                      <span>{isExpanded ? "Collapse" : "View Steps"}</span>
                      <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded IPM Protocols (3 Columns Desktop) */}
                {isExpanded && (
                  <div className="p-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3 text-[0.875rem]">
                      {/* 1. Cultural */}
                      <div className="border border-line bg-paper p-4">
                        <div className="flex items-center gap-2 font-display text-[0.9375rem] font-bold text-forest">
                          <span className="flex size-6 items-center justify-center rounded-full bg-forest/10 text-[0.75rem]">1</span>
                          <h3>Cultural & Mechanical Measures</h3>
                        </div>
                        <ul className="mt-3 space-y-2 text-[0.8125rem] text-ink">
                          {advisory.cultural.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-forest font-bold">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 2. Biological */}
                      <div className="border border-line bg-paper p-4">
                        <div className="flex items-center gap-2 font-display text-[0.9375rem] font-bold text-leaf">
                          <span className="flex size-6 items-center justify-center rounded-full bg-leaf/10 text-[0.75rem]">2</span>
                          <h3>Biological & Organic Controls</h3>
                        </div>
                        <ul className="mt-3 space-y-2 text-[0.8125rem] text-ink">
                          {advisory.biological.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-leaf font-bold">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Chemical */}
                      <div className="border border-line bg-paper p-4">
                        <div className="flex items-center gap-2 font-display text-[0.9375rem] font-bold text-amber">
                          <span className="flex size-6 items-center justify-center rounded-full bg-amber/10 text-[0.75rem]">3</span>
                          <h3>Chemical Referral (Upon Verification)</h3>
                        </div>
                        <ul className="mt-3 space-y-2 text-[0.8125rem] text-ink">
                          {advisory.chemical.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber font-bold">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Officer Contact Box */}
                    <div className="flex flex-col justify-between gap-3 border border-line bg-surface-2 p-3.5 text-[0.8125rem] sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <UserCheck className="size-4 text-forest" />
                        <span>Issued by: <strong>{DEMO_OFFICER.name}</strong> (Plant Protection Officer, Akola Subdivision)</span>
                      </div>
                      <a
                        href={`tel:${DEMO_OFFICER.phone}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"
                      >
                        <Phone className="size-3.5" />
                        <span>Consult Officer: {DEMO_OFFICER.phone}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
