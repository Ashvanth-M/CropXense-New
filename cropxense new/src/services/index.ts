import type {
  Advisory,
  Crop,
  CropHealthAssessment,
  District,
  Farm,
  FieldVisit,
  FollowUp,
  Outbreak,
  PestTrap,
  RiskForecast,
  Sensor,
  SensorReading,
  TrapReading,
  WeatherObservation,
} from "@/types";
import { CROPS, DISEASES, DISTRICTS, PESTS, USERS } from "@/data/reference";
import {
  FARMS,
  FORECASTS,
  OUTBREAKS,
  SENSORS,
  SENSOR_READINGS,
  TODAY,
  TRAPS,
  TRAP_READINGS,
  WEATHER,
  isoDay,
  isoTime,
  latestWeather,
  trapSeries,
} from "@/data/seed";
import { delay, emit, store, RAMESH_FIELD_IDS } from "./store";

export { subscribe } from "./store";
export { TODAY, isoDay, isoTime, latestWeather, trapSeries };
export { CROPS, DISEASES, DISTRICTS, PESTS, USERS };

/* ------------------------------------------------------------- lookup maps */

export const districtById = (id: string): District | undefined => DISTRICTS.find((d) => d.id === id);
export const districtName = (id: string) => districtById(id)?.name ?? id;
export const cropById = (id: string): Crop | undefined => CROPS.find((c) => c.id === id);
export const cropName = (id: string) => cropById(id)?.name ?? id;
export const farmById = (id: string): Farm | undefined =>
  store.farms.find((f) => f.id === id) || FARMS.find((f) => f.id === id);
export const threatName = (id: string) =>
  DISEASES.find((d) => d.id === id)?.name ?? PESTS.find((p) => p.id === id)?.name ?? id;

export const STAGE_LABEL: Record<string, string> = {
  sowing: "Sowing", vegetative: "Vegetative", tillering: "Tillering", flowering: "Flowering",
  boll_formation: "Boll formation", pod_fill: "Pod fill", fruiting: "Fruiting",
  bulbing: "Bulbing", grand_growth: "Grand growth", harvest: "Harvest",
};

export const STAGE_BY_CROP: Record<string, CropStage> = Object.fromEntries(
  CROPS.map((c) => [c.id, c.currentStage]),
);

export const STATUS_LABEL: Record<CropHealthAssessment["status"], string> = {
  detected: "Detected",
  awaiting_validation: "Awaiting validation",
  expert_confirmed: "Expert confirmed",
  field_confirmed: "Field confirmed",
  rejected: "Rejected",
  resolved: "Resolved",
};

/* ----------------------------------------------------------------- queries */

export interface FarmFilters {
  districtId?: string;
  cropId?: string;
  health?: Farm["health"];
  query?: string;
  includeArchived?: boolean;
}

export function getFarms(filters: FarmFilters = {}): Promise<Farm[]> {
  const q = filters.query?.trim().toLowerCase();
  const rows = store.farms.filter(
    (f) =>
      (filters.includeArchived || !f.isArchived) &&
      (!filters.districtId || f.districtId.toLowerCase() === filters.districtId.toLowerCase()) &&
      (!filters.cropId || f.cropId.toLowerCase() === filters.cropId.toLowerCase()) &&
      (!filters.health || f.health === filters.health) &&
      (!q ||
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.ownerName.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)),
  );
  return delay(rows.map((f) => ({ ...f })));
}

export function getFarm(id: string): Promise<Farm | undefined> {
  const found = farmById(id);
  return delay(found ? { ...found } : undefined);
}

