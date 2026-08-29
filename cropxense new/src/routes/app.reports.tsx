import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { Panel, CaseStatusChip, ConfidenceCell } from "@/components/app/bits";
import { RankBar } from "@/components/app/Sparkline";
import { Drawer } from "@/components/ui/Overlay";
import { useAsync } from "@/hooks/useAsync";
import {
  CROPS,
  DISTRICTS,
  assignFieldVisit,
  farmById,
  getAssessments,
  getFieldVisits,
  getOutbreaks,
  isoDay,
  subscribe,
  threatName,
  validateCase,
} from "@/services";
import type { CropHealthAssessment } from "@/types";
import { cx } from "@/lib/cx";
import { FileBarChart, CheckCircle2, Download, Printer, Send, Search } from "lucide-react";
import { useT } from "@/i18n";

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
  const { t, tCrop, tDistrict, tStatus } = useT();
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
        district: tDistrict(d.id),
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
  }, [cases, tDistrict]);

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
        crop: tCrop(crId!),
        cases: list.length,
        avgConfidence: avgConf,
        severe,
      });
    });
    return result.sort((a, b) => b.cases - a.cases);
  }, [cases, tCrop]);

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
    const header = [t("field.district"), t("common.cases"), t("caseStatus.expert_confirmed"), t("caseStatus.awaiting_validation"), t("caseStatus.rejected"), t("field.area")];
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
    toast(t("toast.saved"));
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">{t("nav.reports")}</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">
              {t("nav.reports")}
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              {t("role.officerDesc")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="size-4" />
              <span>{t("action.export")}</span>
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" />
              <span>{t("action.print")}</span>
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
          <span>{t("nav.reports")}</span>
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
          <span>{t("expert.historyTitle")} ({cases.length})</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="grid gap-3 border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label={t("field.district")}
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          options={[{ value: "", label: t("common.all") }, ...DISTRICTS.map((d) => ({ value: d.id, label: tDistrict(d.id) }))]}
        />
        <Select
          label={t("field.crop")}
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          options={[{ value: "", label: t("common.all") }, ...CROPS.map((c) => ({ value: c.id, label: tCrop(c.id) }))]}
        />
        {activeTab === "validations" && (
          <div className="relative flex items-end">
            <Search className="absolute left-3 bottom-3 size-4 text-ink-2" />
            <input
              type="text"
              placeholder={t("fields.searchPlaceholder")}
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
              <span className="text-caption">{t("common.cases")}</span>
              <p className="num mt-1 text-[1.5rem] font-bold">{cases.length}</p>
              <p className="text-[0.75rem] text-ink-2">{t("common.total")}</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">{t("expert.confirmedToday")}</span>
              <p className="num mt-1 text-[1.5rem] font-bold text-forest">{agreement}%</p>
              <p className="text-[0.75rem] text-ink-2">{reviewed} {t("common.cases")}</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">{t("officer.atRisk")}</span>
              <p className="num mt-1 text-[1.5rem] font-bold text-water">{affectedArea} ha</p>
              <p className="text-[0.75rem] text-ink-2">{t("farmer.totalArea")}</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">{t("followup.completed")}</span>
              <p className="num mt-1 text-[1.5rem] font-bold">
                {completedVisits}/{visits.length}
              </p>
              <p className="text-[0.75rem] text-ink-2">{t("officer.assignFieldVisit")}</p>
            </div>
            <div className="border border-line bg-surface p-4">
              <span className="text-caption">{t("officer.activeOutbreaks")}</span>
              <p className="num mt-1 text-[1.5rem] font-bold text-amber">
                {(outbreaksQ.data ?? []).filter((o) => o.risk === "high").length}
              </p>
              <p className="text-[0.75rem] text-ink-2">{t("risk.high")}</p>
            </div>
          </div>

          {/* District Summary Table */}
          <Panel title={t("officer.districtRisk")} meta={`${districtRows.length} ${t("field.district")}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                    <th className="p-3.5 font-semibold">{t("field.district")}</th>
                    <th className="p-3.5 num text-right font-semibold">{t("common.cases")}</th>
                    <th className="p-3.5 num text-right font-semibold">{t("caseStatus.expert_confirmed")}</th>
                    <th className="p-3.5 num text-right font-semibold">{t("caseStatus.awaiting_validation")}</th>
                    <th className="p-3.5 num text-right font-semibold">{t("caseStatus.rejected")}</th>
                    <th className="p-3.5 num text-right font-semibold">{t("field.area")}</th>
                    <th className="p-3.5 font-semibold">{t("landing.colSignal")}</th>
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
        </div>
      )}

      {/* TAB 2: VALIDATIONS */}
      {activeTab === "validations" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: t("common.all") },
              { id: "pending", label: t("caseStatus.awaiting_validation") },
              { id: "confirmed", label: t("caseStatus.expert_confirmed") },
              { id: "rejected", label: t("caseStatus.rejected") },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cx(
                  "inline-flex min-h-[36px] items-center rounded-[var(--r)] px-3 text-[0.8125rem] font-semibold transition-colors",
                  statusFilter === f.id
                    ? "bg-forest text-surface"
                    : "border border-line bg-paper text-ink hover:bg-surface-2",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Panel title={t("expert.historyTitle")} meta={`${validationList.length} ${t("common.cases")}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[0.875rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                    <th className="p-3.5 font-semibold">{t("field.caseId")}</th>
                    <th className="p-3.5 font-semibold">{t("field.farm")}</th>
                    <th className="p-3.5 font-semibold">{t("field.crop")}</th>
                    <th className="p-3.5 font-semibold">{t("field.suspected")}</th>
                    <th className="p-3.5 font-semibold">{t("field.confidence")}</th>
                    <th className="p-3.5 font-semibold">{t("field.health")}</th>
                    <th className="p-3.5 text-right font-semibold">{t("action.viewCase")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {validationList.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2">
                      <td className="num p-3.5 font-semibold">{c.id}</td>
                      <td className="p-3.5">{farmById(c.farmId)?.name ?? c.farmId}</td>
                      <td className="p-3.5">{tCrop(c.cropId)}</td>
                      <td className="p-3.5 font-semibold">{c.suspected}</td>
                      <td className="p-3.5"><ConfidenceCell value={c.confidence} /></td>
                      <td className="p-3.5"><CaseStatusChip status={c.status} /></td>
                      <td className="p-3.5 text-right">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedCase(c)}>
                          {t("action.viewCase")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* Case Review Drawer */}
      {selectedCase && (
        <Drawer
          open
          onClose={() => setSelectedCase(null)}
          title={`${t("field.caseId")}: ${selectedCase.id}`}
        >
          <div className="space-y-4 text-[0.875rem]">
            <dl className="grid grid-cols-2 gap-3 border border-line p-3">
              <div>
                <dt className="text-caption">{t("field.crop")}</dt>
                <dd className="font-semibold">{tCrop(selectedCase.cropId)}</dd>
              </div>
              <div>
                <dt className="text-caption">{t("field.district")}</dt>
                <dd className="font-semibold">{tDistrict(selectedCase.districtId)}</dd>
              </div>
              <div>
                <dt className="text-caption">{t("field.suspected")}</dt>
                <dd className="font-semibold text-ink">{selectedCase.suspected}</dd>
              </div>
              <div>
                <dt className="text-caption">{t("field.confidence")}</dt>
                <dd><ConfidenceCell value={selectedCase.confidence} /></dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await validateCase(selectedCase.id, "confirmed", "Confirmed from departmental report review.");
                  toast(t("toast.saved"), "healthy");
                  setBusy(false);
                  setSelectedCase(null);
                }}
              >
                {t("officer.confirmCase")}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await assignFieldVisit(selectedCase.id, isoDay(1));
                  toast(t("toast.fieldVisitAssigned"), "healthy");
                  setBusy(false);
                  setSelectedCase(null);
                }}
              >
                {t("officer.assignFieldVisit")}
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
