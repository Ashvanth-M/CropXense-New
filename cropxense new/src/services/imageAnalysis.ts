/**
 * Image analysis service for CropXense.
 *
 * Client-side image validation and symptom detection using Canvas API pixel analysis.
 * This provides a realistic demo experience without external ML dependencies.
 *
 * For production, replace with a server-side ML pipeline (TensorFlow Serving,
 * Gemini Vision API, or a custom model endpoint).
 */

import type { ImageValidation, CropStage, RiskLevel, RiskAssessment, GeminiAnalysisResult } from "@/types";
import { CROPS, DISEASES, PESTS } from "@/data/reference";
import type { Disease, Pest } from "@/types";

/* ─────────────────────────── Image Validation ─────────────────────────── */

/** Analyse an image data URL to determine if it contains a crop leaf. */
export async function validateImage(imageDataUrl: string): Promise<ImageValidation> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 200; // downscale for analysis
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Analyse colour distribution
      let greenPixels = 0;
      let brownPixels = 0;
      let yellowPixels = 0;
      let darkPixels = 0;
      let brightPixels = 0;
      let totalPixels = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      let variance = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        totalPixels++;
        rSum += r; gSum += g; bSum += b;

        const brightness = (r + g + b) / 3;
        if (brightness < 40) darkPixels++;
        if (brightness > 220) brightPixels++;

        // Green detection (leaf-like)
        if (g > r * 1.1 && g > b * 1.1 && g > 50) greenPixels++;
        // Yellow detection (chlorosis/stress)
        if (r > 150 && g > 130 && b < 100 && r > b * 1.5) yellowPixels++;
        // Brown detection (lesions/necrosis)
        if (r > 80 && r < 180 && g > 50 && g < 130 && b < 80 && r > g) brownPixels++;
      }

      const greenRatio = greenPixels / totalPixels;
      const yellowRatio = yellowPixels / totalPixels;
      const brownRatio = brownPixels / totalPixels;
      const darkRatio = darkPixels / totalPixels;
      const brightRatio = brightPixels / totalPixels;

      // Calculate colour variance (for blur/quality detection)
      const avgR = rSum / totalPixels;
      const avgG = gSum / totalPixels;
      const avgB = bSum / totalPixels;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        variance += (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2;
      }
      variance /= totalPixels * 3;

      // Leaf detection: needs meaningful green content
      const leafDetected = greenRatio > 0.08;

      // Image quality assessment
      let imageQuality: ImageValidation["imageQuality"] = "good";
      const qualityNotes: string[] = [];

      if (!leafDetected) {
        imageQuality = "rejected";
        qualityNotes.push("No crop leaf detected in this image");
      } else if (darkRatio > 0.5) {
        imageQuality = "poor";
        qualityNotes.push("Image is too dark — insufficient lighting");
      } else if (brightRatio > 0.4) {
        imageQuality = "poor";
        qualityNotes.push("Image is overexposed — too much glare");
      } else if (variance < 500) {
        imageQuality = "fair";
        qualityNotes.push("Image appears blurry — try holding camera steady");
      } else if (greenRatio < 0.12) {
        imageQuality = "fair";
        qualityNotes.push("Leaf is small in frame — try moving closer");
      }

      // Detect visible symptoms from pixel analysis
      const detectedSymptoms: string[] = [];
      if (yellowRatio > 0.05) detectedSymptoms.push("Yellowing / chlorosis");
      if (brownRatio > 0.06) detectedSymptoms.push("Dark spots / lesions");
      if (brownRatio > 0.03 && yellowRatio > 0.03) detectedSymptoms.push("Leaf browning");
      if (yellowRatio > 0.08 && greenRatio > 0.15) detectedSymptoms.push("Marginal yellowing");
      if (variance > 3000 && brownRatio > 0.04) detectedSymptoms.push("Irregular patches");
      // Check for curling is hard via pixel analysis, but if shape is non-uniform we hint
      if (greenRatio > 0.2 && darkRatio > 0.15) detectedSymptoms.push("Possible leaf curling");

      // If very green and healthy-looking, note that
      if (detectedSymptoms.length === 0 && greenRatio > 0.25) {
        detectedSymptoms.push("Leaf appears healthy");
      }

      resolve({
        leafDetected,
        imageQuality,
        detectedSymptoms,
        qualityNotes: qualityNotes.join(". ") || undefined,
      });
    };
    img.onerror = () => {
      resolve({
        leafDetected: false,
        imageQuality: "rejected" as const,
        detectedSymptoms: [],
        qualityNotes: "Could not process this image file",
      });
    };
    img.src = imageDataUrl;
  });
}

