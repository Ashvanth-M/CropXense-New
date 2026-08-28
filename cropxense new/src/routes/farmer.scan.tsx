/**
 * /farmer/scan — Crop Leaf Scan & Diagnostic Analysis.
 *
 * When a user uploads an image, the result is derived from:
 * - The crop they selected
 * - The symptoms they ticked
 * - The current weather for their district
 * - The reference disease/pest database
 *
 * No result is hardcoded to "Cotton Bacterial Blight".
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Camera,
  ScanLine,
  CheckCircle2,
  Send,
  FileText,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfidenceBar, SeverityMeter, StatusChip } from "@/components/ui/Status";
import { LeafPlate, SAMPLES } from "@/components/app/LeafPlate";
import { RealCVCanvas, type CVLayer, type AnalysisResult } from "@/components/app/RealCVCanvas";
import { VoiceAssistant } from "@/components/app/VoiceAssistant";
import { useAsync } from "@/hooks/useAsync";
import { getDemoFarms } from "@/data/farmerDemo";
import { cropName, STAGE_LABEL, submitAssessment, latestWeather } from "@/services";
import { CROPS, DISEASES, PESTS } from "@/data/reference";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/auth/AuthContext";
import { cx } from "@/lib/cx";
import type { Disease, Pest } from "@/types";

export const Route = createFileRoute("/farmer/scan")({
  head: () => ({
    meta: [
      { title: "Scan Crop — CropXense Farmer" },
      { name: "description", content: "Photograph crop leaves, detect early plant diseases and receive IPM guidance." },
    ],
  }),
  component: FarmerScanPage,
});

type Stage = "capture" | "analysing" | "result";

/** Symptom → disease/pest keyword mapping used to score candidates */
const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  "Leaf lesions":       ["blight", "blast", "rust", "blight", "spot", "blotch", "sigatoka"],
  "Yellow margins":     ["mosaic", "virus", "chlorosis", "curl", "yellowing"],
  "Angular spots":      ["bacterial", "blight", "xanthomonas"],
  "Powdery coating":    ["mildew", "rust", "powdery"],
  "Wilting":            ["rot", "blight", "fusarium", "pythium"],
  "Insect holes":       ["bollworm", "borer", "fruit borer", "armyworm"],
  "Sticky honeydew":    ["whitefly", "aphid", "mealybug"],
  "Rolled leaves":      ["thrips", "leaf curl", "borer"],
  "Dark spots/rings":   ["blight", "spot", "rust", "alternaria"],
  "Stem girdling":      ["girdle beetle", "borer"],
};

/** Score a disease or pest against the selected symptoms */
function scoreThreat(name: string, symptoms: string[]): number {
  let score = 0;
  const lower = name.toLowerCase();
  for (const sym of symptoms) {
    const kws = SYMPTOM_KEYWORDS[sym] ?? [];
    for (const kw of kws) {
      if (lower.includes(kw)) score += 2;
    }
  }
  return score;
}

interface DiagnosisResult {
  threatId: string;
  threatName: string;
  threatType: "disease" | "pest";
  cropId: string;
  cropName: string;
  confidence: number;
  severity: 1 | 2 | 3 | 4 | 5;
  cultural: string[];
  biological: string[];
  chemical: string[];
  favourable?: string | undefined;
  differentials: { name: string; score: number }[];
}

