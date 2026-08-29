import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  X,
  Search,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SeverityMeter } from "@/components/ui/Status";
import { useToast } from "@/components/ui/Toast";
import { CaseStatusChip, ConfidenceCell, Panel, relTime } from "@/components/app/bits";
import { LeafPlate, SAMPLES } from "@/components/app/LeafPlate";
import { Drawer } from "@/components/ui/Overlay";
import { Skeleton } from "@/components/ui/Card";
import { useAsync } from "@/hooks/useAsync";
import {
  assignFieldVisit,
  farmById,
  getAssessments,
  isoDay,
  issueAdvisory,
  subscribe,
  TODAY,
  validateCase,
} from "@/services";
import type { CropHealthAssessment } from "@/types";
import { cx } from "@/lib/cx";
import { useT } from "@/i18n";

export const Route = createFileRoute("/app/crop-health")({
  head: () => ({
    meta: [
      { title: "Crop Health Submissions — CropXense Officer" },
      {
        name: "description",
        content: "Extension officer review console for farmer-uploaded crop health scans and diagnostic validations.",
      },
      { property: "og:title", content: "Crop Health Submissions — CropXense" },
      { property: "og:description", content: "Farmer crop health upload feed and validation workspace." },
    ],
  }),
  component: OfficerCropHealthPage,
});