/* ─────────────────────────── Crop Identification ─────────────────────────── */

/**
 * Heuristic crop identification from image analysis.
 * For the MVP, this uses a simple colour-profile matching approach.
 * In production, replace with a real classifier.
 */
export function identifyCropFromImage(
  imageDataUrl: string,
  selectedCrop?: string,
): Promise<{ cropId: string; confidence: number; mismatch: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 100, 100);
      const data = ctx.getImageData(0, 0, 100, 100).data;

      let greenRatio = 0;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        const g = data[i + 1]!;
        const r = data[i]!;
        const b = data[i + 2]!;
        if (g > r * 1.1 && g > b * 1.1) greenRatio++;
        total++;
      }
      greenRatio /= total;

      // Simple heuristic: if it's a green leaf, the selected crop is most likely correct
      // Real model would do actual classification
      const cropId = selectedCrop || "soybean";
      const confidence = greenRatio > 0.15 ? 88 + Math.floor(greenRatio * 20) : 45;
      const mismatch = false; // In demo mode, trust the farmer's selection

      resolve({ cropId: Math.min(confidence, 96) > 60 ? cropId : cropId, confidence: Math.min(confidence, 96), mismatch });
    };
    img.onerror = () => resolve({ cropId: selectedCrop || "soybean", confidence: 30, mismatch: false });
    img.src = imageDataUrl;
  });
}

/* ─────────────────────────── Symptom-based Diagnosis ─────────────────────── */

/** Symptom → disease/pest keyword mapping used to score candidates */
const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  "Yellowing / chlorosis":  ["mosaic", "virus", "chlorosis", "curl", "yellowing", "rust"],
  "Dark spots / lesions":   ["blight", "blast", "spot", "blotch", "alternaria"],
  "Leaf browning":          ["blight", "rust", "rot", "sigatoka"],
  "Marginal yellowing":     ["mosaic", "virus", "curl"],
  "Irregular patches":      ["blight", "mildew", "rust"],
  "Possible leaf curling":  ["thrips", "leaf curl", "whitefly", "virus"],
  "Leaf appears healthy":   [],
  "Leaf lesions":           ["blight", "blast", "rust", "spot", "blotch", "sigatoka"],
  "Yellow margins":         ["mosaic", "virus", "chlorosis", "curl"],
  "Angular spots":          ["bacterial", "blight", "xanthomonas"],
  "Powdery coating":        ["mildew", "rust", "powdery"],
  "Wilting":                ["rot", "blight", "fusarium", "pythium"],
  "Insect holes":           ["bollworm", "borer", "fruit borer", "armyworm"],
  "Sticky honeydew":        ["whitefly", "aphid", "mealybug"],
  "Rolled leaves":          ["thrips", "leaf curl", "borer"],
  "Dark spots/rings":       ["blight", "spot", "rust", "alternaria"],
  "Stem girdling":          ["girdle beetle", "borer"],
};

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

export interface DiagnosisCandidate {
  threatId: string;
  threatName: string;
  threatType: "disease" | "pest";
  confidence: number;
}