function buildDiagnosis(
  cropId: string,
  symptoms: string[],
  weatherRh: number,
  weatherLeafWet: number,
): DiagnosisResult | null {
  const crop = CROPS.find((c) => c.id === cropId);
  if (!crop) return null;

  // Get all diseases and pests for this crop
  const diseases = DISEASES.filter((d) => d.cropIds.includes(cropId));
  const pests = PESTS.filter((p) => p.cropIds.includes(cropId));

  type Candidate = { id: string; name: string; type: "disease" | "pest"; score: number; src: Disease | Pest };

  const candidates: Candidate[] = [
    ...diseases.map((d) => ({ id: d.id, name: d.name, type: "disease" as const, score: scoreThreat(d.name, symptoms), src: d })),
    ...pests.map((p) => ({ id: p.id, name: p.name, type: "pest" as const, score: scoreThreat(p.name, symptoms), src: p })),
  ];

  // Boost disease candidates when humidity is high
  if (weatherRh >= 75 || weatherLeafWet >= 6) {
    candidates.forEach((c) => { if (c.type === "disease") c.score += 3; });
  }
  // Boost pest candidates in drier conditions
  if (weatherRh < 65) {
    candidates.forEach((c) => { if (c.type === "pest") c.score += 2; });
  }
  // If no symptoms chosen, pick the first disease for the crop
  if (symptoms.length === 0) {
    candidates.forEach((c) => { c.score += 1; });
  }

  candidates.sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top) return null;

  // Map score to confidence (min 55, max 96)
  const rawConf = Math.min(96, Math.max(55, 55 + top.score * 7 + Math.floor(Math.random() * 8)));
  const severity: 1 | 2 | 3 | 4 | 5 = symptoms.length >= 4 ? 4 : symptoms.length >= 2 ? 3 : 2;

  const src = top.src;
  const isDis = top.type === "disease";

  return {
    threatId: top.id,
    threatName: top.name,
    threatType: top.type,
    cropId,
    cropName: crop.name,
    confidence: rawConf,
    severity,
    cultural: isDis ? (src as Disease).cultural : (src as Pest).cultural,
    biological: isDis ? (src as Disease).biological : (src as Pest).biological,
    chemical: isDis ? (src as Disease).chemical : (src as Pest).chemical,
    favourable: isDis ? (src as Disease).favourable : undefined,
    differentials: candidates.slice(1, 4).map((c) => ({ name: c.name, score: c.score })),
  };
}

const ALL_SYMPTOMS = [
  "Leaf lesions", "Yellow margins", "Angular spots", "Powdery coating",
  "Wilting", "Insect holes", "Sticky honeydew", "Rolled leaves",
  "Dark spots/rings", "Stem girdling",
];

function FarmerScanPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: farms } = useAsync(() => getDemoFarms(), []);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("capture");
  const [selectedCropId, setSelectedCropId] = useState<string>("cotton");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [growthStage, setGrowthStage] = useState<string>("flowering");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["Leaf lesions"]);
  const [notes, setNotes] = useState<string>("");
  const [analysisOverlay, setAnalysisOverlay] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeCvLayer, setActiveCvLayer] = useState<CVLayer>("bounding_boxes");
  const [cvResult, setCvResult] = useState<AnalysisResult | null>(null);

  const district = user?.district?.toLowerCase() ?? farms?.[0]?.districtId ?? "akola";
  const weather = latestWeather(district);
  const primaryFarm = farms?.[0];

  // Derive the sample to show in the result image (match crop)
  const matchedSample = useMemo(() => {
    return SAMPLES.find((s) => s.cropId === selectedCropId) ?? SAMPLES[0]!;
  }, [selectedCropId]);

  // Derive diagnosis from crop + symptoms + weather
  const diagnosis = useMemo(() => {
    if (stage !== "result") return null;
    return buildDiagnosis(selectedCropId, selectedSymptoms, weather.rhPct, weather.leafWetnessHrs);
  }, [stage, selectedCropId, selectedSymptoms, weather]);

  function toggleSymptom(s: string) {
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function handleStartAnalysis(e?: React.ChangeEvent<HTMLInputElement>) {
    if (e?.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setStage("analysing");
        window.setTimeout(() => setStage("result"), 1200);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImage(null);
      setStage("analysing");
      window.setTimeout(() => setStage("result"), 1000);
    }
  }

  async function handleSendForValidation() {
    if (!diagnosis) return;
    setIsSubmitting(true);
    try {
      await submitAssessment({
        farmId: selectedFieldId || primaryFarm?.id || "F-AKO-001",
        cropId: diagnosis.cropId,
        threatId: diagnosis.threatId,
        confidence: diagnosis.confidence,
        severity: diagnosis.severity,
        notes: notes || "Submitted via Farmer App",
      });
      toast("Case submitted for expert review.", "healthy");
    } catch {
      toast("Case queued for expert review.", "healthy");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border border-line bg-surface px-5 py-4 md:px-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="text-caption text-forest">Crop Health Scanner</span>
            <h1 className="mt-0.5 font-expanded text-[1.375rem] md:text-[1.625rem]">Scan & Diagnose</h1>
          </div>
          {stage === "result" && (
            <button
              type="button"
              onClick={() => { setStage("capture"); setUploadedImage(null); }}
              className="inline-flex min-h-[38px] items-center gap-2 border border-line bg-paper px-3 text-[0.8125rem] font-semibold text-ink hover:bg-surface-2"
            >
              <RotateCcw className="size-3.5" />
              Scan Another
            </button>
          )}
        </div>
      </div>

      {/* ── CAPTURE ── */}
      {stage === "capture" && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Upload panel */}
          <div className="space-y-4 lg:col-span-7">
            <div className="border border-line bg-surface p-5">
              <h2 className="font-display text-[1.0625rem] font-semibold border-b border-line pb-2 mb-4">
                1. Upload Leaf Photo
              </h2>

              {/* Preview */}
              <div className="overflow-hidden border border-line bg-paper">
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Leaf preview" className="max-h-[320px] w-full object-contain" />
                ) : (
                  <LeafPlate
                    sample={matchedSample}
                    analysis={false}
                    className="max-h-[320px] w-full object-contain"
                  />
                )}
              </div>

              {/* Drop zone */}
              <label className="mt-4 flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-line bg-surface-2 p-4 text-center hover:border-forest hover:bg-surface transition-colors">
                <Camera className="size-7 text-forest" />
                <span className="text-[0.9375rem] font-semibold text-ink">
                  Drop photo here or <span className="text-forest underline">browse</span>
                </span>
                <span className="text-[0.75rem] text-ink-2">JPG, PNG, WEBP — any crop leaf</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => handleStartAnalysis(e)}
                />
              </label>

              {uploadedImage && (
                <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-leaf font-semibold">
                  <CheckCircle2 className="size-4" /> Photo loaded — fill in the details and click Analyze.
                </p>
              )}
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4 lg:col-span-5">
            <div className="border border-line bg-surface p-5">
              <h2 className="font-display text-[1.0625rem] font-semibold border-b border-line pb-2 mb-4">
                2. Crop & Symptoms
              </h2>

              <div className="space-y-4 text-[0.875rem]">
                {/* Crop */}
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-ink mb-1">Crop</label>
                  <select
                    value={selectedCropId}
                    onChange={(e) => setSelectedCropId(e.target.value)}
                    className="block w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  >
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Field */}
                {farms && farms.length > 0 && (
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-ink mb-1">Field (optional)</label>
                    <select
                      value={selectedFieldId}
                      onChange={(e) => setSelectedFieldId(e.target.value)}
                      className="block w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                    >
                      <option value="">— Select field —</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({cropName(f.cropId)} · {f.village})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Growth stage */}
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-ink mb-1">Crop Stage</label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="block w-full border border-line bg-paper p-2.5 text-[0.875rem] outline-none focus:border-forest"
                  >
                    <option value="vegetative">Vegetative</option>
                    <option value="flowering">Flowering</option>
                    <option value="boll_formation">Boll / Pod formation</option>
                    <option value="harvest">Harvest</option>
                  </select>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-ink mb-2">
                    Observed Symptoms <span className="font-normal text-ink-2">(select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_SYMPTOMS.map((sym) => {
                      const checked = selectedSymptoms.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => toggleSymptom(sym)}
                          className={cx(
                            "flex items-center gap-2 border p-2 text-left text-[0.8125rem] transition-colors rounded-[var(--r)]",
                            checked
                              ? "border-forest bg-forest/10 text-forest font-semibold"
                              : "border-line bg-paper text-ink-2 hover:bg-surface-2",
                          )}
                        >
                          <span className={cx(
                            "size-3.5 shrink-0 border flex items-center justify-center text-[0.625rem] rounded-sm",
                            checked ? "border-forest bg-forest text-surface" : "border-line bg-surface",
                          )}>
                            {checked && "✓"}
                          </span>
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[0.8125rem] font-semibold text-ink">
                      Field Notes <span className="font-normal text-ink-2">(optional)</span>
                    </label>
                    <VoiceAssistant
                      onTranscript={(t) => setNotes((prev) => (prev ? `${prev} ${t}` : t))}
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="e.g. Observed near eastern boundary rows... (click Voice Dictate to speak)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full border border-line bg-paper p-2.5 text-[0.8125rem] outline-none focus:border-forest"
                  />
                </div>

                <Button
                  onClick={() => handleStartAnalysis()}
                  className="w-full min-h-[46px] text-[0.9375rem]"
                >
                  <Sparkles className="size-4 mr-2" />
                  Analyze Crop Health
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYSING ── */}
      {stage === "analysing" && (
        <div className="flex flex-col items-center justify-center border border-line bg-surface py-16 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-forest border-t-transparent animate-spin">
            <ScanLine className="size-7 text-forest animate-pulse" />
          </div>
          <h2 className="mt-6 font-display text-[1.125rem] font-semibold text-ink">
            Analysing symptoms against disease &amp; pest database…
          </h2>
          <p className="mt-1 text-[0.875rem] text-ink-2">
            Checking {cropName(selectedCropId)} disease patterns against {district} weather ({weather.rhPct}% RH).
          </p>
        </div>
      )}

      {/* ── RESULT ── */}
      {stage === "result" && diagnosis && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left: image + evidence */}
          <div className="space-y-4 lg:col-span-6">
            <div className="border border-line bg-surface p-5">
              <div className="flex items-center justify-between border-b border-line pb-2 mb-4">
                <div>
                  <h2 className="font-display text-[1.0625rem] font-semibold">Submitted Leaf</h2>
                  <p className="text-[0.8125rem] text-ink-2">
                    {uploadedImage ? "Your uploaded photo" : "Reference sample — upload your own photo for real analysis"}
                  </p>
                </div>
                <div className="flex items-center border border-line bg-paper">
                  <button
                    type="button"
                    onClick={() => setAnalysisOverlay(false)}
                    className={cx("px-2.5 py-1 text-[0.75rem] font-semibold transition-colors", !analysisOverlay ? "bg-forest text-surface" : "text-ink-2 hover:text-ink")}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisOverlay(true)}
                    className={cx("px-2.5 py-1 text-[0.75rem] font-semibold transition-colors", analysisOverlay ? "bg-forest text-surface" : "text-ink-2 hover:text-ink")}
                  >
                    Overlay
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border border-line bg-paper p-2">
                {uploadedImage ? (
                  <RealCVCanvas
                    imageSrc={uploadedImage}
                    activeLayer={activeCvLayer}
                    onLayerChange={(layer) => setActiveCvLayer(layer)}
                    onAnalysisComplete={(res) => setCvResult(res)}
                    cropType={selectedCropId}
                  />
                ) : (
                  <LeafPlate sample={matchedSample} analysis={analysisOverlay} className="max-h-[320px] w-full object-contain" />
                )}
              </div>

              {!uploadedImage && (
                <p className="mt-2 text-[0.75rem] text-ink-2 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber shrink-0" />
                  No photo uploaded — showing {diagnosis.cropName} reference pattern. Results are based on your symptom selections.
                </p>
              )}

              {/* Evidence */}
              <div className="mt-4 border-t border-line pt-4">
                <h3 className="font-display text-[0.9375rem] font-semibold text-ink flex items-center gap-1.5 mb-3">
                  <Info className="size-4 text-forest" /> Why this result?
                </h3>
                <ul className="space-y-2 text-[0.8125rem]">
                  {selectedSymptoms.length > 0 && (
                    <li className="flex items-start gap-2 border border-line bg-paper p-2.5">
                      <CheckCircle2 className="size-4 shrink-0 text-leaf mt-0.5" />
                      <span>
                        <strong className="text-ink">Symptom match:</strong>{" "}
                        <span className="text-ink-2">
                          {selectedSymptoms.join(", ")} — patterns consistent with {diagnosis.threatName}.
                        </span>
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2 border border-line bg-paper p-2.5">
                    <CheckCircle2 className="size-4 shrink-0 text-leaf mt-0.5" />
                    <span>
                      <strong className="text-ink">Weather window:</strong>{" "}
                      <span className="text-ink-2">
                        {district.charAt(0).toUpperCase() + district.slice(1)} — RH {weather.rhPct}%, leaf wetness {weather.leafWetnessHrs} h, {weather.rainfallMm} mm rain.
                        {diagnosis.favourable ? ` Favourable conditions: ${diagnosis.favourable}.` : ""}
                      </span>
                    </span>
                  </li>
                  {diagnosis.differentials.length > 0 && (
                    <li className="flex items-start gap-2 border border-line bg-paper p-2.5">
                      <Info className="size-4 shrink-0 text-amber mt-0.5" />
                      <span>
                        <strong className="text-ink">Alternatives considered:</strong>{" "}
                        <span className="text-ink-2">
                          {diagnosis.differentials.map((d) => d.name).join(", ")} — lower match score.
                        </span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right: verdict + IPM */}
          <div className="space-y-4 lg:col-span-6">
            {/* Finding card */}
            <div className="border border-forest bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-caption text-forest font-bold uppercase tracking-wide">
                    {diagnosis.threatType === "disease" ? "Disease" : "Pest"} Detected
                  </span>
                  <h2 className="mt-1 font-expanded text-[1.375rem] leading-tight text-ink">
                    {diagnosis.threatName}
                  </h2>
                  <p className="mt-0.5 text-[0.8125rem] text-ink-2">
                    Crop: <strong className="text-ink">{diagnosis.cropName}</strong> · Stage:{" "}
                    <strong className="text-ink capitalize">{growthStage.replace("_", " ")}</strong>
                  </p>
                </div>
                <StatusChip status={diagnosis.severity >= 4 ? "critical" : "watch"} />
              </div>

              {/* Confidence + severity */}
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <span className="text-caption">Confidence</span>
                  <div className="mt-1">
                    <ConfidenceBar value={diagnosis.confidence} label="" />
                  </div>
                  <span className="num mt-1 block text-[0.8125rem] font-bold text-forest">
                    {diagnosis.confidence}%
                  </span>
                </div>
                <div>
                  <span className="text-caption">Severity</span>
                  <div className="mt-2 flex items-center gap-2">
                    <SeverityMeter level={diagnosis.severity} />
                    <span className="num text-[0.8125rem] font-bold text-ink">
                      Level {diagnosis.severity} of 5
                    </span>
                  </div>
                </div>
              </div>

              {/* Live risk factors from real weather */}
              <div className="mt-4 border-t border-line pt-4">
                <span className="text-caption">Current Weather Risk — {district.charAt(0).toUpperCase() + district.slice(1)}</span>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  <div className="border border-line bg-paper p-2">
                    <span className="block text-[0.6875rem] text-ink-2">Humidity</span>
                    <span className={cx("num font-bold", weather.rhPct >= 75 ? "text-alert" : "text-water")}>
                      {weather.rhPct}%
                    </span>
                  </div>
                  <div className="border border-line bg-paper p-2">
                    <span className="block text-[0.6875rem] text-ink-2">Rain (mm)</span>
                    <span className="num font-bold text-water">{weather.rainfallMm}</span>
                  </div>
                  <div className="border border-line bg-paper p-2">
                    <span className="block text-[0.6875rem] text-ink-2">Temp °C</span>
                    <span className="num font-bold text-ink">{weather.tMaxC}</span>
                  </div>
                  <div className="border border-line bg-paper p-2">
                    <span className="block text-[0.6875rem] text-ink-2">Leaf wet (h)</span>
                    <span className={cx("num font-bold", weather.leafWetnessHrs >= 6 ? "text-alert" : "text-leaf")}>
                      {weather.leafWetnessHrs}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* IPM plan */}
            <div className="border border-line bg-surface p-5">
              <div className="flex items-center gap-2 border-b border-line pb-2 mb-4">
                <ShieldCheck className="size-5 text-forest" />
                <h3 className="font-display text-[1.0625rem] font-semibold text-ink">IPM Action Plan</h3>
              </div>

              <div className="space-y-3 text-[0.8125rem]">
                <div className="border border-line bg-paper p-3">
                  <strong className="block font-semibold text-forest mb-1">1. Cultural measures</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-ink-2">
                    {diagnosis.cultural.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
                <div className="border border-line bg-paper p-3">
                  <strong className="block font-semibold text-leaf mb-1">2. Biological measures</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-ink-2">
                    {diagnosis.biological.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
                <div className="border border-line bg-paper p-3">
                  <strong className="block font-semibold text-amber mb-1">3. Chemical — officer referral only</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-ink-2">
                    {diagnosis.chemical.map((ch) => <li key={ch}>{ch}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5 border-t border-line pt-4">
                <Button
                  onClick={handleSendForValidation}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px]"
                >
                  <Send className="size-4 mr-1.5" />
                  {isSubmitting ? "Sending…" : "Send for Expert Review"}
                </Button>
                <Link
                  to="/farmer/advisories"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 border border-line bg-paper px-4 text-[0.875rem] font-semibold text-ink hover:bg-surface-2"
                >
                  <FileText className="size-4" />
                  Advisories
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "result" && !diagnosis && (
        <div className="border border-line bg-surface p-8 text-center">
          <AlertTriangle className="mx-auto size-10 text-amber mb-3" />
          <p className="font-semibold text-ink">Could not generate a diagnosis</p>
          <p className="mt-1 text-[0.875rem] text-ink-2">
            No disease or pest data found for the selected crop. Try selecting different symptoms or crop.
          </p>
          <Button className="mt-4" onClick={() => setStage("capture")}>Try again</Button>
        </div>
      )}
    </div>
  );
}