function OfficerCropHealthPage() {
  const { toast } = useToast();
  const { t, tCrop, tDistrict, tStatus } = useT();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<CropHealthAssessment | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const assessmentsQ = useAsync(() => getAssessments(), []);

  useEffect(() => {
    return subscribe(() => {
      assessmentsQ.reload();
    });
  }, [assessmentsQ.reload]);

  const filteredAssessments = useMemo(() => {
    const list = assessmentsQ.data ?? [];
    return list.filter((a) => {
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
          ? a.status === "awaiting_validation" || a.status === "detected"
          : statusFilter === "confirmed"
          ? a.status === "expert_confirmed" || a.status === "field_confirmed"
          : a.status === statusFilter;

      const farm = farmById(a.farmId);
      const matchSearch =
        !searchQuery ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.suspected.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (farm?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (farm?.ownerName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (farm?.village ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [assessmentsQ.data, statusFilter, searchQuery]);

  const pendingCount = (assessmentsQ.data ?? []).filter(
    (a) => a.status === "awaiting_validation" || a.status === "detected",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">{t("nav.cropHealth")}</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">
              {t("nav.cropHealth")}
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              {t("role.officerDesc")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="border border-forest/30 bg-forest/10 px-4 py-2 text-[0.8125rem]">
              <span className="text-ink-2">{t("officer.pendingExpertReview")}:</span>{" "}
              <span className="num font-bold text-forest">{pendingCount} {t("common.cases")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="flex flex-col gap-3 border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: t("common.all") },
            { id: "pending", label: `${t("caseStatus.awaiting_validation")} (${pendingCount})` },
            { id: "confirmed", label: t("caseStatus.expert_confirmed") },
            { id: "rejected", label: t("caseStatus.rejected") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cx(
                "inline-flex min-h-[38px] items-center rounded-[var(--r)] px-3 text-[0.8125rem] font-semibold transition-colors",
                statusFilter === tab.id
                  ? "bg-forest text-surface"
                  : "border border-line bg-paper text-ink hover:bg-surface-2",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
          <input
            type="text"
            placeholder={t("fields.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-line bg-paper py-2 pl-9 pr-3 text-[0.8125rem] text-ink outline-none transition-colors focus:border-forest"
          />
        </div>
      </div>

      {/* Submissions Feed / Table */}
      <Panel title={t("nav.cropHealth")} meta={`${filteredAssessments.length} ${t("common.cases")}`}>
        {assessmentsQ.loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-8 text-center text-[0.9375rem] text-ink-2">
            {t("empty.noCases")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                  <th className="p-3.5 font-semibold">{t("field.caseId")}</th>
                  <th className="p-3.5 font-semibold">{t("field.farm")}</th>
                  <th className="p-3.5 font-semibold">{t("field.crop")}</th>
                  <th className="p-3.5 font-semibold">{t("field.suspected")}</th>
                  <th className="p-3.5 font-semibold">{t("field.confidence")}</th>
                  <th className="p-3.5 font-semibold">{t("field.age")}</th>
                  <th className="p-3.5 font-semibold">{t("field.health")}</th>
                  <th className="p-3.5 text-right font-semibold">{t("action.viewCase")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredAssessments.map((a) => {
                  const farm = farmById(a.farmId);
                  return (
                    <tr key={a.id} className="group transition-colors hover:bg-surface-2">
                      <td className="p-3.5">
                        <span className="num font-semibold text-ink">{a.id}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-ink">
                          {farm?.ownerName ?? t("role.farmer")}
                        </p>
                        <p className="text-[0.75rem] text-ink-2">
                          {farm?.name ?? a.farmId}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-ink">{tCrop(a.cropId)}</p>
                        <p className="text-[0.75rem] text-ink-2">
                          {farm?.village ?? tDistrict(a.districtId)}, {tDistrict(a.districtId)}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-ink">{a.suspected}</span>
                        <div className="mt-0.5">
                          <SeverityMeter level={a.severity} />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <ConfidenceCell value={a.confidence} />
                      </td>
                      <td className="num p-3.5 text-[0.8125rem] text-ink-2">
                        {relTime(a.detectedAt, TODAY)}
                      </td>
                      <td className="p-3.5">
                        <CaseStatusChip status={a.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedCase(a)}
                        >
                          {t("action.viewCase")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Case Review Drawer */}
      {selectedCase && (
        <Drawer
          open
          onClose={() => setSelectedCase(null)}
          title={`${t("field.caseId")}: ${selectedCase.id}`}
        >
          <div className="space-y-5 text-[0.875rem]">
            {/* Header info */}
            <div className="border border-line bg-paper p-4">
              <span className="text-caption text-forest">{t("field.suspected")}</span>
              <h3 className="font-expanded text-[1.25rem] font-bold text-ink">
                {selectedCase.suspected}
              </h3>
              <p className="mt-1 text-[0.8125rem] text-ink-2">
                {t("field.owner")}:{" "}
                <span className="font-semibold text-ink">
                  {farmById(selectedCase.farmId)?.ownerName ?? t("role.farmer")}
                </span>{" "}
                · {t("field.farm")}:{" "}
                <span className="font-semibold text-ink">
                  {farmById(selectedCase.farmId)?.name ?? selectedCase.farmId}
                </span>{" "}
                ({farmById(selectedCase.farmId)?.village ?? tDistrict(selectedCase.districtId)})
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">{t("field.crop")}</span>
                <p className="mt-1 font-semibold">{tCrop(selectedCase.cropId)}</p>
              </div>
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">{t("field.confidence")}</span>
                <div className="mt-1">
                  <ConfidenceCell value={selectedCase.confidence} />
                </div>
              </div>
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">{t("field.severity")}</span>
                <div className="mt-1">
                  <SeverityMeter level={selectedCase.severity} />
                </div>
              </div>
              <div className="border border-line bg-paper p-3">
                <span className="text-caption">{t("field.health")}</span>
                <div className="mt-1">
                  <CaseStatusChip status={selectedCase.status} />
                </div>
              </div>
            </div>

            {/* Leaf Illustration Preview */}
            <div className="border border-line bg-paper p-4">
              <span className="text-caption block mb-2 font-semibold">{t("expert.imageAnalysis")}</span>
              <div className="flex justify-center bg-surface p-4 border border-line">
                <LeafPlate sample={SAMPLES[0]!} analysis={true} className="max-w-[200px]" />
              </div>
            </div>

            {/* Evidence items */}
            <div>
              <span className="text-caption block mb-2 font-semibold">{t("expert.caseEvidence")}</span>
              <ul className="space-y-2">
                {(selectedCase.evidence ?? []).map((e, i) => (
                  <li key={i} className="border border-line bg-paper p-3 text-[0.8125rem]">
                    <span className="font-semibold text-ink">{e.label}</span>
                    <p className="mt-0.5 text-ink-2">{e.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Officer Action Buttons */}
            <div className="space-y-2 border-t border-line pt-4">
              <span className="text-caption block font-semibold text-forest">{t("officer.priorityQueue")}</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={actionBusy}
                  onClick={async () => {
                    setActionBusy(true);
                    try {
                      await validateCase(selectedCase.id, "confirmed", "Confirmed on field inspection evidence.");
                      await issueAdvisory(selectedCase.id);
                      toast(t("toast.saved"), "healthy");
                      setSelectedCase(null);
                    } finally {
                      setActionBusy(false);
                    }
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  <span>{t("officer.confirmCase")}</span>
                </Button>

                <Button
                  variant="secondary"
                  disabled={actionBusy}
                  onClick={async () => {
                    setActionBusy(true);
                    try {
                      await assignFieldVisit(selectedCase.id, isoDay(1));
                      toast(t("toast.fieldVisitAssigned"), "healthy");
                      setSelectedCase(null);
                    } finally {
                      setActionBusy(false);
                    }
                  }}
                >
                  <Calendar className="size-4" />
                  <span>{t("officer.assignFieldVisit")}</span>
                </Button>

                <Button
                  variant="ghost"
                  disabled={actionBusy}
                  onClick={async () => {
                    setActionBusy(true);
                    try {
                      await validateCase(selectedCase.id, "rejected", "Symptoms appear abiotic/nutritional.");
                      toast(t("officer.rejectCase"));
                      setSelectedCase(null);
                    } finally {
                      setActionBusy(false);
                    }
                  }}
                >
                  <X className="size-4" />
                  <span>{t("action.reject")}</span>
                </Button>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
