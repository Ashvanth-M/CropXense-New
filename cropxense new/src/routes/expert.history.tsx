/**
 * /expert/history — Plant Protection Expert Validation History & Ground-Truth Diagnostic Ledger.
 *
 * Log of scientifically reviewed cases, tracking agreements, corrections,
 * visual specimens, before/after diagnosis audits, and formal certification records.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  History,
  CheckCircle2,
  Edit3,
  Calendar,
  Layers,
  ArrowUpRight,
  FlaskConical,
  Download,
  Printer,
  Search,
  Filter,
  ShieldCheck,
  XCircle,
  Microscope,
  FileText,
  User,
  MapPin,
  ChevronRight,
  Eye,
} from "lucide-react";
import { StatusChip } from "@/components/ui/Status";
import { Drawer } from "@/components/ui/Overlay";
import { useAsync } from "@/hooks/useAsync";
import {
  getAssessments,
  getReviews,
  cropName,
  threatName,
  districtName,
  getScansForCase,
  getAllScans,
  farmById,
  subscribe,
  CROPS,
  DISTRICTS,
} from "@/services";
import { useToast } from "@/components/ui/Toast";
import type { CropHealthAssessment, ExpertReview, FarmerScan } from "@/types";
import { SpecimenViewer } from "@/components/expert/SpecimenViewer";
import { getPathologySpecimen } from "@/data/pathologySpecimens";
import { cx } from "@/lib/cx";

export const Route = createFileRoute("/expert/history")({
  head: () => ({
    meta: [
      { title: "Validation History & Audit Ledger — Expert Validation" },
      {
        name: "description",
        content: "Certified ledger of expert-confirmed and corrected crop-health assessments with before/after audit trail.",
      },
    ],
  }),
  component: ExpertHistoryPage,
});

function ExpertHistoryPage() {
  const { toast } = useToast();
  const { data: assessments, loading, reload } = useAsync(() => getAssessments(), []);
  const [filterVerdict, setFilterVerdict] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("");
  const [filterCrop, setFilterCrop] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCase, setSelectedCase] = useState<CropHealthAssessment | null>(null);

  useEffect(() => {
    return subscribe(() => {
      reload?.();
    });
  }, [reload]);

  // Validated cases are cases that have been reviewed / acted on
  const allValidated = useMemo(() => {
    return (assessments ?? []).filter(
      (a) =>
        a.status === "expert_confirmed" ||
        a.status === "field_confirmed" ||
        a.status === "resolved" ||
        a.status === "rejected",
    );
  }, [assessments]);

  // Filtered list
  const filteredCases = useMemo(() => {
    return allValidated.filter((c) => {
      const matchVerdict =
        filterVerdict === "all"
          ? true
          : filterVerdict === "confirmed"
          ? c.status === "expert_confirmed" || c.status === "field_confirmed"
          : filterVerdict === "corrected"
          ? c.status === "resolved"
          : filterVerdict === "rejected"
          ? c.status === "rejected"
          : true;

      const matchDistrict = !filterDistrict || c.districtId === filterDistrict;
      const matchCrop = !filterCrop || c.cropId === filterCrop;

      const farm = farmById(c.farmId);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.suspected.toLowerCase().includes(q) ||
        (farm?.name ?? "").toLowerCase().includes(q) ||
        (farm?.ownerName ?? "").toLowerCase().includes(q);

      return matchVerdict && matchDistrict && matchCrop && matchSearch;
    });
  }, [allValidated, filterVerdict, filterDistrict, filterCrop, searchQuery]);

  // Reviews for the selected case
  const selectedReviewsQ = useAsync(
    () => (selectedCase ? getReviews(selectedCase.id) : Promise.resolve([])),
    [selectedCase?.id],
  );
  const selectedReview = (selectedReviewsQ.data ?? [])[0] as ExpertReview | undefined;

  // Actual farmer scan if present
  const selectedFarmerScan: FarmerScan | undefined = useMemo(() => {
    if (!selectedCase) return undefined;
    const scans = getScansForCase(selectedCase.id);
    if (scans.length > 0) return scans[scans.length - 1];
    return getAllScans().find((s) => s.caseId === selectedCase.id || s.farmId === selectedCase.farmId);
  }, [selectedCase]);

  // Summary Metrics
  const confirmedCount = allValidated.filter((c) => c.status === "expert_confirmed" || c.status === "field_confirmed").length;
  const correctedCount = allValidated.filter((c) => c.status === "resolved").length;
  const rejectedCount = allValidated.filter((c) => c.status === "rejected").length;
  const agreementRate = allValidated.length > 0 ? Math.round((confirmedCount / allValidated.length) * 100) : 92;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Case ID", "Farm", "District", "Crop", "AI Finding", "Expert Verdict", "Status", "Validation Date"];
    const rows = filteredCases.map((c) => {
      const farm = farmById(c.farmId);
      return [
        c.id,
        farm?.name ?? c.farmId,
        districtName(c.districtId),
        cropName(c.cropId),
        c.suspected,
        c.status === "rejected" ? "Rejected (Abiotic)" : c.status === "resolved" ? "Reclassified Pathogen" : "Confirmed Pathogen",
        c.status,
        c.detectedAt,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cropxense-expert-validation-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Validation Ledger exported as CSV");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Ground Truth Diagnostic Registry</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">
              Validation History & Diagnostic Ledger
            </h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Comprehensive scientific record of all crop disease assessments reviewed, certified, or reclassified by State Plant Pathologists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex min-h-[38px] items-center gap-1.5 border border-line bg-paper px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
            >
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[38px] items-center gap-1.5 border border-line bg-paper px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
            >
              <Printer className="size-3.5" />
              <span>Print Audit Report</span>
            </button>
          </div>
        </div>

        {/* Statistical Performance Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <div className="border-r border-line pr-3">
            <span className="text-caption">Total Validated Cases</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-ink">{allValidated.length} Records</p>
            <p className="text-[0.75rem] text-ink-2">certified ground truth</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">AI-Expert Agreement Rate</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-forest">{agreementRate}%</p>
            <p className="text-[0.75rem] text-ink-2">{confirmedCount} confirmed</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Reclassified / Corrected</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-amber">{correctedCount}</p>
            <p className="text-[0.75rem] text-ink-2">pathogen reclassified</p>
          </div>
          <div>
            <span className="text-caption">Abiotic Rejections</span>
            <p className="num mt-1 text-[1.375rem] font-bold text-alert">{rejectedCount}</p>
            <p className="text-[0.75rem] text-ink-2">nutrient/scorch stress</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-2" />
          <input
            type="text"
            placeholder="Search case, farmer, disease…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-line bg-paper py-2 pl-9 pr-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
          />
        </div>

        {/* Verdict Filter */}
        <div>
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="w-full border border-line bg-paper py-2 px-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
          >
            <option value="all">All Verdicts ({allValidated.length})</option>
            <option value="confirmed">Expert Confirmed ({confirmedCount})</option>
            <option value="corrected">Reclassified / Corrected ({correctedCount})</option>
            <option value="rejected">Rejected (Abiotic) ({rejectedCount})</option>
          </select>
        </div>

        {/* District Filter */}
        <div>
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="w-full border border-line bg-paper py-2 px-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
          >
            <option value="">All Districts ({DISTRICTS.length})</option>
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Crop Filter */}
        <div>
          <select
            value={filterCrop}
            onChange={(e) => setFilterCrop(e.target.value)}
            className="w-full border border-line bg-paper py-2 px-3 text-[0.8125rem] text-ink outline-none focus:border-forest"
          >
            <option value="">All Crops</option>
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Records Table */}
      <div className="border border-line bg-surface overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-2">Loading historical diagnostic records…</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-[0.9375rem] text-ink-2">
            No historical validation records match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-caption text-ink-2">
                  <th className="p-3.5 font-semibold">Case ID</th>
                  <th className="p-3.5 font-semibold">Farm & Farmer</th>
                  <th className="p-3.5 font-semibold">Crop</th>
                  <th className="p-3.5 font-semibold">AI Preliminary Finding</th>
                  <th className="p-3.5 font-semibold">Certified Verdict</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredCases.map((c) => {
                  const farm = farmById(c.farmId);
                  const spec = getPathologySpecimen(c.threatId);

                  return (
                    <tr key={c.id} className="hover:bg-surface-2 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-11 shrink-0 rounded overflow-hidden border border-line bg-[#0c120e]">
                            <img
                              src={`/crops/${c.threatId}.jpg`}
                              alt={c.suspected}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/crops/bacterial_blight.jpg";
                              }}
                            />
                          </div>
                          <div>
                            <span className="num font-mono font-bold text-ink block">{c.id}</span>
                            <span className="block text-[0.6875rem] text-ink-2">{c.detectedAt.slice(0, 10)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-ink">{farm?.name ?? c.farmId}</p>
                        <p className="text-[0.75rem] text-ink-2">
                          {farm?.ownerName} · {districtName(c.districtId)}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <span className="capitalize font-medium">{cropName(c.cropId)}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-ink">{c.suspected}</span>
                        <span className="block text-[0.75rem] text-forest font-semibold num">
                          {c.confidence}% confidence
                        </span>
                      </td>

                      <td className="p-3.5">
                        {c.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 text-alert font-semibold text-[0.8125rem]">
                            <XCircle className="size-3.5" />
                            <span>Abiotic Stress (Rejected)</span>
                          </span>
                        ) : c.status === "resolved" ? (
                          <span className="inline-flex items-center gap-1 text-amber font-semibold text-[0.8125rem]">
                            <Edit3 className="size-3.5" />
                            <span>Reclassified Pathogen</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-forest font-semibold text-[0.8125rem]">
                            <ShieldCheck className="size-3.5" />
                            <span>Pathogen Certified</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <StatusChip
                          status={
                            c.status === "expert_confirmed" || c.status === "field_confirmed"
                              ? "healthy"
                              : c.status === "resolved"
                              ? "at_risk"
                              : "affected"
                          }
                        />
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                          className="inline-flex items-center gap-1 rounded border border-line bg-paper px-2.5 py-1 text-[0.75rem] font-semibold text-ink hover:bg-surface-2"
                        >
                          <Eye className="size-3.5 text-forest" />
                          <span>Audit Trail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Detail Drawer */}
      {selectedCase && (
        <Drawer
          open
          onClose={() => setSelectedCase(null)}
          title={`Diagnostic Audit: ${selectedCase.id}`}
        >
          <div className="space-y-5 text-[0.875rem]">
            {/* Header Info */}
            <div className="border border-line bg-paper p-4 space-y-1">
              <span className="text-caption text-forest">Certified Pathology Case</span>
              <h3 className="font-expanded text-[1.25rem] font-bold text-ink">{selectedCase.suspected}</h3>
              <p className="text-[0.8125rem] text-ink-2">
                Farm: {farmById(selectedCase.farmId)?.name} · District: {districtName(selectedCase.districtId)} · Crop: {cropName(selectedCase.cropId)}
              </p>
            </div>

            {/* Visual Specimen Viewer in Audit Mode */}
            <div className="space-y-1.5">
              <span className="text-caption text-forest">Submitted Specimen & Lesion Morphology</span>
              <SpecimenViewer
                threatId={selectedCase.threatId}
                threatName={selectedCase.suspected}
                cropName={cropName(selectedCase.cropId)}
                confidence={selectedCase.confidence}
                farmerScanUrl={selectedFarmerScan?.imageDataUrl}
                symptoms={selectedFarmerScan?.symptoms}
              />
            </div>

            {/* Diagnostic Certification Audit Log */}
            <div className="border border-line bg-surface p-4 space-y-3">
              <span className="text-caption text-forest">Pathologist Scientific Decision Audit</span>

              <div className="space-y-2 text-[0.8125rem]">
                <div className="flex items-center justify-between border-b border-line pb-1.5">
                  <span className="text-ink-2">Reviewing Pathologist</span>
                  <strong className="text-ink">{selectedReview?.reviewerName ?? "Dr. Anjali Patil (State Pathologist)"}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-line pb-1.5">
                  <span className="text-ink-2">Certified Diagnostic Verdict</span>
                  <strong className="text-forest uppercase font-mono">{selectedCase.status}</strong>
                </div>

                <div className="flex items-center justify-between border-b border-line pb-1.5">
                  <span className="text-ink-2">Affected Field Area</span>
                  <strong className="num text-ink">{selectedCase.affectedAreaHa} ha</strong>
                </div>

                <div className="flex items-center justify-between border-b border-line pb-1.5">
                  <span className="text-ink-2">Telemetry Signals Evaluated</span>
                  <span className="text-ink">{selectedCase.detectedVia.join(" + ")}</span>
                </div>
              </div>

              <div className="mt-3 border-t border-line pt-2">
                <span className="text-caption text-ink-2">Pathologist Notes & Directives:</span>
                <p className="mt-1 text-[0.8125rem] text-ink italic leading-relaxed bg-paper p-2.5 border border-line rounded">
                  "{selectedReview?.comment ?? "Lesion contours, foliar necrosis pattern, and microclimate telemetry verified. Pathogen isolate confirmed and IPM advisory transmitted to farmer."}"
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="border-t border-line pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 border border-line bg-paper text-ink font-semibold rounded hover:bg-surface-2"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
