/**
 * CropXense domain model.
 * Every screen reads these shapes; no component invents its own data.
 */

export type Role = "farmer" | "officer" | "expert" | "admin";

export type RiskLevel = "low" | "moderate" | "high";
export type Severity = 1 | 2 | 3 | 4 | 5;
export type CaseStatus =
  | "detected"
  | "awaiting_validation"
  | "expert_confirmed"
  | "field_confirmed"
  | "rejected"
  | "resolved";

export type SignalChannel = "image" | "sensor" | "trap" | "weather" | "history";

export interface District {
  id: string;
  name: string;
  nameMr: string;
  region: string;
  lat: number;
  lon: number;
  /** rough polygon (lat,lon pairs) used by the surveillance map */
  bounds: [number, number][];
}

export interface User {
  id: string;
  name: string;
  role: Role;
  districtId?: string;
  designation: string;
}

export interface Crop {
  id: string;
  name: string;
  nameMr: string;
  season: "kharif" | "rabi" | "perennial";
  /** stage in late August */
  currentStage: CropStage;
  diseaseIds: string[];
  pestIds: string[];
}

export type CropStage =
  | "sowing"
  | "vegetative"
  | "tillering"
  | "flowering"
  | "boll_formation"
  | "pod_fill"
  | "fruiting"
  | "bulbing"
  | "grand_growth"
  | "harvest";

export interface Disease {
  id: string;
  name: string;
  pathogen: string;
  cropIds: string[];
  favourable: string;
  cultural: string[];
  biological: string[];
  chemical: string[];
}

export interface Pest {
  id: string;
  name: string;
  scientific: string;
  cropIds: string[];
  etl: string;
  cultural: string[];
  biological: string[];
  chemical: string[];
}

export interface Farm {
  id: string;
  name: string;
  ownerName: string;
  village: string;
  districtId: string;
  areaHa: number;
  cropId: string;
  stage: CropStage;
  lat: number;
  lon: number;
  /** parcel outline for the map */
  parcel: [number, number][];
  health: "healthy" | "at_risk" | "affected";
  sowingDate: string;
}

export interface Sensor {
  id: string;
  farmId: string;
  districtId: string;
  type: "soil_moisture" | "leaf_wetness" | "air_temp" | "humidity" | "canopy_temp";
  status: "online" | "offline" | "calibration";
  lat: number;
  lon: number;
  lastSeen: string;
  battery: number;
}

export interface SensorReading {
  sensorId: string;
  t: string;
  value: number;
  unit: string;
}

export interface PestTrap {
  id: string;
  farmId: string;
  districtId: string;
  pestId: string;
  type: "pheromone" | "light" | "sticky";
  installedOn: string;
  lat: number;
  lon: number;
  status: "active" | "needs_lure" | "damaged";
}

export interface TrapReading {
  trapId: string;
  date: string;
  count: number;
  /** economic threshold for that pest/trap combination */
  threshold: number;
}

export interface WeatherObservation {
  districtId: string;
  date: string;
  tMaxC: number;
  tMinC: number;
  rhPct: number;
  rainfallMm: number;
  leafWetnessHrs: number;
  windKph: number;
}

export interface RiskForecast {
  districtId: string;
  cropId: string;
  threatId: string;
  threatName: string;
  days: { date: string; risk: RiskLevel; score: number; drivers: string[] }[];
  updatedAt: string;
}

export interface Evidence {
  channel: SignalChannel;
  label: string;
  detail: string;
  supports: boolean;
}

export interface CropHealthAssessment {
  id: string;
  farmId: string;
  districtId: string;
  cropId: string;
  threatId: string;
  suspected: string;
  confidence: number;
  severity: Severity;
  status: CaseStatus;
  detectedVia: SignalChannel[];
  detectedAt: string;
  affectedAreaHa: number;
  evidence: Evidence[];
  reviewId?: string;
  advisoryId?: string;
  notes?: string;
}

export interface ExpertReview {
  id: string;
  assessmentId: string;
  reviewerId: string;
  reviewerName: string;
  verdict: "confirmed" | "corrected" | "rejected";
  correctedThreat?: string;
  comment: string;
  reviewedAt: string;
}

export interface Advisory {
  id: string;
  assessmentId: string;
  farmId: string;
  title: string;
  window: string;
  cultural: string[];
  biological: string[];
  chemical: string[];
  issuedAt: string;
  acknowledged: boolean;
}

export interface FieldVisit {
  id: string;
  assessmentId: string;
  farmId: string;
  officerId: string;
  officerName: string;
  scheduledFor: string;
  status: "scheduled" | "completed" | "missed";
  finding?: string;
}

export interface FollowUp {
  id: string;
  assessmentId: string;
  dueOn: string;
  action: string;
  done: boolean;
}

export interface Outbreak {
  id: string;
  districtId: string;
  cropId: string;
  threatId: string;
  threatName: string;
  risk: RiskLevel;
  affectedFields: number;
  detectedVia: SignalChannel[];
  lastConfirmedAt: string;
  trapTrend: number[];
  lat: number;
  lon: number;
  newest: boolean;
  recommendedAction: string;
}
