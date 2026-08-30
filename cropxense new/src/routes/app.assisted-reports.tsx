/**
 * /app/assisted-reports — Officer Assisted Farmer Reports page.
 *
 * Officers can enter reports on behalf of farmers without smartphones/internet,
 * and view all farmer-reported cases from all sources.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { UserPlus, Mic, ScanLine, Phone, Clock } from "lucide-react";
import { getAllReportsForOfficer, subscribe } from "@/services";
import { AssistedReportForm } from "@/components/app/AssistedReportForm";
import { CaseTimeline } from "@/components/app/CaseTimeline";
import { cx } from "@/lib/cx";
import type { UnifiedReport } from "@/services/supabaseService";

export const Route = createFileRoute("/app/assisted-reports")({
  head: () => ({
    meta: [
      { title: "Assisted Farmer Reports — Field Operations" },
      { name: "description", content: "Enter crop-health reports on behalf of farmers without smartphones or internet access." },
    ],
  }),
  component: AssistedReportsPage,
});

const SOURCE_LABELS: Record<string, { label: string; icon: typeof ScanLine; color: string }> = {
  scan: { label: "Smartphone Report", icon: ScanLine, color: "text-forest bg-forest/10" },
  voice_report: { label: "Voice Report", icon: Mic, color: "text-purple-600 bg-purple-50" },
  assisted_report: { label: "Officer-Assisted Report", icon: UserPlus, color: "text-amber bg-amber/10" },
};

function AssistedReportsPage() {
  const [reports, setReports] = useState<UnifiedReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  useEffect(() => {
    setReports(getAllReportsForOfficer());
    return subscribe(() => setReports(getAllReportsForOfficer()));
  }, []);

  const filteredReports = useMemo(() => {
    if (sourceFilter === "all") return reports;
    return reports.filter((r) => r.source === sourceFilter);
  }, [reports, sourceFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <section className="border border-line bg-surface p-5 md:p-6 shadow-panel">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest font-bold uppercase tracking-wider">CropXense · Assisted Reports</span>
            <h1 className="mt-1 font-expanded text-[1.625rem] md:text-[2rem] font-bold leading-tight text-ink">
              Farmer Reports — All Sources
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              View and manage reports from smartphones, voice calls, and officer-assisted entries.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex min-h-[44px] items-center gap-2 border border-forest bg-forest px-4 text-[0.9375rem] font-semibold text-surface transition-colors hover:bg-[#0e2b20] shadow-sm"
          >
            <UserPlus className="size-4" />
            {showForm ? "Hide Form" : "New Assisted Report"}
          </button>
        </div>
      </section>

      {/* Assisted Report Form */}
      {showForm && (
        <AssistedReportForm onReportCreated={() => {
          setReports(getAllReportsForOfficer());
          setShowForm(false);
        }} />
      )}

      {/* Source Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Sources" },
          { value: "scan", label: "Smartphone" },
          { value: "voice_report", label: "Voice Reports" },
          { value: "assisted_report", label: "Officer-Assisted" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSourceFilter(opt.value)}
            className={cx(
              "px-3 py-1.5 text-xs font-semibold border transition-colors",
              sourceFilter === opt.value ? "border-forest bg-forest text-surface" : "border-line bg-surface text-ink hover:bg-surface-2"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <section className="border border-line bg-surface shadow-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="px-4 py-3 text-left text-caption font-bold">Source</th>
                <th className="px-4 py-3 text-left text-caption font-bold">Farmer</th>
                <th className="px-4 py-3 text-left text-caption font-bold">Village</th>
                <th className="px-4 py-3 text-left text-caption font-bold">Crop</th>
                <th className="px-4 py-3 text-left text-caption font-bold">Problem</th>
                <th className="px-4 py-3 text-left text-caption font-bold">Reported</th>
                <th className="px-4 py-3 text-left text-caption font-bold">Case ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-2">No reports found.</td>
                </tr>
              ) : filteredReports.map((report) => {
                const sourceConfig = SOURCE_LABELS[report.source] || SOURCE_LABELS.scan!;
                const SourceIcon = sourceConfig.icon;
                return (
                  <tr
                    key={report.id}
                    className="border-b border-line hover:bg-surface-2 cursor-pointer transition-colors"
                    onClick={() => setSelectedCaseId(selectedCaseId === report.caseId ? null : report.caseId || null)}
                  >
                    <td className="px-4 py-3">
                      <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] font-bold uppercase", sourceConfig.color)}>
                        <SourceIcon className="size-3" />
                        {sourceConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{report.farmerName}</td>
                    <td className="px-4 py-3 text-ink-2">{report.village}</td>
                    <td className="px-4 py-3 text-ink capitalize">{report.crop}</td>
                    <td className="px-4 py-3 text-ink-2 max-w-[200px] truncate">{report.problem}</td>
                    <td className="px-4 py-3 text-ink-2">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(report.reportedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-forest font-semibold">{report.caseId || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Case Timeline (expanded) */}
      {selectedCaseId && (
        <section className="border border-line bg-surface p-5 shadow-panel">
          <h3 className="font-semibold text-ink mb-3">Case Timeline — {selectedCaseId}</h3>
          <CaseTimeline caseId={selectedCaseId} />
        </section>
      )}
    </div>
  );
}