/** Get farms owned by the currently authenticated farmer */
export function getFarmerFarms(
  user: { id?: string; email?: string; name?: string; role?: string } | null,
): Promise<Farm[]> {
  if (!user) {
    // Default fallback for demo view without login: show Ramesh demo farms (EXACTLY 10)
    const demoFarms = store.farms.filter(
      (f) => !f.isArchived && RAMESH_FIELD_IDS.has(f.id),
    );
    return delay(demoFarms.map((f) => ({ ...f })));
  }

  const isDemoRamesh =
    user.email === "farmer@cropxense.demo" ||
    user.id === "demo-farmer-ramesh" ||
    user.name === "Ramesh Kumar";

  if (isDemoRamesh) {
    // Return strictly the 10 seeded Ramesh fields + any newly user-created fields
    const rameshFarms = store.farms.filter(
      (f) =>
        !f.isArchived &&
        (RAMESH_FIELD_IDS.has(f.id) ||
          ((f.ownerId === user.id || f.ownerId === "demo-farmer-ramesh" || f.ownerName === "Ramesh Kumar") &&
            !FARMS.some((sf) => sf.id === f.id && !RAMESH_FIELD_IDS.has(sf.id)))),
    );
    return delay(rameshFarms.map((f) => ({ ...f })));
  }

  // Real new registered farmer: only return user-created farms
  const userFarms = store.farms.filter(
    (f) =>
      !f.isArchived &&
      !FARMS.some((sf) => sf.id === f.id) &&
      !RAMESH_FIELD_IDS.has(f.id) &&
      ((user.id && f.ownerId === user.id) ||
        (user.email && f.ownerId === user.email) ||
        (user.name && f.ownerName.toLowerCase() === user.name.toLowerCase())),
  );
  return delay(userFarms.map((f) => ({ ...f })));
}