export interface FullDiagnosis {
  threatId: string;
  threatName: string;
  threatType: "disease" | "pest";
  cropId: string;
  cropName: string;
  confidence: number;
  severity: 1 | 2 | 3 | 4 | 5;
  affectedAreaPct: number;
  cultural: string[];
  biological: string[];
  chemical: string[];
  favourable?: string | undefined;
  differentials: DiagnosisCandidate[];
  riskAssessment: RiskAssessment;
  explanations: string[];
}

/**
 * Build a complete diagnosis from crop + symptoms + weather + image analysis.
 * Deterministic (no Math.random) — uses a hash of inputs for consistent results.
 */
export function buildFullDiagnosis(
  cropId: string,
  allSymptoms: string[],
  imageSymptoms: string[],
  weatherRh: number,
  weatherLeafWet: number,
  weatherRain: number,
  weatherTemp: number,
  stage: CropStage,
): FullDiagnosis | null {
  const crop = CROPS.find((c) => c.id === cropId);
  if (!crop) return null;

  const diseases = DISEASES.filter((d) => d.cropIds.includes(cropId));
  const pests = PESTS.filter((p) => p.cropIds.includes(cropId));

  // Combine farmer-selected + image-detected symptoms
  const combined = [...new Set([...allSymptoms, ...imageSymptoms])];

  type Candidate = { id: string; name: string; type: "disease" | "pest"; score: number; src: Disease | Pest };

  const candidates: Candidate[] = [
    ...diseases.map((d) => ({ id: d.id, name: d.name, type: "disease" as const, score: scoreThreat(d.name, combined), src: d })),
    ...pests.map((p) => ({ id: p.id, name: p.name, type: "pest" as const, score: scoreThreat(p.name, combined), src: p })),
  ];

  // Weather-based boosts
  if (weatherRh >= 75 || weatherLeafWet >= 6) {
    candidates.forEach((c) => { if (c.type === "disease") c.score += 3; });
  }
  if (weatherRh < 65) {
    candidates.forEach((c) => { if (c.type === "pest") c.score += 2; });
  }
  if (weatherRain > 20) {
    candidates.forEach((c) => { if (c.type === "disease") c.score += 2; });
  }
  if (weatherTemp > 28 && weatherTemp < 33 && weatherRh > 70) {
    candidates.forEach((c) => { if (c.type === "pest") c.score += 1; });
  }

  // If no symptoms, add a small base score
  if (combined.length === 0 || (combined.length === 1 && combined[0] === "Leaf appears healthy")) {
    candidates.forEach((c) => { c.score += 1; });
  }

  candidates.sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top) return null;

  // Deterministic confidence from score
  const maxPossibleScore = combined.length * 4 + 6; // rough max
  const rawConf = Math.min(96, Math.max(42, Math.round(55 + (top.score / Math.max(maxPossibleScore, 1)) * 40)));
  const severity: 1 | 2 | 3 | 4 | 5 = combined.length >= 4 ? 4 : combined.length >= 2 ? 3 : combined.length >= 1 ? 2 : 1;
  const affectedAreaPct = Math.min(45, Math.max(3, severity * 5 + combined.length * 3));

  const src = top.src;
  const isDis = top.type === "disease";

  // Build risk assessment
  const diseaseRisk: RiskLevel = weatherRh >= 80 && weatherLeafWet >= 6 ? "high" : weatherRh >= 70 ? "moderate" : "low";
  const pestRisk: RiskLevel = top.type === "pest" && rawConf > 65 ? "high" : top.type === "pest" ? "moderate" : diseaseRisk === "high" ? "moderate" : "low";
  const spreadRisk: RiskLevel = weatherRain > 15 && weatherRh > 75 ? "high" : weatherRain > 5 ? "moderate" : "low";
  const overallRisk: RiskLevel = [diseaseRisk, pestRisk, spreadRisk].includes("high") ? "high" : [diseaseRisk, pestRisk, spreadRisk].includes("moderate") ? "moderate" : "low";

  const drivers: string[] = [];
  if (weatherRh >= 75) drivers.push(`High humidity (${weatherRh}%) favours pathogen development`);
  if (weatherLeafWet >= 6) drivers.push(`Extended moisture period (${weatherLeafWet}h) creates infection window`);
  if (weatherRain > 15) drivers.push(`Recent rainfall (${weatherRain}mm) increases spread risk`);
  if (weatherTemp > 26 && weatherTemp < 33) drivers.push(`Warm temperatures (${weatherTemp}°C) support pest activity`);
  if (combined.length > 2) drivers.push(`Multiple visible symptoms increase diagnostic confidence`);

  // Build explanations for "Why this result?"
  const explanations: string[] = [];
  if (combined.length > 0 && combined[0] !== "Leaf appears healthy") {
    explanations.push(`Visual symptoms (${combined.filter(s => s !== "Leaf appears healthy").join(", ")}) are consistent with ${top.name}`);
  }
  explanations.push(`${crop.name} at ${stage.replace("_", " ")} stage is susceptible to ${top.name}`);
  if (isDis && (src as Disease).favourable) {
    explanations.push(`Current weather matches favourable conditions: ${(src as Disease).favourable}`);
  }

  // Differential candidates
  const differentials: DiagnosisCandidate[] = candidates.slice(1, 4).map((c) => ({
    threatId: c.id,
    threatName: c.name,
    threatType: c.type,
    confidence: Math.max(5, Math.round(rawConf * (c.score / Math.max(top.score, 1)) * 0.7)),
  }));

  return {
    threatId: top.id,
    threatName: top.name,
    threatType: top.type,
    cropId,
    cropName: crop.name,
    confidence: rawConf,
    severity,
    affectedAreaPct,
    cultural: isDis ? (src as Disease).cultural : (src as Pest).cultural,
    biological: isDis ? (src as Disease).biological : (src as Pest).biological,
    chemical: isDis ? (src as Disease).chemical : (src as Pest).chemical,
    favourable: isDis ? (src as Disease).favourable : undefined,
    differentials,
    riskAssessment: { diseaseRisk, pestRisk, spreadRisk, overallRisk, drivers },
    explanations,
  };
}

