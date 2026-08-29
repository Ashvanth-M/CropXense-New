import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Panel, Updated, CaseStatusChip, ConfidenceCell } from "@/components/app/bits";
import { RankBar } from "@/components/app/Sparkline";
import { Drawer } from "@/components/ui/Overlay";
import { useAsync } from "@/hooks/useAsync";
import {
  CROPS,
  DISTRICTS,
  STATUS_LABEL,
  assignFieldVisit,
  cropName,
  districtName,
  farmById,
  getAssessments,
  getFieldVisits,
  getOutbreaks,
  isoDay,
  subscribe,
  threatName,
  TODAY,
  validateCase,
} from "@/services";
import type { CropHealthAssessment } from "@/types";
import { cx } from "@/lib/cx";
import { FileBarChart, CheckCircle2, Download, Printer, Send, Search } from "lucide-react";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Validations — CropXense Extension Officer" },
      {
        name: "description",
        content:
          "Departmental surveillance reporting, district summaries, and case validation status audit log.",
      },
      { property: "og:title", content: "Reports & Validations — CropXense" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: UnifiedReportsAndValidationPage,
});

type DistrictRow = {
  district: string;
  cases: number;
  confirmed: number;
  pending: number;
  rejected: number;
  area: number;
  share: number;
};

type ThreatRow = {
  threat: string;
  crop: string;
  cases: number;
  avgConfidence: number;
  severe: number;
};

function UnifiedReportsAndValidationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"reports" | "validations">("reports");
  const [districtId, setDistrictId] = useState("");
  const [cropId, setCropId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CropHealthAssessment | null>(null);
  const [busy, setBusy] = useState(false);

  const casesQ = useAsync(() => getAssessments(), []);
  const visitsQ = useAsync(() => getFieldVisits(), []);
  const outbreaksQ = useAsync(() => getOutbreaks(), []);

  useEffect(() => {
    return subscribe(() => {
      casesQ.reload();
      visitsQ.reload();
    });
  }, [casesQ.reload, visitsQ.reload]);

  const cases: CropHealthAssessment[] = useMemo(
    () =>
      (casesQ.data ?? []).filter(
        (c) => (!districtId || c.districtId === districtId) && (!cropId || c.cropId === cropId),
      ),
    [casesQ.data, districtId, cropId],
  );

  const visits = visitsQ.data ?? [];
  const completedVisits = visits.filter((v) => v.status === "completed").length;
  const confirmedCount = cases.filter((c) =>
    ["expert_confirmed", "field_confirmed", "resolved"].includes(c.status),
  ).length;
  const rejectedCount = cases.filter((c) => c.status === "rejected").length;
  const reviewed = confirmedCount + rejectedCount;
  const agreement = reviewed ? Math.round((confirmedCount / reviewed) * 100) : 90;
  const affectedArea = Math.round(cases.reduce((n, c) => n + c.affectedAreaHa, 0));

  const districtRows: DistrictRow[] = useMemo(() => {
    const rows = DISTRICTS.map((d) => {
      const list = cases.filter((c) => c.districtId === d.id);
      return {
        district: d.name,
        cases: list.length,
        confirmed: list.filter((c) =>
          ["expert_confirmed", "field_confirmed", "resolved"].includes(c.status),
        ).length,
        pending: list.filter((c) => ["detected", "awaiting_validation"].includes(c.status)).length,
        rejected: list.filter((c) => c.status === "rejected").length,
        area: Math.round(list.reduce((n, c) => n + c.affectedAreaHa, 0)),
        share: 0,
      };
    });
    const maxArea = Math.max(1, ...rows.map((r) => r.area));
    return rows.map((r) => ({ ...r, share: Math.round((r.area / maxArea) * 100) }));
  }, [cases]);

  const threatRows: ThreatRow[] = useMemo(() => {
    const map = new Map<string, CropHealthAssessment[]>();
    for (const c of cases) {
      const key = `${c.threatId}:${c.cropId}`;
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    const result: ThreatRow[] = [];
    map.forEach((list, key) => {
      const [tId, crId] = key.split(":");
      const avgConf = Math.round(list.reduce((n, c) => n + c.confidence, 0) / list.length);
      const severe = list.filter((c) => c.severity >= 4).length;
      result.push({
        threat: threatName(tId!),
        crop: cropName(crId!),
        cases: list.length,
        avgConfidence: avgConf,
        severe,
      });
    });
    return result.sort((a, b) => b.cases - a.cases);
  }, [cases]);

  const validationList = useMemo(() => {
    return cases.filter((c) => {
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
          ? c.status === "awaiting_validation" || c.status === "detected"
          : statusFilter === "confirmed"
          ? ["expert_confirmed", "field_confirmed", "resolved"].includes(c.status)
          : c.status === statusFilter;

      const farm = farmById(c.farmId);
      const matchSearch =
        !searchQuery ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.suspected.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (farm?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [cases, statusFilter, searchQuery]);

  function exportCsv() {
    const header = ["District", "Cases", "Confirmed", "Pending", "Rejected", "Affected Area (ha)"];
    const body = districtRows.map((r) => [r.district, r.cases, r.confirmed, r.pending, r.rejected, r.area]);
    const csv = [header, ...body].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cropxense-surveillance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Surveillance summary exported as CSV");
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Departmental Operations</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">
              Reports & Validations Console
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Combined workspace for district surveillance summaries, expert agreement metrics, and validation audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="size-4" />
              <span>Export CSV</span>
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" />
              <span>Print / Save PDF</span>
            </Button>
            <Button onClick={() => toast("Report transmitted to National Department of Agriculture")}>
              <Send className="size-4" />
              <span>Send to District Office</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 pt-3">
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={cx(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[0.875rem] font-semibold transition-colors",
            activeTab === "reports"
              ? "border-forest text-forest"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          <FileBarChart className="size-4" />
          <span>Departmental Reports & Metrics</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("validations")}
          className={cx(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[0.875rem] font-semibold transition-colors",
            activeTab === "validations"
              ? "border-forest text-forest"
              : "border-transparent text-ink-2 hover:text-ink",
          )}
        >
          <CheckCircle2 className="size-4" />
          <span>Validation Status & Case Registry ({cases.length})</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid gap-3 border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="District"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: "All districts" }, ...DISTRICTS.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <Select
          label="Crop"
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          options={[{ value: "", label: "All crops" }, ...CROPS.map((c) => ({ value: c.id, label: c.name }))]}
        />
        {activeTab === "validations" && (
          <div className="relative flex items-end">
            <Search className="absolute left-3 bottom-3 size-4 text-ink-2" />
            <input
              type="text"
              placeholder="Search case, farm or disease…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-line bg-paper py-2.5 pl-9 pr-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
            />
          </div>
        )}
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">Cases Recorded</span>
              <p className="num mt-1 text-[1.5rem] font-bold">{cases.length}</p>
              <p className="text-[0.75rem] text-ink-2">in selection</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">Expert Agreement</span>
              <p className="num mt-1 text-[1.5rem] font-bold text-forest">{agreement}%</p>
              <p className="text-[0.75rem] text-ink-2">{reviewed} cases reviewed</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">Area Under Watch</span>
              <p className="num mt-1 text-[1.5rem] font-bold text-water">{affectedArea} ha</p>
              <p className="text-[0.75rem] text-ink-2">sum of case areas</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">Field Visits Completed</span>
              <p className="num mt-1 text-[1.5rem] font-bold">
                {completedVisits}/{visits.length}
              </p>
              <p className="text-[0.75rem] text-ink-2">assigned this season</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">Active Outbreaks</span>
              <p className="num mt-1 text-[1.5rem] font-bold text-amber">
                {(outbreaksQ.data ?? []).filter((o) => o.risk === "high").length}
              </p>
              <p className="text-[0.75rem] text-ink-2">high risk clusters</p>
            </div>
          </div>

          {/* District Summary Table */}
          <Panel title="District Summary" meta={`${districtRows.length} districts reporting`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                    <th className="p-3.5 font-semibold">District</th>
                    <th className="p-3.5 num text-right font-semibold">Cases</th>
                    <th className="p-3.5 num text-right font-semibold">Confirmed</th>
                    <th className="p-3.5 num text-right font-semibold">Pending Review</th>
                    <th className="p-3.5 num text-right font-semibold">Rejected</th>
                    <th className="p-3.5 num text-right font-semibold">Area (ha)</th>
                    <th className="p-3.5 font-semibold">Relative Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {districtRows.map((r) => (
                    <tr key={r.district} className="hover:bg-surface-2">
                      <td className="p-3.5 font-semibold">{r.district}</td>
                      <td className="num p-3.5 text-right font-semibold">{r.cases}</td>
                      <td className="num p-3.5 text-right text-forest font-semibold">{r.confirmed}</td>
                      <td className="num p-3.5 text-right text-amber">{r.pending}</td>
                      <td className="num p-3.5 text-right text-ink-2">{r.rejected}</td>
                      <td className="num p-3.5 text-right font-semibold">{r.area}</td>
                      <td className="p-3.5 min-w-[140px]">
                        <RankBar value={r.share} max={100} tone="var(--forest)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Threat Breakdown Table */}
          <Panel title="Threat Breakdown" meta="cases grouped by pathogen / pest">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                    <th className="p-3.5 font-semibold">Threat Name</th>
                    <th className="p-3.5 font-semibold">Primary Crop</th>
                    <th className="p-3.5 num text-right font-semibold">Cases</th>
                    <th className="p-3.5 num text-right font-semibold">Avg AI Confidence</th>
                    <th className="p-3.5 num text-right font-semibold">Severe Cases (≥4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {threatRows.map((t, i) => (
                    <tr key={i} className="hover:bg-surface-2">
                      <td className="p-3.5 font-semibold">{t.threat}</td>
                      <td className="p-3.5">{t.crop}</td>
                      <td className="num p-3.5 text-right font-semibold">{t.cases}</td>
                      <td className="num p-3.5 text-right">{t.avgConfidence}%</td>
                      <td className="num p-3.5 text-right font-semibold text-alert">{t.severe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* TAB 2: VALIDATION STATUS */}
      {activeTab === "validations" && (
        <Panel title="Case Validation Registry" meta={`${validationList.length} records in queue`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                  <th className="p-3.5 font-semibold">Case ID</th>
                  <th className="p-3.5 font-semibold">Farm & Village</th>
                  <th className="p-3.5 font-semibold">District</th>
                  <th className="p-3.5 font-semibold">Crop</th>
                  <th className="p-3.5 font-semibold">Suspected Threat</th>
                  <th className="p-3.5 font-semibold">Confidence</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {validationList.map((c) => {
                  const farm = farmById(c.farmId);
                  return (
                    <tr key={c.id} className="hover:bg-surface-2">
                      <td className="num p-3.5 font-semibold">{c.id}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-ink">{farm?.name ?? c.farmId}</p>
                        <p className="text-[0.75rem] text-ink-2">{farm?.ownerName} · {farm?.village}</p>
                      </td>
                      <td className="p-3.5">{districtName(c.districtId)}</td>
                      <td className="p-3.5">{cropName(c.cropId)}</td>
                      <td className="p-3.5 font-semibold">{c.suspected}</td>
                      <td className="p-3.5">
                        <ConfidenceCell value={c.confidence} />
                      </td>
                      <td className="p-3.5">
                        <CaseStatusChip status={c.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedCase(c)}>
                          Audit & Validate
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Validation Detail Drawer */}
      {selectedCase && (
        <Drawer open onClose={() => setSelectedCase(null)} title={`Validate Case: ${selectedCase.id}`}>
          <div className="space-y-4 text-[0.875rem]">
            <div className="border border-line bg-paper p-4">
              <span className="text-caption text-forest">Case Details</span>
              <h3 className="font-expanded text-[1.25rem] font-bold">{selectedCase.suspected}</h3>
              <p className="text-[0.8125rem] text-ink-2">
                Field: {farmById(selectedCase.farmId)?.name} · District: {districtName(selectedCase.districtId)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Confidence</span>
                <div className="mt-1"><ConfidenceCell value={selectedCase.confidence} /></div>
              </div>
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Affected Area</span>
                <p className="num mt-1 font-bold">{selectedCase.affectedAreaHa} ha</p>
              </div>
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Status</span>
                <div className="mt-1"><CaseStatusChip status={selectedCase.status} /></div>
              </div>
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">Crop</span>
                <p className="mt-1 font-semibold">{cropName(selectedCase.cropId)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await validateCase(selectedCase.id, "confirmed", "Pathology confirmed.");
                    toast("Case confirmed and added to official surveillance registry", "healthy");
                    setSelectedCase(null);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirm Finding
              </Button>

              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await assignFieldVisit(selectedCase.id, isoDay(1));
                    toast("Field visit scheduled for tomorrow", "healthy");
                    setSelectedCase(null);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Schedule Field Visit
              </Button>

              <Button
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await validateCase(selectedCase.id, "rejected", "Non-pathogenic abiotic symptoms.");
                    toast("Case rejected");
                    setSelectedCase(null);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Reject Case
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