/** Create a new Farm in the shared database */
export async function createFarm(
  input: Partial<Farm> & {
    name: string;
    village: string;
    districtId: string;
    cropId: string;
    areaHa: number;
    stage?: Farm["stage"];
    ownerId?: string;
    ownerName?: string;
  },
): Promise<Farm> {
  const distCode = (input.districtId || "AKO").slice(0, 3).toUpperCase();
  const nextNum = store.farms.length + 1;
  const id = `F-${distCode}-${String(nextNum).padStart(3, "0")}`;

  const dist = districtById(input.districtId) || DISTRICTS[0]!;
  const lat = dist.lat + (Math.random() - 0.5) * 0.08;
  const lon = dist.lon + (Math.random() - 0.5) * 0.08;
  const s = Math.sqrt(input.areaHa || 2) * 0.0011;
  const parcel: [number, number][] = [
    [lat + s * 0.9, lon - s * 0.9],
    [lat + s * 0.8, lon + s * 1.0],
    [lat - s * 0.9, lon + s * 0.8],
    [lat - s * 0.8, lon - s * 1.0],
  ];

  const now = new Date().toISOString().slice(0, 10);

  const newFarm: Farm = {
    id,
    name: input.name.trim(),
    ownerName: input.ownerName?.trim() || "Registered Farmer",
    ownerId: input.ownerId,
    village: input.village.trim(),
    districtId: input.districtId.toLowerCase(),
    state: input.state || "Maharashtra",
    areaHa: Number(input.areaHa) || 1.0,
    cropId: input.cropId.toLowerCase(),
    variety: input.variety?.trim(),
    stage: input.stage || STAGE_BY_CROP[input.cropId.toLowerCase()] || "vegetative",
    sowingDate: input.sowingDate || now,
    notes: input.notes?.trim(),
    lat: Number(input.lat) || lat,
    lon: Number(input.lon) || lon,
    parcel,
    health: "healthy",
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  store.farms = [newFarm, ...store.farms];
  emit();
  return delay(newFarm, 150, 300);
}

/** Edit an existing Farm */
export async function updateFarm(
  id: string,
  updates: Partial<Farm>,
): Promise<Farm> {
  const index = store.farms.findIndex((f) => f.id === id);
  if (index === -1) {
    throw new Error(`Farm with ID ${id} not found`);
  }

  const current = store.farms[index]!;
  const updated: Farm = {
    ...current,
    ...updates,
    id: current.id, // Immutable ID
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  store.farms[index] = updated;
  emit();
  return delay(updated, 150, 300);
}

/** Soft-delete / Archive a Farm (preserves historical cases) */
export async function deleteFarm(id: string, hardDelete = false): Promise<void> {
  if (hardDelete) {
    store.farms = store.farms.filter((f) => f.id !== id);
  } else {
    const target = store.farms.find((f) => f.id === id);
    if (target) {
      target.isArchived = true;
      target.updatedAt = new Date().toISOString().slice(0, 10);
    }
  }
  emit();
  await delay(true, 150, 300);
}

export interface AssessmentFilters {
  districtId?: string;
  cropId?: string;
  status?: CropHealthAssessment["status"];
  farmId?: string;
}

export function getAssessments(filters: AssessmentFilters = {}): Promise<CropHealthAssessment[]> {
  const rows = store.assessments.filter(
    (a) =>
      (!filters.districtId || a.districtId === filters.districtId) &&
      (!filters.cropId || a.cropId === filters.cropId) &&
      (!filters.status || a.status === filters.status) &&
      (!filters.farmId || a.farmId === filters.farmId),
  );
  return delay(rows.map((a) => ({ ...a })));
}

export function getAssessment(id: string): Promise<CropHealthAssessment | undefined> {
  const a = store.assessments.find((x) => x.id === id);
  return delay(a ? { ...a } : undefined);
}

/** Composite priority: confidence x severity, weighted up by age and outbreak overlap. */
export function priorityScore(a: CropHealthAssessment) {
  const ageHrs = (TODAY.getTime() - new Date(a.detectedAt).getTime()) / 3.6e6;
  const inOutbreak = OUTBREAKS.some((o) => o.districtId === a.districtId && o.risk === "high") ? 12 : 0;
  const pending = a.status === "awaiting_validation" ? 14 : a.status === "detected" ? 8 : 0;
  return Math.round(a.confidence * 0.5 + a.severity * 6 + Math.min(ageHrs / 6, 12) + inOutbreak + pending);
}

export function getPriorityQueue(districtId?: string): Promise<CropHealthAssessment[]> {
  const rows = store.assessments
    .filter((a) => !["resolved", "rejected"].includes(a.status))
    .filter((a) => !districtId || a.districtId === districtId)
    .map((a) => ({ ...a }))
    .sort((x, y) => priorityScore(y) - priorityScore(x));
  return delay(rows);
}

export function getOutbreaks(): Promise<Outbreak[]> {
  return delay(OUTBREAKS.map((o) => ({ ...o })));
}

export function getForecast(districtId: string): Promise<RiskForecast | undefined> {
  return delay(FORECASTS.find((f) => f.districtId === districtId));
}

export function getForecasts(): Promise<RiskForecast[]> {
  return delay(FORECASTS);
}

export function getWeather(districtId: string): Promise<WeatherObservation[]> {
  return delay(WEATHER.filter((w) => w.districtId === districtId));
}

export function getSensors(districtId?: string): Promise<Sensor[]> {
  return delay(SENSORS.filter((s) => !districtId || s.districtId === districtId));
}

export function getSensorReadings(sensorId: string): Promise<SensorReading[]> {
  return delay(SENSOR_READINGS.filter((r) => r.sensorId === sensorId));
}

export function getTraps(districtId?: string): Promise<PestTrap[]> {
  return delay(TRAPS.filter((t) => !districtId || t.districtId === districtId));
}

export function getTrapReadings(trapId?: string): Promise<TrapReading[]> {
  return delay(TRAP_READINGS.filter((t) => !trapId || t.trapId === trapId));
}

export function getAdvisories(farmId?: string): Promise<Advisory[]> {
  return delay(store.advisories.filter((a) => !farmId || a.farmId === farmId).map((a) => ({ ...a })));
}

export function getFieldVisits(): Promise<FieldVisit[]> {
  return delay(store.visits.map((v) => ({ ...v })));
}

export function getReviews(assessmentId?: string) {
  return delay(store.reviews.filter((r) => !assessmentId || r.assessmentId === assessmentId));
}

export function getFollowUps() {
  return delay(store.followUps.map((f) => ({ ...f })));
}

/* --------------------------------------------------------------- summaries */

export interface OverviewMetrics {
  fieldsMonitored: number;
  healthy: number;
  atRisk: number;
  activeOutbreaks: number;
  pendingReview: number;
  openFieldCases: number;
}

export function getOverviewMetrics(): Promise<OverviewMetrics> {
  const activeFarms = store.farms.filter((f) => !f.isArchived);
  return delay({
    fieldsMonitored: activeFarms.length,
    healthy: activeFarms.filter((f) => f.health === "healthy").length,
    atRisk: activeFarms.filter((f) => f.health === "at_risk" || f.health === "affected").length,
    activeOutbreaks: OUTBREAKS.filter((o) => o.risk === "high").length,
    pendingReview: store.assessments.filter((a) => a.status === "awaiting_validation").length,
    openFieldCases: store.visits.filter((v) => v.status === "scheduled").length,
  });
}

export interface DistrictRiskRow {
  districtId: string;
  name: string;
  score: number;
  risk: RiskForecast["days"][number]["risk"];
  openCases: number;
  affectedFields: number;
}

export function getDistrictRanking(): Promise<DistrictRiskRow[]> {
  const rows: DistrictRiskRow[] = DISTRICTS.map((d) => {
    const f = FORECASTS.find((x) => x.districtId === d.id);
    const today = f?.days[0];
    return {
      districtId: d.id,
      name: d.name,
      score: today?.score ?? 0,
      risk: today?.risk ?? "low",
      openCases: store.assessments.filter(
        (a) => a.districtId === d.id && !["resolved", "rejected"].includes(a.status),
      ).length,
      affectedFields: OUTBREAKS.filter((o) => o.districtId === d.id).reduce((n, o) => n + o.affectedFields, 0),
    };
  });
  return delay(rows.sort((a, b) => b.score - a.score));
}

/* --------------------------------------------------------------- mutations */

export async function validateCase(
  id: string,
  verdict: "confirmed" | "corrected" | "rejected",
  comment: string,
  correctedThreat?: string,
): Promise<CropHealthAssessment | undefined> {
  const a = store.assessments.find((x) => x.id === id);
  if (!a) return delay(undefined);
  const review = {
    id: `R-${store.reviews.length + 1}`,
    assessmentId: id,
    reviewerId: "u-expert-1",
    reviewerName: "Dr. S. Kulkarni",
    verdict,
    comment,
    reviewedAt: new Date().toISOString(),
    ...(correctedThreat ? { correctedThreat } : {}),
  };
  store.reviews = [review, ...store.reviews];
  a.status = verdict === "rejected" ? "rejected" : "expert_confirmed";
  a.reviewId = review.id;
  if (correctedThreat) a.suspected = threatName(correctedThreat);
  emit();
  return delay({ ...a }, 300, 500);
}

export async function assignFieldVisit(
  assessmentId: string,
  scheduledFor: string,
): Promise<FieldVisit> {
  const a = store.assessments.find((x) => x.id === assessmentId);
  const visit: FieldVisit = {
    id: `FV-${store.visits.length + 1}`,
    assessmentId,
    farmId: a?.farmId ?? "",
    officerId: "u-officer-1",
    officerName: "A. Deshmukh",
    scheduledFor,
    status: "scheduled",
  };
  store.visits = [visit, ...store.visits];
  emit();
  return delay(visit, 300, 500);
}

export async function submitAssessment(input: {
  farmId: string;
  cropId: string;
  threatId: string;
  confidence: number;
  severity: CropHealthAssessment["severity"];
  notes?: string;
}): Promise<CropHealthAssessment> {
  const farm = farmById(input.farmId);
  const districtId = farm?.districtId ?? "amravati";
  const created: CropHealthAssessment = {
    id: `MH-${districtId.slice(0, 3).toUpperCase()}-${24200 + store.assessments.length}`,
    farmId: input.farmId,
    districtId,
    cropId: input.cropId,
    threatId: input.threatId,
    suspected: threatName(input.threatId),
    confidence: input.confidence,
    severity: input.severity,
    status: "awaiting_validation",
    detectedVia: ["image", "weather"],
    detectedAt: new Date().toISOString(),
    affectedAreaHa: Math.round((farm?.areaHa ?? 1) * 0.3 * 10) / 10,
    evidence: [
      { channel: "image", label: "Image regions marked", detail: "Uploaded photograph analysed against the reference set", supports: true },
      { channel: "weather", label: "Weather window", detail: `RH ${latestWeather(districtId).rhPct}% over the last 24 hours`, supports: true },
    ],
    ...(input.notes ? { notes: input.notes } : {}),
  };
  store.assessments = [created, ...store.assessments];
  emit();
  return delay(created, 400, 700);
}

export async function acknowledgeAdvisory(id: string) {
  const a = store.advisories.find((x) => x.id === id);
  if (a) a.acknowledged = true;
  emit();
  return delay(true, 200, 400);
}

/* --------------------------------------------- case lifecycle & follow-ups */

export function getFollowUpsFor(assessmentId: string) {
  return delay(store.followUps.filter((f) => f.assessmentId === assessmentId).map((f) => ({ ...f })));
}

export function getVisitsFor(assessmentId: string) {
  return delay(store.visits.filter((v) => v.assessmentId === assessmentId).map((v) => ({ ...v })));
}

export function getFarmVisits(farmId: string) {
  return delay(store.visits.filter((v) => v.farmId === farmId).map((v) => ({ ...v })));
}

/** Move a case along the lifecycle and record the note as a review entry. */
export async function advanceCase(
  id: string,
  status: CropHealthAssessment["status"],
  note: string,
): Promise<CropHealthAssessment | undefined> {
  const a = store.assessments.find((x) => x.id === id);
  if (!a) return delay(undefined);
  a.status = status;
  if (note) a.notes = note;
  store.reviews = [
    {
      id: `R-${store.reviews.length + 1}`,
      assessmentId: id,
      reviewerId: "u-expert-1",
      reviewerName: "Dr. S. Kulkarni",
      verdict: "confirmed",
      comment: note,
      reviewedAt: new Date().toISOString(),
    },
    ...store.reviews,
  ];
  emit();
  return delay({ ...a }, 300, 500);
}

/** Issue an IPM advisory against a case, using the reference guidance for the threat. */
export async function issueAdvisory(assessmentId: string): Promise<Advisory | undefined> {
  const a = store.assessments.find((x) => x.id === assessmentId);
  if (!a) return delay(undefined);
  const d = DISEASES.find((x) => x.id === a.threatId);
  const p = PESTS.find((x) => x.id === a.threatId);
  const src = d ?? p;
  const advisory: Advisory = {
    id: `ADV-${String(store.advisories.length + 1).padStart(3, "0")}`,
    assessmentId,
    farmId: a.farmId,
    title: `${a.suspected} — management advisory`,
    window: "Next 5 days",
    cultural: src?.cultural ?? ["Inspect and record affected rows"],
    biological: src?.biological ?? ["Consult the district biocontrol lab"],
    chemical: src?.chemical ?? ["Confirm the product and dose with your extension officer"],
    issuedAt: new Date().toISOString(),
    acknowledged: false,
  };
  store.advisories = [advisory, ...store.advisories];
  a.advisoryId = advisory.id;
  emit();
  return delay(advisory, 300, 500);
}

/* ─────────────────────── Connected farmer case engine ─────────────────────── */

import type {
  FarmerScan,
  FarmerFeedback,
  FarmerObservation,
  ImageValidation,
  RiskAssessment,
  CropStage,
} from "@/types";
import type { FullDiagnosis } from "./imageAnalysis";

/**
 * Submit a complete scan case: creates FarmerScan + CropHealthAssessment
 * + Advisory + FollowUp all linked by the same case ID.
 */
export async function submitScanCase(input: {
  farmId: string;
  cropId: string;
  imageDataUrl: string;
  imageValidation: ImageValidation;
  symptoms: string[];
  cropStage: CropStage;
  notes?: string | undefined;
  diagnosis: FullDiagnosis;
  isFollowUp?: boolean | undefined;
  previousScanId?: string | undefined;
  previousCaseId?: string | undefined;
}): Promise<{ caseId: string; scanId: string; advisoryId: string; followUpId: string }> {
  const farm = farmById(input.farmId);
  const districtId = farm?.districtId ?? "akola";

  // Generate deterministic case ID
  const caseNum = 24100 + store.assessments.length;
  const districtPrefix = districtId.slice(0, 3).toUpperCase();
  const caseId = input.previousCaseId || `CX-${districtPrefix}-${caseNum}`;
  const scanId = `SCAN-${String(store.scans.length + 1).padStart(3, "0")}`;

  // 1. Create scan record
  const scan: FarmerScan = {
    id: scanId,
    caseId,
    farmId: input.farmId,
    cropId: input.cropId,
    imageDataUrl: input.imageDataUrl,
    imageValidation: input.imageValidation,
    symptoms: input.symptoms,
    cropStage: input.cropStage,
    notes: input.notes ?? undefined,
    scannedAt: new Date().toISOString(),
    isFollowUp: input.isFollowUp ?? false,
    previousScanId: input.previousScanId ?? undefined,
  };
  store.scans = [scan, ...store.scans];

  // 2. Create or update assessment
  let assessment: CropHealthAssessment;
  if (input.previousCaseId) {
    // Follow-up scan: update existing case
    const existing = store.assessments.find((a) => a.id === input.previousCaseId);
    if (existing) {
      existing.confidence = input.diagnosis.confidence;
      existing.severity = input.diagnosis.severity;
      existing.notes = input.notes || existing.notes;
      existing.scanId = scanId ?? undefined;
      assessment = existing;
    } else {
      assessment = createNewAssessment(caseId, scanId, input, districtId);
    }
  } else {
    assessment = createNewAssessment(caseId, scanId, input, districtId);
  }

  // 3. Create advisory
  const advisoryId = `ADV-${String(store.advisories.length + 1).padStart(3, "0")}`;
  const advisory: Advisory = {
    id: advisoryId,
    assessmentId: caseId,
    farmId: input.farmId,
    title: `${input.diagnosis.threatName} — management advisory for ${input.diagnosis.cropName} at ${input.cropStage.replace("_", " ")} stage`,
    window: "Next 5 days",
    cultural: input.diagnosis.cultural,
    biological: input.diagnosis.biological,
    chemical: input.diagnosis.chemical,
    issuedAt: new Date().toISOString(),
    acknowledged: false,
  };
  store.advisories = [advisory, ...store.advisories];
  assessment.advisoryId = advisoryId;

  // 4. Create follow-up
  const followUpId = `FU-${String(store.followUps.length + 1).padStart(3, "0")}`;
  const followUp: FollowUp = {
    id: followUpId,
    assessmentId: caseId,
    dueOn: isoDay(5),
    action: `Re-scan ${farm?.name ?? "field"} to check ${input.diagnosis.threatName} progression`,
    done: false,
    reason: `Initial scan detected ${input.diagnosis.threatName} at ${input.diagnosis.confidence}% confidence`,
  } satisfies FollowUp;
  store.followUps = [followUp, ...store.followUps];

  emit();
  return delay({ caseId, scanId, advisoryId, followUpId }, 200, 400);
}

function createNewAssessment(
  caseId: string,
  scanId: string,
  input: {
    farmId: string;
    cropId: string;
    symptoms: string[];
    notes?: string | undefined;
    diagnosis: FullDiagnosis;
  },
  districtId: string,
): CropHealthAssessment {
  const farm = farmById(input.farmId);
  const a: CropHealthAssessment = {
    id: caseId,
    farmId: input.farmId,
    districtId,
    cropId: input.cropId,
    threatId: input.diagnosis.threatId,
    suspected: input.diagnosis.threatName,
    confidence: input.diagnosis.confidence,
    severity: input.diagnosis.severity,
    status: "awaiting_validation",
    detectedVia: ["image", "weather"],
    detectedAt: new Date().toISOString(),
    affectedAreaHa: Math.round((farm?.areaHa ?? 1) * (input.diagnosis.affectedAreaPct / 100) * 10) / 10,
    evidence: [
      { channel: "image", label: "Uploaded crop image analysed", detail: `${input.symptoms.length} symptoms identified`, supports: true },
      { channel: "weather", label: "Weather context checked", detail: `Current conditions evaluated for disease/pest risk`, supports: true },
    ],
    notes: input.notes ?? undefined,
    scanId: scanId ?? undefined,
    riskAssessment: input.diagnosis.riskAssessment,
    feedbackIds: [],
  };
  store.assessments = [a, ...store.assessments];
  return a;
}

/** Submit farmer feedback on a case */
export async function submitFarmerFeedback(
  caseId: string,
  farmId: string,
  observation: FarmerObservation,
  notes?: string,
): Promise<FarmerFeedback> {
  const fb: FarmerFeedback = {
    id: `FB-${String(store.feedbacks.length + 1).padStart(3, "0")}`,
    caseId,
    farmId,
    observation,
    notes: notes ?? undefined,
    submittedAt: new Date().toISOString(),
  };
  store.feedbacks = [fb, ...store.feedbacks];

  // Update the case status based on feedback
  const assessment = store.assessments.find((a) => a.id === caseId);
  if (assessment) {
    if (!assessment.feedbackIds) assessment.feedbackIds = [];
    assessment.feedbackIds.push(fb.id);

    if (observation === "improving") {
      assessment.status = "field_confirmed";
      assessment.notes = `Farmer reports: ${observation}. ${notes || ""}`.trim();
    } else if (observation === "worsening") {
      assessment.status = "awaiting_validation";
      assessment.notes = `Farmer reports worsening — expert review recommended. ${notes || ""}`.trim();
    }
  }

  emit();
  return delay(fb, 200, 400);
}

/** Request expert review on a case */
export async function requestExpertReview(caseId: string, reason?: string): Promise<boolean> {
  const a = store.assessments.find((x) => x.id === caseId);
  if (!a) return delay(false);
  a.status = "awaiting_validation";
  a.notes = reason || "Expert review requested by farmer";
  emit();
  return delay(true, 200, 400);
}

/** Complete a follow-up with optional re-scan */
export async function completeFollowUp(
  followUpId: string,
  resultScanId?: string,
): Promise<boolean> {
  const fu = store.followUps.find((f) => f.id === followUpId);
  if (!fu) return delay(false);
  fu.done = true;
  fu.completedAt = new Date().toISOString();
  if (resultScanId) fu.resultScanId = resultScanId;
  emit();
  return delay(true, 200, 400);
}

/** Mark a case as resolved */
export async function resolveCase(caseId: string): Promise<boolean> {
  const a = store.assessments.find((x) => x.id === caseId);
  if (!a) return delay(false);
  a.status = "resolved";
  emit();
  return delay(true, 200, 400);
}

/** Get all scans for a specific case (for before/after comparison) */
export function getScansForCase(caseId: string): FarmerScan[] {
  return store.scans.filter((s) => s.caseId === caseId);
}

/** Get all feedbacks for a case */
export function getFeedbacksForCase(caseId: string): FarmerFeedback[] {
  return store.feedbacks.filter((f) => f.caseId === caseId);
}

/** Get all farmer scans */
export function getAllScans(): FarmerScan[] {
  return [...store.scans];
}

/* ─────────────────────── Dashboard intelligence queries ─────────────────────── */

export interface TodayAction {
  type: "scan" | "followup" | "feedback" | "weather" | "review";
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  caseId?: string | undefined;
  farmId?: string | undefined;
  followUpId?: string | undefined;
  link?: string | undefined;
}

/** Get actionable items for the farmer today */
export function getTodayActions(farms: Farm[]): TodayAction[] {
  const today = isoDay(0);
  const actions: TodayAction[] = [];
  const farmIds = new Set(farms.map((f) => f.id));

  // Overdue follow-ups
  store.followUps
    .filter((f) => !f.done && f.dueOn <= today && store.assessments.some((a) => a.id === f.assessmentId && farmIds.has(a.farmId)))
    .forEach((f) => {
      const assessment = store.assessments.find((a) => a.id === f.assessmentId);
      actions.push({
        type: "followup",
        priority: "high",
        title: f.action,
        detail: `Overdue — was due ${f.dueOn}`,
        caseId: f.assessmentId,
        farmId: assessment?.farmId,
        followUpId: f.id,
        link: "/farmer/crop-care",
      });
    });

  // Due today
  store.followUps
    .filter((f) => !f.done && f.dueOn === today && store.assessments.some((a) => a.id === f.assessmentId && farmIds.has(a.farmId)))
    .forEach((f) => {
      const assessment = store.assessments.find((a) => a.id === f.assessmentId);
      if (!actions.some((a) => a.followUpId === f.id)) {
        actions.push({
          type: "followup",
          priority: "high",
          title: f.action,
          detail: "Due today",
          caseId: f.assessmentId,
          farmId: assessment?.farmId,
          followUpId: f.id,
          link: "/farmer/crop-care",
        });
      }
    });

  // Unacknowledged advisories
  store.advisories
    .filter((a) => !a.acknowledged && farmIds.has(a.farmId))
    .slice(0, 2)
    .forEach((a) => {
      actions.push({
        type: "review",
        priority: "medium",
        title: `Review advisory: ${a.title.split("—")[0]?.trim() ?? a.title}`,
        detail: `Action window: ${a.window}`,
        caseId: a.assessmentId,
        farmId: a.farmId,
        link: "/farmer/crop-care",
      });
    });

  // Scan suggestion for at-risk fields without recent scan
  farms.filter((f) => f.health !== "healthy").forEach((f) => {
    const hasRecentScan = store.scans.some((s) => s.farmId === f.id);
    if (!hasRecentScan) {
      actions.push({
        type: "scan",
        priority: "medium",
        title: `Scan ${f.name}`,
        detail: `${cropName(f.cropId)} field is at risk — no recent scan`,
        farmId: f.id,
        link: "/farmer/scan",
      });
    }
  });

  return actions.sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });
}