/* ─────────────────────────── Farm Health Score ─────────────────────────── */

export interface FarmHealthScore {
  overall: number;
  cropCondition: number;
  diseasePressure: number;
  pestPressure: number;
  weatherRisk: number;
  label: string;
}

/**
 * Deterministic farm health score calculated from current application state.
 */
export function calculateFarmHealthScore(
  totalFields: number,
  healthyFields: number,
  activeCases: number,
  avgSeverity: number,
  weatherRh: number,
  unresolvedFollowUps: number,
): FarmHealthScore {
  // Crop condition: based on healthy field ratio
  const cropCondition = totalFields > 0
    ? Math.round((healthyFields / totalFields) * 100)
    : 80;

  // Disease pressure: inverse of active case severity
  const diseasePressure = Math.max(20, Math.round(100 - activeCases * 12 - avgSeverity * 8));

  // Pest pressure: from active cases with pest threats
  const pestPressure = Math.max(20, Math.round(100 - activeCases * 10));

  // Weather risk: from humidity
  const weatherRisk = weatherRh >= 85
    ? Math.round(35 + (100 - weatherRh))
    : weatherRh >= 75
      ? Math.round(55 + (85 - weatherRh) * 2)
      : Math.round(80 + (75 - weatherRh));

  const overall = Math.round(
    cropCondition * 0.3 + diseasePressure * 0.25 + pestPressure * 0.2 + Math.min(weatherRisk, 100) * 0.15 + (unresolvedFollowUps > 0 ? -10 : 10),
  );
  const clamped = Math.max(15, Math.min(98, overall));

  let label: string;
  if (clamped >= 80) label = "Good — continue monitoring";
  else if (clamped >= 60) label = "Moderate attention required";
  else if (clamped >= 40) label = "Needs active intervention";
  else label = "Critical — immediate action needed";

  return {
    overall: clamped,
    cropCondition: Math.min(100, cropCondition),
    diseasePressure: Math.min(100, Math.max(0, diseasePressure)),
    pestPressure: Math.min(100, Math.max(0, pestPressure)),
    weatherRisk: Math.min(100, Math.max(0, weatherRisk)),
    label,
  };
}

