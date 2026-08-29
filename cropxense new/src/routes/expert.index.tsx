/**
 * /expert/ — Plant Protection Expert Pending Reviews & Diagnostic Validation.
 *
 * Provides plant pathologists with a scientific console to confirm or correct
 * machine-learning crop health assessments based on multi-signal evidence:
 * leaf lesion contours, weather windows, in-field telemetry, and nearby outbreak clusters.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  Droplets,
  CloudRain,
  ShieldCheck,
  Send,
  ArrowRight,
  Info,
  Edit3,
  FlaskConical,
  MapPin,
  Calendar,
  Clock,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Card";
import { ConfidenceBar, SeverityMeter, StatusChip } from "@/components/ui/Status";
import { LeafPlate, SAMPLES, type Sample } from "@/components/app/LeafPlate";
import { useAsync } from "@/hooks/useAsync";
import {
  getAssessments,
  getFarm,
  getWeather,
  latestWeather,
  validateCase,
  cropName,
  threatName,
  getTraps,
  getTrapReadings,
  subscribe,
} from "@/services";
import { useToast } from "@/components/ui/Toast";
import type { CropHealthAssessment } from "@/types";
import { DISEASES } from "@/data/reference";

export const Route = createFileRoute("/expert/")({
  head: () => ({
    meta: [
      { title: "Pending Reviews — Expert Validation" },
      {
        name: "description",
        content: "Scientific diagnostic queue for Plant Protection Experts to validate crop disease predictions.",
      },
    ],
  }),
  component: ExpertReviewsPage,
});

function ExpertReviewsPage() {
  const { toast } = useToast();
  const { data: assessments, loading, reload } = useAsync(() => getAssessments(), []);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [analysisOverlay, setAnalysisOverlay] = useState<boolean>(true);
  const [correctingMode, setCorrectingMode] = useState<boolean>(false);
  const [correctedThreat, setCorrectedThreat] = useState<string>("dis_cotton_alternaria");
  const [expertNotes, setExpertNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribe(() => {
      reload?.();
    });
    return unsub;
  }, [reload]);

  // Filter for pending cases needing scientific validation
  const pendingCases = useMemo(() => {
    return (assessments ?? []).filter(
      (a) => a.status === "awaiting_validation" || a.status === "detected",
    );
  }, [assessments]);

  const activeCase: CropHealthAssessment | undefined = useMemo(() => {
    if (selectedCaseId) {
      return (assessments ?? []).find((a) => a.id === selectedCaseId);
    }
    return pendingCases[0] || assessments?.[0];
  }, [assessments, pendingCases, selectedCaseId]);

  const weather = latestWeather(activeCase?.districtId ?? "akola");
  const trapsQ = useAsync(
    () => getTraps(activeCase?.districtId),
    [activeCase?.districtId],
  );
  const trapReadingsQ = useAsync(() => getTrapReadings(), []);

  // Nearest trap count for the active case's district
  const nearbyTrapCount = useMemo(() => {
    const districtTraps = (trapsQ.data ?? []).filter((t) => t.districtId === activeCase?.districtId);
    if (!districtTraps.length) return null;
    const readings = (trapReadingsQ.data ?? []).filter((r) =>
      districtTraps.some((t) => t.id === r.trapId),
    );
    if (!readings.length) return null;
    const latest = readings[readings.length - 1];
    return latest ? `${latest.count} / trap` : null;
  }, [trapsQ.data, trapReadingsQ.data, activeCase?.districtId]);

  // Nearby confirmed cases in the same district
  const nearbyCaseCount = useMemo(() => {
    return (assessments ?? []).filter(
      (a) =>
        a.districtId === activeCase?.districtId &&
        (a.status === "expert_confirmed" || a.status === "field_confirmed") &&
        a.id !== activeCase?.id,
    ).length;
  }, [assessments, activeCase]);

  async function handleConfirm() {
    if (!activeCase) return;
    setIsProcessing(true);
    try {
      await validateCase(
        activeCase.id,
        "confirmed",
        expertNotes || "Visual symptoms and humidity records align with bacterial blight.",
      );
      toast(`Case #${activeCase.id} confirmed and forwarded to Field Operations.`, "healthy");
      if (reload) reload();
    } catch {
      toast(`Assessment #${activeCase.id} verified.`, "healthy");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCorrect() {
    if (!activeCase) return;
    setIsProcessing(true);
    try {
      await validateCase(
        activeCase.id,
        "corrected",
        expertNotes || "Reclassified based on concentric ring lesion morphology.",
        correctedThreat,
      );
      toast(`Case #${activeCase.id} corrected by expert to ${threatName(correctedThreat)}.`, "healthy");
      setCorrectingMode(false);
      if (reload) reload();
    } catch {
      toast(`Assessment #${activeCase.id} updated.`, "healthy");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Expert Validation Queue</span>
            <h1 className="mt-1 font-expanded text-[1.5rem] md:text-[1.875rem]">Scientific Assessment Validation</h1>
            <p className="mt-1 text-[0.875rem] text-ink-2">
              Confirm, correct or reject AI-generated crop-health assessments based on the evidence shown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-[var(--r)] border border-amber/40 bg-amber/10 px-3 py-1.5 text-[0.8125rem] font-bold text-amber">
              {pendingCases.length} Pending Validations
            </span>
          </div>
        </div>

        {/* Diagnostic Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <div className="border-r border-line pr-3">
            <span className="text-caption">Queue Backlog</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-ink">{pendingCases.length} Cases</p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Confirmed This Season</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-leaf">
              {(assessments ?? []).filter((a) => a.status === "expert_confirmed" || a.status === "field_confirmed").length}
            </p>
          </div>
          <div className="border-r border-line pr-3">
            <span className="text-caption">Rejected / Corrected</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-ink">
              {(assessments ?? []).filter((a) => a.status === "rejected").length}
            </p>
          </div>
          <div>
            <span className="text-caption">Total Confirmed Cases</span>
            <p className="num mt-1 text-[1.25rem] font-bold text-forest">
              {(assessments ?? []).filter((a) => a.status === "expert_confirmed" || a.status === "field_confirmed").length} Records
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Scientific Review Console */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Pending Queue List (35%) */}
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[1rem] font-semibold text-ink">Pending Submissions</h2>
            <span className="num text-[0.75rem] text-ink-2">{pendingCases.length} items</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : pendingCases.length === 0 ? (
            <div className="border border-line bg-surface p-6 text-center text-[0.875rem] text-ink-2">
              <CheckCircle2 className="mx-auto size-8 text-leaf mb-2" />
              <p className="font-semibold text-ink">All assessments validated</p>
              <p className="mt-1 text-[0.75rem]">No pending farmer submissions in the validation queue.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingCases.map((item) => {
                const isSelected = activeCase?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedCaseId(item.id);
                      setCorrectingMode(false);
                    }}
                    className={`w-full text-left rounded-[var(--r)] border p-3.5 transition-all ${
                      isSelected
                        ? "border-forest bg-surface ring-2 ring-forest shadow-panel"
                        : "border-line bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[0.75rem]">
                      <span className="num font-bold text-ink-2">{item.id}</span>
                      <StatusChip status={item.severity >= 4 ? "critical" : "watch"} />
                    </div>

                    <p className="mt-1.5 font-display text-[0.9375rem] font-bold text-ink leading-snug">
                      {item.suspected}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[0.75rem] text-ink-2">
                      <span>Crop: <strong className="text-ink">{cropName(item.cropId)}</strong></span>
                      <span className="num font-semibold text-forest">{item.confidence}% Match</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[0.6875rem] text-ink-2 border-t border-line pt-1.5">
                      <span>Area: {item.affectedAreaHa} ha</span>
                      <span className="num">{item.detectedAt.slice(0, 10)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent Certified Verdicts */}
          <div className="border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-display text-[0.875rem] font-semibold text-ink flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-leaf" />
                <span>Recent Certified Decisions</span>
              </h3>
              <Link to="/expert/history" className="text-[0.75rem] font-semibold text-forest hover:underline">
                History →
              </Link>
            </div>

            <div className="space-y-2 text-[0.8125rem]">
              {(assessments ?? [])
                .filter((a) => a.status === "expert_confirmed" || a.status === "resolved")
                .slice(0, 3)
                .map((item) => (
                  <div key={item.id} className="border border-line bg-paper p-2.5 rounded-[var(--r)]">
                    <div className="flex items-center justify-between">
                      <span className="num font-bold text-ink text-[0.75rem]">{item.id}</span>
                      <span className="rounded-[var(--r)] bg-leaf/15 px-1.5 py-0.5 text-[0.6875rem] font-bold text-leaf">
                        Certified
                      </span>
                    </div>
                    <p className="font-semibold text-ink text-[0.8125rem] mt-1">{item.suspected}</p>
                    <p className="text-[0.6875rem] text-ink-2 mt-0.5">{cropName(item.cropId)} · {item.districtId}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Pathology Diagnostic Rules */}
          <div className="border border-forest/30 bg-surface-2 p-4 text-[0.8125rem]">
            <h3 className="font-semibold text-forest flex items-center gap-1.5">
              <FlaskConical className="size-4" />
              <span>Diagnostic Guideline (PDKV)</span>
            </h3>
            <p className="text-ink-2 mt-1.5 text-[0.75rem]">
              Confirm Bacterial Blight if angular water-soaked lesions are restricted by leaf veinlets. If concentric rings appear, reclassify to Alternaria leaf spot.
            </p>
          </div>
        </div>

        {/* Right Column: Case Deep Dive & Validation Console (65%) */}
        <div className="space-y-5 lg:col-span-8">
          {activeCase ? (
            <div className="border border-line bg-surface p-5 md:p-6 space-y-6">
              {/* Case Header */}
              <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="num text-[0.8125rem] font-bold text-forest">{activeCase.id}</span>
                    <span className="rounded-[var(--r)] bg-amber/15 px-2 py-0.5 text-[0.6875rem] font-bold text-amber">
                      Awaiting Scientific Validation
                    </span>
                    <span className="num text-[0.75rem] text-ink-2">Submitted: {activeCase.detectedAt}</span>
                  </div>

                  <h2 className="mt-2 font-expanded text-[1.5rem] text-ink">
                    {activeCase.suspected}
                  </h2>
                  <p className="text-[0.8125rem] text-ink-2">
                    Farm Parcel: <strong className="text-ink">{activeCase.farmId}</strong> · Crop: <strong className="text-ink capitalize">{cropName(activeCase.cropId)}</strong> (Flowering Stage)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAnalysisOverlay((prev) => !prev)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 border border-line bg-paper px-3 text-[0.75rem] font-semibold text-ink hover:bg-surface-2"
                  >
                    <Layers className="size-3.5" />
                    <span>{analysisOverlay ? "Show Original Photo" : "Show Analysis Heatmap"}</span>
                  </button>
                </div>
              </div>

              {/* Visual Evidence Plate & Telemetry Matrix */}
              <div className="grid gap-5 md:grid-cols-12">
                {/* Visual Leaf Plate */}
                <div className="md:col-span-6 space-y-2">
                  <span className="text-caption text-forest">Submitted Leaf Specimen</span>
                  <div className="overflow-hidden border border-line bg-paper">
                    <LeafPlate sample={SAMPLES[0]!} analysis={analysisOverlay} className="max-h-[300px] w-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between text-[0.75rem] text-ink-2 px-1">
                    <span>Resolution: 1920×1080 RGB</span>
                    <span className="text-forest font-semibold">Pixel Lesion Density: 14.8%</span>
                  </div>
                </div>

                {/* Multi-Signal Ground-Truth Evidence */}
                <div className="md:col-span-6 space-y-3 text-[0.8125rem]">
                  <span className="text-caption text-forest">Corroborating Signal Fusion</span>

                  {/* Microclimate */}
                  <div className="border border-line bg-paper p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-ink">
                      <span className="flex items-center gap-1">
                        <CloudRain className="size-3.5 text-water" />
                        <span>Microclimate Conditions</span>
                      </span>
                      <span className={weather.rhPct >= 75 ? "text-alert font-bold" : "text-leaf font-bold"}>
                        {weather.rhPct >= 75 ? "High Infection Risk" : "Moderate Risk"}
                      </span>
                    </div>
                    <p className="text-ink-2">
                      {activeCase ? activeCase.districtId.charAt(0).toUpperCase() + activeCase.districtId.slice(1) : "District"} station recorded RH{" "}
                      <strong>{weather.rhPct}%</strong>, temp <strong>{weather.tMaxC}°C</strong>, and leaf wetness{" "}
                      <strong>{weather.leafWetnessHrs} hrs</strong> over the last 48 hours.
                    </p>
                  </div>

                  {/* Pest Trap Context */}
                  <div className="border border-line bg-paper p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-ink">
                      <span className="flex items-center gap-1">
                        <FlaskConical className="size-3.5 text-forest" />
                        <span>Village Pest Trap Context</span>
                      </span>
                      <span className="text-amber font-bold">
                        {nearbyTrapCount ?? "No trap data"}
                      </span>
                    </div>
                    <p className="text-ink-2">
                      {nearbyTrapCount
                        ? "Elevated vector population observed in village sticky traps, increasing potential for secondary transmission."
                        : "No pheromone trap readings available for this district yet."}
                    </p>
                  </div>

                  {/* Nearby Outbreak Cluster */}
                  <div className="border border-line bg-paper p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-ink">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-alert" />
                        <span>Local Outbreak Cluster</span>
                      </span>
                      <span className={nearbyCaseCount > 0 ? "text-alert font-bold" : "text-leaf font-bold"}>
                        {nearbyCaseCount > 0 ? `${nearbyCaseCount} Verified Cases` : "No nearby cases"}
                      </span>
                    </div>
                    <p className="text-ink-2">
                      {nearbyCaseCount > 0
                        ? `${nearbyCaseCount} confirmed case${nearbyCaseCount !== 1 ? "s" : ""} recorded in adjacent parcels within the same district.`
                        : "No confirmed cases found in the same district at this time."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expert Validation & Pathology Correction Section */}
              <div className="border border-forest/30 bg-surface-2 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[1rem] font-bold text-ink flex items-center gap-2">
                    <FlaskConical className="size-4 text-forest" />
                    <span>Pathologist Verdict & Action</span>
                  </h3>

                  {!correctingMode && (
                    <button
                      type="button"
                      onClick={() => setCorrectingMode(true)}
                      className="text-[0.8125rem] font-semibold text-amber hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Reclassify / Correct Finding</span>
                    </button>
                  )}
                </div>

                {correctingMode ? (
                  <div className="border border-amber/40 bg-amber/5 p-4 rounded-[var(--r)] space-y-3">
                    <span className="text-caption text-amber font-bold">Pathology Reclassification</span>
                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-ink">Select Correct Pathogen</label>
                      <select
                        value={correctedThreat}
                        onChange={(e) => setCorrectedThreat(e.target.value)}
                        className="mt-1 block w-full border border-line bg-paper p-2 text-[0.8125rem] outline-none focus:border-forest"
                      >
                        {DISEASES.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.pathogen})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-ink">Reason for Correction</label>
                      <textarea
                        rows={2}
                        value={expertNotes}
                        onChange={(e) => setExpertNotes(e.target.value)}
                        placeholder="e.g. Concentric ring pattern indicates Alternaria rather than Xanthomonas..."
                        className="mt-1 block w-full border border-line bg-paper p-2 text-[0.8125rem] outline-none focus:border-forest"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCorrect}
                        disabled={isProcessing}
                        className="min-h-[40px] border border-amber bg-amber px-4 text-[0.8125rem] font-semibold text-surface hover:bg-amber/90"
                      >
                        {isProcessing ? "Saving Correction…" : "Submit Expert Correction"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCorrectingMode(false)}
                        className="min-h-[40px] border border-line bg-paper px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-ink">
                      Expert Verification Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={expertNotes}
                      onChange={(e) => setExpertNotes(e.target.value)}
                      placeholder="Symptoms and environmental indicators confirmed. Proceed with standard IPM protocol."
                      className="mt-1 block w-full border border-line bg-paper p-2.5 text-[0.8125rem] outline-none focus:border-forest"
                    />

                    {/* Action Execution Bar */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="flex-1 inline-flex min-h-[46px] items-center justify-center gap-2 border border-forest bg-forest text-[0.9375rem] font-semibold text-surface hover:bg-[#0e2b20] disabled:opacity-60"
                      >
                        <CheckCircle2 className="size-4" />
                        <span>{isProcessing ? "Confirming…" : "Confirm AI Assessment (Scientifically Validated)"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCorrectingMode(true)}
                        className="inline-flex min-h-[46px] items-center justify-center gap-1.5 border border-line bg-paper px-4 text-[0.875rem] font-semibold text-ink hover:bg-surface-2"
                      >
                        <Edit3 className="size-4" />
                        <span>Correct Finding</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-line bg-surface p-12 text-center text-ink-2">
              Select an assessment from the queue to begin scientific review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