export interface CropHealthStory {
  lastScanDate?: string | undefined;
  finding?: string | undefined;
  risk?: string | undefined;
  action?: string | undefined;
  latestFollowUpDate?: string | undefined;
  trend?: string | undefined;
  nextCheckDate?: string | undefined;
  caseId?: string | undefined;
}

/** Get the latest crop health narrative for the overview */
export function getCropHealthStory(farms: Farm[]): CropHealthStory {
  const farmIds = new Set(farms.map((f) => f.id));

  // Find latest assessment belonging to the farmer's farms
  const latestCase = store.assessments
    .filter((a) => farmIds.has(a.farmId))
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0];

  if (!latestCase) return {};

  const latestScan = store.scans.find((s) => s.caseId === latestCase.id);
  const latestFollowUp = store.followUps
    .filter((f) => f.assessmentId === latestCase.id)
    .sort((a, b) => (a.dueOn > b.dueOn ? -1 : 1))[0];
  const latestFeedback = store.feedbacks
    .filter((f) => f.caseId === latestCase.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  return {
    lastScanDate: latestScan?.scannedAt?.slice(0, 10) ?? latestCase.detectedAt.slice(0, 10),
    finding: latestCase.suspected,
    risk: latestCase.riskAssessment?.overallRisk ?? (latestCase.severity >= 3 ? "high" : "moderate"),
    action: latestCase.status === "resolved"
      ? "Case resolved"
      : latestCase.advisoryId
        ? "IPM monitoring started"
        : "Assessment submitted",
    latestFollowUpDate: latestFollowUp?.done ? latestFollowUp.completedAt?.slice(0, 10) : undefined,
    trend: latestFeedback?.observation === "improving"
      ? "Improving"
      : latestFeedback?.observation === "worsening"
        ? "Needs attention"
        : latestCase.status === "resolved"
          ? "Resolved"
          : "Monitoring",
    nextCheckDate: latestFollowUp && !latestFollowUp.done ? latestFollowUp.dueOn : undefined,
    caseId: latestCase.id,
  };
}

