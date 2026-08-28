import type {
  Advisory,
  Crop,
  CropHealthAssessment,
  District,
  Farm,
  FieldVisit,
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
import { delay, emit, store } from "./store";

export { subscribe } from "./store";
export { TODAY, isoDay, isoTime, latestWeather, trapSeries };
export { CROPS, DISEASES, DISTRICTS, PESTS, USERS };

/* ------------------------------------------------------------- lookup maps */

export const districtById = (id: string): District | undefined => DISTRICTS.find((d) => d.id === id);
export const districtName = (id: string) => districtById(id)?.name ?? id;
export const cropById = (id: string): Crop | undefined => CROPS.find((c) => c.id === id);
export const cropName = (id: string) => cropById(id)?.name ?? id;
export const farmById = (id: string): Farm | undefined => FARMS.find((f) => f.id === id);
export const threatName = (id: string) =>
  DISEASES.find((d) => d.id === id)?.name ?? PESTS.find((p) => p.id === id)?.name ?? id;

export const STAGE_LABEL: Record<string, string> = {
  sowing: "Sowing", vegetative: "Vegetative", tillering: "Tillering", flowering: "Flowering",
  boll_formation: "Boll formation", pod_fill: "Pod fill", fruiting: "Fruiting",
  bulbing: "Bulbing", grand_growth: "Grand growth", harvest: "Harvest",
};

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
}

export function getFarms(filters: FarmFilters = {}): Promise<Farm[]> {
  const q = filters.query?.trim().toLowerCase();
  const rows = FARMS.filter(
    (f) =>
      (!filters.districtId || f.districtId === filters.districtId) &&
      (!filters.cropId || f.cropId === filters.cropId) &&
      (!filters.health || f.health === filters.health) &&
      (!q ||
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.ownerName.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)),
  );
  return delay(rows);
}

export function getFarm(id: string): Promise<Farm | undefined> {
  return delay(farmById(id));
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
  return delay({
    fieldsMonitored: FARMS.length,
    healthy: FARMS.filter((f) => f.health === "healthy").length,
    atRisk: FARMS.filter((f) => f.health === "at_risk").length,
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

export { resetStore } from "./store";