/* ─────────────────────────── Gemini + Risk Engine Fusion ─────────────────────────── */

export interface UnifiedAIAssessment {
  primaryDiagnosis: FullDiagnosis | null;
  geminiResult: GeminiAnalysisResult | null;
  consensus: "concur" | "differ" | "complementary" | "single_source";
  combinedConfidence: number;
  aiObservationSummary: string;
  scientificRiskSummary: string;
}

/**
 * Fuse Gemini AI visual reasoning with CropXense deterministic agronomic risk engine.
 * Clearly separates "AI Observation" from "Agronomic Risk Assessment".
 */
export function combineGeminiWithRiskEngine(
  gemini: GeminiAnalysisResult | null,
  riskDiagnosis: FullDiagnosis | null,
): UnifiedAIAssessment {
  if (!gemini && !riskDiagnosis) {
    return {
      primaryDiagnosis: null,
      geminiResult: null,
      consensus: "single_source",
      combinedConfidence: 0,
      aiObservationSummary: "No analysis available.",
      scientificRiskSummary: "Awaiting field data.",
    };
  }

  if (gemini && !riskDiagnosis) {
    return {
      primaryDiagnosis: null,
      geminiResult: gemini,
      consensus: "single_source",
      combinedConfidence: gemini.confidence,
      aiObservationSummary: gemini.explanation || gemini.raw_visible_evidence,
      scientificRiskSummary: "Agronomic risk engine calculation pending.",
    };
  }

  if (!gemini && riskDiagnosis) {
    return {
      primaryDiagnosis: riskDiagnosis,
      geminiResult: null,
      consensus: "single_source",
      combinedConfidence: riskDiagnosis.confidence,
      aiObservationSummary: riskDiagnosis.explanations.join(". "),
      scientificRiskSummary: `Overall Risk: ${riskDiagnosis.riskAssessment.overallRisk.toUpperCase()} — ${riskDiagnosis.riskAssessment.drivers.join(", ")}`,
    };
  }

  // Both available: check consensus
  const geminiTopIssue = gemini!.possible_issues[0]?.name?.toLowerCase() || "";
  const riskThreatName = riskDiagnosis!.threatName.toLowerCase();

  const isMatch = geminiTopIssue.includes(riskThreatName) || riskThreatName.includes(geminiTopIssue) ||
    gemini!.symptoms.some((s) => riskDiagnosis!.explanations.some((e) => e.toLowerCase().includes(s.toLowerCase())));

  const consensus = isMatch ? "concur" : "complementary";
  const combinedConfidence = Math.min(
    98,
    Math.round(riskDiagnosis!.confidence * 0.6 + gemini!.confidence * 0.4 + (isMatch ? 5 : 0)),
  );

  return {
    primaryDiagnosis: riskDiagnosis,
    geminiResult: gemini,
    consensus,
    combinedConfidence,
    aiObservationSummary: `Gemini Observation: ${gemini!.explanation} (${gemini!.confidence}% confidence). Visible: ${gemini!.raw_visible_evidence || gemini!.symptoms.join(", ")}`,
    scientificRiskSummary: `Risk Engine: Suspected ${riskDiagnosis!.threatName} with ${riskDiagnosis!.riskAssessment.overallRisk} risk level. Key drivers: ${riskDiagnosis!.riskAssessment.drivers.join("; ")}`,
  };
}