/** Get field timeline events for a specific farm */
export interface TimelineEvent {
  date: string;
  type: "registered" | "scan" | "detection" | "advisory" | "followup" | "feedback" | "resolved";
  title: string;
  detail?: string | undefined;
}

export function getFieldTimeline(farmId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const farm = farmById(farmId);

  if (farm) {
    events.push({
      date: farm.sowingDate,
      type: "registered",
      title: "Crop registered",
      detail: `${cropName(farm.cropId)} · ${farm.areaHa} ha`,
    });
  }

  store.assessments
    .filter((a) => a.farmId === farmId)
    .forEach((a) => {
      events.push({
        date: a.detectedAt.slice(0, 10),
        type: "detection",
        title: `${a.suspected} detected`,
        detail: `${a.confidence}% confidence · Severity ${a.severity}/5`,
      });

      if (a.advisoryId) {
        const adv = store.advisories.find((x) => x.id === a.advisoryId);
        if (adv) {
          events.push({
            date: adv.issuedAt.slice(0, 10),
            type: "advisory",
            title: "Advisory issued",
            detail: adv.title.split("—")[0]?.trim(),
          });
        }
      }

      if (a.status === "resolved") {
        events.push({
          date: a.detectedAt.slice(0, 10),
          type: "resolved",
          title: "Case resolved",
        });
      }
    });

  store.scans
    .filter((s) => s.farmId === farmId)
    .forEach((s) => {
      events.push({
        date: s.scannedAt.slice(0, 10),
        type: "scan",
        title: s.isFollowUp ? "Follow-up scan" : "Crop scan",
        detail: `${s.symptoms.length} symptoms checked`,
      });
    });

  store.followUps
    .filter((f) => store.assessments.some((a) => a.id === f.assessmentId && a.farmId === farmId))
    .forEach((f) => {
      if (f.done && f.completedAt) {
        events.push({
          date: f.completedAt.slice(0, 10),
          type: "followup",
          title: "Follow-up completed",
          detail: f.action,
        });
      }
    });

  store.feedbacks
    .filter((fb) => fb.farmId === farmId)
    .forEach((fb) => {
      events.push({
        date: fb.submittedAt.slice(0, 10),
        type: "feedback",
        title: `Farmer: ${fb.observation.replace("_", " ")}`,
        detail: fb.notes,
      });
    });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export { resetStore } from "./store";

