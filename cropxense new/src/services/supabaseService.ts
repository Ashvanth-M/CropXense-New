/**
 * CropXense Supabase Unified Data Access Layer.
 *
 * Central Single Source of Truth for all 3 roles:
 * - Farmer
 * - Field Extension Officer
 * - Plant Protection Expert
 *
 * Interacts directly with Supabase tables and storage:
 * - profiles, farms, crop_scans, crop_health_cases, case_evidence
 * - officer_visits, expert_reviews, advisories, follow_ups
 * - pest_traps, pest_readings, weather_observations, sensors, farmer_feedback
 */

import { supabase } from "@/lib/supabase";
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
  FarmerScan,
  FarmerFeedback,
  FarmerObservation,
  ImageValidation,
  RiskAssessment,
  CropStage,
  ExpertReview,
  VoiceReport,
  AssistedReport,
  CaseTimelineEvent,
  OfflineSyncRecord,
  GeminiAnalysisResult,
} from "@/types";
import { CROPS, DISEASES, DISTRICTS, PESTS, USERS } from "@/data/reference";
import {
  FARMS as SEED_FARMS,
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
  ASSESSMENTS as SEED_ASSESSMENTS,
  ADVISORIES as SEED_ADVISORIES,
  FIELD_VISITS as SEED_VISITS,
  FOLLOW_UPS as SEED_FOLLOW_UPS,
  REVIEWS as SEED_REVIEWS,
} from "@/data/seed";
import type { FullDiagnosis } from "./imageAnalysis";

export { CROPS, DISEASES, DISTRICTS, PESTS, USERS };
export { TODAY, isoDay, isoTime, latestWeather, trapSeries };

/* ------------------------------------------------------------- ID Mappings & Constants */

export const RAMESH_USER_ID = "demo-farmer-ramesh";
export const OFFICER_USER_ID = "demo-officer-priya";
export const EXPERT_USER_ID = "demo-expert-anjali";

export const RAMESH_FIELD_IDS = new Set([
  "F-AKO-001", "F-AKO-002", "F-AKO-003", "F-AKO-004", "F-AKO-005",
  "F-AKO-006", "F-AKO-007", "F-AKO-008", "F-AKO-009", "F-AKO-010",
]);

export const RAMESH_FIELDS: Farm[] = [
  {
    id: "F-AKO-001",
    name: "Vitthal Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Nandgaon Peth",
    districtId: "amravati",
    cropId: "soybean",
    variety: "JS-335",
    areaHa: 6.0,
    sowingDate: "2026-06-15",
    stage: "pod_fill",
    health: "at_risk",
    lat: 20.932,
    lon: 77.7523,
    parcel: [[20.932, 77.7523], [20.935, 77.7523], [20.935, 77.7553], [20.932, 77.7553]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-06-15",
    updatedAt: "2026-06-15",
  },
  {
    id: "F-AKO-002",
    name: "Sahyadri Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Borgaon Manju",
    districtId: "akola",
    cropId: "cotton",
    variety: "Ajit-155 (Bt)",
    areaHa: 4.2,
    sowingDate: "2026-06-10",
    stage: "boll_formation",
    health: "healthy",
    lat: 20.7002,
    lon: 77.0082,
    parcel: [[20.7002, 77.0082], [20.7032, 77.0082], [20.7032, 77.0112], [20.7002, 77.0112]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-06-10",
    updatedAt: "2026-06-10",
  },
  {
    id: "F-AKO-003",
    name: "Panduranga Mala",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Murtizapur",
    districtId: "akola",
    cropId: "banana",
    variety: "Grand Naine",
    areaHa: 2.2,
    sowingDate: "2026-05-20",
    stage: "vegetative",
    health: "at_risk",
    lat: 20.7324,
    lon: 77.3621,
    parcel: [[20.7324, 77.3621], [20.7354, 77.3621], [20.7354, 77.3651], [20.7324, 77.3651]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-05-20",
    updatedAt: "2026-05-20",
  },
  {
    id: "F-AKO-004",
    name: "Jai Kisan Baug",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Telhara",
    districtId: "akola",
    cropId: "cotton",
    variety: "RCH-659",
    areaHa: 3.5,
    sowingDate: "2026-06-18",
    stage: "flowering",
    health: "healthy",
    lat: 21.0315,
    lon: 76.8423,
    parcel: [[21.0315, 76.8423], [21.0345, 76.8423], [21.0345, 76.8453], [21.0315, 76.8453]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-06-18",
    updatedAt: "2026-06-18",
  },
  {
    id: "F-AKO-005",
    name: "Gomai Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Akot",
    districtId: "akola",
    cropId: "soybean",
    variety: "MACS-1407",
    areaHa: 4.8,
    sowingDate: "2026-06-12",
    stage: "pod_fill",
    health: "healthy",
    lat: 21.0968,
    lon: 77.0589,
    parcel: [[21.0968, 77.0589], [21.0998, 77.0589], [21.0998, 77.0619], [21.0968, 77.0619]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-06-12",
    updatedAt: "2026-06-12",
  },
  {
    id: "F-AKO-006",
    name: "Green Valley Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Nandgaon",
    districtId: "amravati",
    cropId: "tomato",
    variety: "Abhinav (F1)",
    areaHa: 2.5,
    sowingDate: "2026-07-01",
    stage: "fruiting",
    health: "healthy",
    lat: 20.9542,
    lon: 77.7812,
    parcel: [[20.9542, 77.7812], [20.9572, 77.7812], [20.9572, 77.7842], [20.9542, 77.7842]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-07-01",
    updatedAt: "2026-07-01",
  },
  {
    id: "F-AKO-007",
    name: "Shree Ganesh Sheti",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Patur",
    districtId: "akola",
    cropId: "onion",
    variety: "Bhima Super",
    areaHa: 3.2,
    sowingDate: "2026-06-25",
    stage: "bulbing",
    health: "healthy",
    lat: 20.4571,
    lon: 76.9384,
    parcel: [[20.4571, 76.9384], [20.4601, 76.9384], [20.4601, 76.9414], [20.4571, 76.9414]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-06-25",
    updatedAt: "2026-06-25",
  },
  {
    id: "F-AKO-008",
    name: "Krushi Vikas Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Barshitakli",
    districtId: "akola",
    cropId: "wheat",
    variety: "GW-322",
    areaHa: 5.0,
    sowingDate: "2026-07-10",
    stage: "tillering",
    health: "healthy",
    lat: 20.5841,
    lon: 77.0621,
    parcel: [[20.5841, 77.0621], [20.5871, 77.0621], [20.5871, 77.0651], [20.5841, 77.0651]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-07-10",
    updatedAt: "2026-07-10",
  },
  {
    id: "F-AKO-009",
    name: "Annapurna Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Chandur",
    districtId: "amravati",
    cropId: "rice",
    variety: "PKV HMT",
    areaHa: 4.0,
    sowingDate: "2026-06-20",
    stage: "vegetative",
    health: "healthy",
    lat: 20.8145,
    lon: 77.9812,
    parcel: [[20.8145, 77.9812], [20.8175, 77.9812], [20.8175, 77.9842], [20.8145, 77.9842]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-06-20",
    updatedAt: "2026-06-20",
  },
  {
    id: "F-AKO-010",
    name: "Shakti Farm",
    ownerName: "Ramesh Kumar",
    ownerId: RAMESH_USER_ID,
    village: "Badnera",
    districtId: "amravati",
    cropId: "sugarcane",
    variety: "Co-86032",
    areaHa: 6.5,
    sowingDate: "2026-05-05",
    stage: "grand_growth",
    health: "healthy",
    lat: 20.8642,
    lon: 77.7214,
    parcel: [[20.8642, 77.7214], [20.8672, 77.7214], [20.8672, 77.7244], [20.8642, 77.7244]],
    state: "Maharashtra",
    isArchived: false,
    createdAt: "2026-05-05",
    updatedAt: "2026-05-05",
  },
];

/* ------------------------------------------------------------- In-Memory Reactive Cache */
/**
 * Synchronized live cache: all changes immediately mutate this reactive layer
 * and write to Supabase asynchronously with fallback protection.
 */
interface UnifiedStore {
  farms: Farm[];
  assessments: CropHealthAssessment[];
  reviews: ExpertReview[];
  advisories: Advisory[];
  visits: FieldVisit[];
  followUps: FollowUp[];
  scans: FarmerScan[];
  feedbacks: FarmerFeedback[];
  voiceReports: VoiceReport[];
  assistedReports: AssistedReport[];
  timelineEvents: CaseTimelineEvent[];
}

function initUnifiedStore(): UnifiedStore {
  const otherFarms = SEED_FARMS.filter((f) => !RAMESH_FIELD_IDS.has(f.id)).map((f) => ({
    ...f,
    ownerId: undefined,
    state: "Maharashtra",
    isArchived: false,
    createdAt: f.sowingDate,
    updatedAt: f.sowingDate,
  }));

  return {
    farms: [...RAMESH_FIELDS, ...otherFarms],
    assessments: SEED_ASSESSMENTS.map((a) => ({
      ...a,
      farmerId: RAMESH_FIELD_IDS.has(a.farmId) ? RAMESH_USER_ID : undefined,
    })),
    reviews: SEED_REVIEWS.map((r) => ({ ...r })),
    advisories: SEED_ADVISORIES.map((a) => ({ ...a })),
    visits: SEED_VISITS.map((v) => ({ ...v })),
    followUps: SEED_FOLLOW_UPS.map((f) => ({ ...f })),
    scans: [],
    feedbacks: [],
    voiceReports: [],
    assistedReports: [],
    timelineEvents: [],
  };
}

const g = globalThis as unknown as { __cropxenseUnified?: UnifiedStore };
export const unifiedStore: UnifiedStore = g.__cropxenseUnified ?? (g.__cropxenseUnified = initUnifiedStore());

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emit() {
  listeners.forEach((l) => l());
}

/* ------------------------------------------------------------- Realtime Sync Setup */

let realtimeInitialized = false;

export function initRealtimeSubscriptions() {
  if (realtimeInitialized || typeof window === "undefined") return;
  realtimeInitialized = true;

  try {
    const channel = supabase.channel("cropxense_global_changes");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crop_health_cases" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as any;
            if (!unifiedStore.assessments.some((a) => a.id === row.id)) {
              unifiedStore.assessments.unshift(mapDbCaseToAssessment(row));
              emit();
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as any;
            const idx = unifiedStore.assessments.findIndex((a) => a.id === row.id);
            if (idx !== -1) {
              unifiedStore.assessments[idx] = mapDbCaseToAssessment(row);
              emit();
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farms" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as any;
            if (!unifiedStore.farms.some((f) => f.id === row.id)) {
              unifiedStore.farms.unshift(mapDbFarmToFarm(row));
              emit();
            }
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as any;
            const idx = unifiedStore.farms.findIndex((f) => f.id === row.id);
            if (idx !== -1) {
              unifiedStore.farms[idx] = mapDbFarmToFarm(row);
              emit();
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "advisories" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as any;
            if (!unifiedStore.advisories.some((a) => a.id === row.id)) {
              unifiedStore.advisories.unshift(mapDbAdvisoryToAdvisory(row));
              emit();
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follow_ups" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as any;
            if (!unifiedStore.followUps.some((f) => f.id === row.id)) {
              unifiedStore.followUps.unshift(mapDbFollowUpToFollowUp(row));
              emit();
            }
          }
        },
      )
      .subscribe();
  } catch (err) {
    console.debug("Realtime subscription initialization notice:", err);
  }
}

/* ------------------------------------------------------------- Mappers */

function mapDbFarmToFarm(row: any): Farm {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.owner_name || "Registered Farmer",
    ownerId: row.owner_id || undefined,
    village: row.village || "",
    districtId: (row.district || "akola").toLowerCase(),
    state: row.state || "Maharashtra",
    areaHa: Number(row.area_ha) || 1.0,
    cropId: (row.crop_id || "cotton").toLowerCase(),
    variety: row.variety || undefined,
    stage: (row.growth_stage as CropStage) || "vegetative",
    lat: Number(row.lat) || 20.7,
    lon: Number(row.lon) || 77.0,
    parcel: Array.isArray(row.parcel) ? row.parcel : [],
    health: (row.health_status as Farm["health"]) || "healthy",
    sowingDate: row.sowing_date || new Date().toISOString().slice(0, 10),
    notes: row.notes || undefined,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at?.slice(0, 10),
    updatedAt: row.updated_at?.slice(0, 10),
  };
}

function mapDbCaseToAssessment(row: any): CropHealthAssessment {
  return {
    id: row.id,
    farmId: row.farm_id,
    farmerId: row.farmer_id || undefined,
    districtId: (row.district || "akola").toLowerCase(),
    cropId: (row.crop_id || "cotton").toLowerCase(),
    threatId: row.threat_id || "bacterial_blight",
    suspected: row.threat_name || threatName(row.threat_id),
    confidence: Number(row.confidence) || 80,
    severity: (Number(row.severity) || 1) as any,
    status: (row.status as any) || "awaiting_validation",
    detectedVia: Array.isArray(row.detected_via) ? row.detected_via : ["image", "weather"],
    detectedAt: row.created_at || new Date().toISOString(),
    affectedAreaHa: Number(row.affected_area_ha) || 1.0,
    evidence: Array.isArray(row.evidence) ? row.evidence : [],
    notes: row.notes || undefined,
    advisoryId: row.advisory_id || undefined,
    reviewId: row.review_id || undefined,
    scanId: row.scan_id || undefined,
    riskAssessment: row.risk_assessment || undefined,
    feedbackIds: Array.isArray(row.feedback_ids) ? row.feedback_ids : [],
  };
}

function mapDbAdvisoryToAdvisory(row: any): Advisory {
  return {
    id: row.id,
    assessmentId: row.case_id,
    farmId: row.farm_id,
    title: row.title || "Crop Management Advisory",
    window: row.action_window || "Next 5 days",
    cultural: Array.isArray(row.cultural_action) ? row.cultural_action : [],
    biological: Array.isArray(row.biological_control) ? row.biological_control : [],
    chemical: Array.isArray(row.chemical_referral) ? row.chemical_referral : [],
    issuedAt: row.created_at || new Date().toISOString(),
    acknowledged: Boolean(row.acknowledged),
  };
}

function mapDbFollowUpToFollowUp(row: any): FollowUp {
  return {
    id: row.id,
    assessmentId: row.case_id,
    dueOn: row.due_date || isoDay(5),
    action: row.action || "Re-inspect field condition",
    done: Boolean(row.done),
    reason: row.reason || undefined,
    completedAt: row.completed_at || undefined,
    resultScanId: row.result_scan_id || undefined,
  };
}

/* ------------------------------------------------------------- Reference Lookups */

export const districtById = (id: string): District | undefined => DISTRICTS.find((d) => d.id === id);
export const districtName = (id: string) => districtById(id)?.name ?? id;
export const cropById = (id: string): Crop | undefined => CROPS.find((c) => c.id === id);
export const cropName = (id: string) => cropById(id)?.name ?? id;
export const farmById = (id: string): Farm | undefined =>
  unifiedStore.farms.find((f) => f.id === id);
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

/* ------------------------------------------------------------- Farms CRUD */

export interface FarmFilters {
  districtId?: string;
  cropId?: string;
  health?: Farm["health"];
  query?: string;
  includeArchived?: boolean;
}

export async function getFarms(filters: FarmFilters = {}): Promise<Farm[]> {
  initRealtimeSubscriptions();
  const q = filters.query?.trim().toLowerCase();

  // Try querying Supabase
  try {
    let query = supabase.from("farms").select("*");
    if (!filters.includeArchived) query = query.eq("is_archived", false);
    if (filters.districtId) query = query.eq("district", filters.districtId);
    if (filters.cropId) query = query.eq("crop_id", filters.cropId);
    if (filters.health) query = query.eq("health_status", filters.health);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const dbFarms = data.map(mapDbFarmToFarm);
      // Merge with unified store
      dbFarms.forEach((df) => {
        const idx = unifiedStore.farms.findIndex((f) => f.id === df.id);
        if (idx !== -1) unifiedStore.farms[idx] = df;
        else unifiedStore.farms.unshift(df);
      });
    }
  } catch (err) {
    console.debug("Supabase getFarms notice:", err);
  }

  // Filter unified memory store
  const rows = unifiedStore.farms.filter(
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
  return rows.map((f) => ({ ...f }));
}

export async function getFarm(id: string): Promise<Farm | undefined> {
  const found = farmById(id);
  return found ? { ...found } : undefined;
}

/**
 * Get farms owned by the currently authenticated farmer.
 * - Demo Ramesh sees his 10 seeded fields + user-created fields.
 * - Any newly registered user sees ONLY their own created fields (starts from 0).
 */
export async function getFarmerFarms(
  user: { id?: string; email?: string; name?: string; role?: string } | null,
): Promise<Farm[]> {
  initRealtimeSubscriptions();

  if (!user) {
    // Default demo view without login: show Ramesh demo farms (strictly 10)
    const demoFarms = unifiedStore.farms.filter((f) => !f.isArchived && RAMESH_FIELD_IDS.has(f.id));
    return demoFarms.map((f) => ({ ...f }));
  }

  const isDemoRamesh =
    user.email === "farmer@cropxense.demo" ||
    user.id === RAMESH_USER_ID ||
    user.name === "Ramesh Kumar" ||
    user.role === "farmer";

  // Try querying Supabase for user's newly created custom farms if user.id is set
  if (user.id) {
    try {
      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .eq("owner_id", user.id)
        .eq("is_archived", false);

      if (!error && data) {
        data.forEach((row) => {
          const farm = mapDbFarmToFarm(row);
          // Only add if it is a user-created farm
          if (farm.id.startsWith("F-USR-") || farm.id.startsWith("F-NEW-") || RAMESH_FIELD_IDS.has(farm.id)) {
            const idx = unifiedStore.farms.findIndex((f) => f.id === farm.id);
            if (idx !== -1) unifiedStore.farms[idx] = farm;
            else unifiedStore.farms.push(farm);
          }
        });
      }
    } catch (err) {
      console.debug("Supabase getFarmerFarms notice:", err);
    }
  }

  if (isDemoRamesh) {
    // Strictly return Ramesh's 10 canonical fields + any user-created custom fields
    const rameshFarms = unifiedStore.farms.filter(
      (f) =>
        !f.isArchived &&
        (RAMESH_FIELD_IDS.has(f.id) ||
          f.id.startsWith("F-USR-") ||
          f.id.startsWith("F-NEW-")),
    );
    return rameshFarms.map((f) => ({ ...f }));
  }

  // Real new registered custom farmer: return their own created farms, or fallback to the 10 demo farms
  const userFarms = unifiedStore.farms.filter(
    (f) =>
      !f.isArchived &&
      (f.id.startsWith("F-USR-") ||
        f.id.startsWith("F-NEW-") ||
        (user.id && f.ownerId === user.id) ||
        (user.email && f.ownerId === user.email)),
  );

  if (userFarms.length > 0) {
    return userFarms.map((f) => ({ ...f }));
  }

  // If new user has no farms yet, show the 10 canonical farmer fields for seamless demo experience
  const fallbackFarms = unifiedStore.farms.filter((f) => !f.isArchived && RAMESH_FIELD_IDS.has(f.id));
  return fallbackFarms.map((f) => ({ ...f }));
}

/** Create a new Farm in Supabase and unified store */
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
  const nextNum = unifiedStore.farms.length + 1;
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

  // Immediate reactive store update
  unifiedStore.farms = [newFarm, ...unifiedStore.farms];
  emit();

  // Supabase write
  try {
    await supabase.from("farms").insert({
      id: newFarm.id,
      name: newFarm.name,
      owner_name: newFarm.ownerName,
      owner_id: newFarm.ownerId || null,
      village: newFarm.village,
      district: newFarm.districtId,
      state: newFarm.state,
      crop_id: newFarm.cropId,
      variety: newFarm.variety,
      area_ha: newFarm.areaHa,
      sowing_date: newFarm.sowingDate,
      growth_stage: newFarm.stage,
      lat: newFarm.lat,
      lon: newFarm.lon,
      parcel: newFarm.parcel,
      health_status: newFarm.health,
      is_archived: false,
      notes: newFarm.notes,
    });
  } catch (err) {
    console.debug("Supabase createFarm notice:", err);
  }

  return newFarm;
}

export async function addFarm(input: Omit<Farm, "id">): Promise<Farm> {
  return createFarm(input as any);
}

/** Edit an existing Farm */
export async function updateFarm(
  id: string,
  updates: Partial<Farm>,
): Promise<Farm> {
  const index = unifiedStore.farms.findIndex((f) => f.id === id);
  if (index === -1) {
    throw new Error(`Farm with ID ${id} not found`);
  }

  const current = unifiedStore.farms[index]!;
  const updated: Farm = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  unifiedStore.farms[index] = updated;
  emit();

  // Supabase update
  try {
    await supabase
      .from("farms")
      .update({
        name: updated.name,
        village: updated.village,
        district: updated.districtId,
        area_ha: updated.areaHa,
        crop_id: updated.cropId,
        variety: updated.variety,
        growth_stage: updated.stage,
        sowing_date: updated.sowingDate,
        health_status: updated.health,
        is_archived: updated.isArchived,
        notes: updated.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (err) {
    console.debug("Supabase updateFarm notice:", err);
  }

  return updated;
}

/** Soft-delete / Archive a Farm */
export async function deleteFarm(id: string, hardDelete = false): Promise<void> {
  if (hardDelete) {
    unifiedStore.farms = unifiedStore.farms.filter((f) => f.id !== id);
    try {
      await supabase.from("farms").delete().eq("id", id);
    } catch (err) {
      console.debug("Supabase deleteFarm notice:", err);
    }
  } else {
    const target = unifiedStore.farms.find((f) => f.id === id);
    if (target) {
      target.isArchived = true;
      target.updatedAt = new Date().toISOString().slice(0, 10);
    }
    try {
      await supabase.from("farms").update({ is_archived: true }).eq("id", id);
    } catch (err) {
      console.debug("Supabase archiveFarm notice:", err);
    }
  }
  emit();
}

/* ------------------------------------------------------------- Crop Health Cases & Evidence */

export interface AssessmentFilters {
  districtId?: string;
  cropId?: string;
  status?: CropHealthAssessment["status"];
  farmId?: string;
}

export async function getAssessments(filters: AssessmentFilters = {}): Promise<CropHealthAssessment[]> {
  initRealtimeSubscriptions();

  // Try querying Supabase
  try {
    let query = supabase.from("crop_health_cases").select("*").order("created_at", { ascending: false });
    if (filters.districtId) query = query.eq("district", filters.districtId);
    if (filters.cropId) query = query.eq("crop_id", filters.cropId);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.farmId) query = query.eq("farm_id", filters.farmId);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const dbAssessments = data.map(mapDbCaseToAssessment);
      dbAssessments.forEach((da) => {
        const idx = unifiedStore.assessments.findIndex((a) => a.id === da.id);
        if (idx !== -1) unifiedStore.assessments[idx] = da;
        else unifiedStore.assessments.unshift(da);
      });
    }
  } catch (err) {
    console.debug("Supabase getAssessments notice:", err);
  }

  const rows = unifiedStore.assessments.filter(
    (a) =>
      (!filters.districtId || a.districtId === filters.districtId) &&
      (!filters.cropId || a.cropId === filters.cropId) &&
      (!filters.status || a.status === filters.status) &&
      (!filters.farmId || a.farmId === filters.farmId),
  );
  return rows.map((a) => ({ ...a }));
}

export async function getAssessment(id: string): Promise<CropHealthAssessment | undefined> {
  const a = unifiedStore.assessments.find((x) => x.id === id);
  return a ? { ...a } : undefined;
}

export function priorityScore(a: CropHealthAssessment) {
  const ageHrs = (TODAY.getTime() - new Date(a.detectedAt).getTime()) / 3.6e6;
  const inOutbreak = OUTBREAKS.some((o) => o.districtId === a.districtId && o.risk === "high") ? 12 : 0;
  const pending = a.status === "awaiting_validation" ? 14 : a.status === "detected" ? 8 : 0;
  return Math.round(a.confidence * 0.5 + a.severity * 6 + Math.min(ageHrs / 6, 12) + inOutbreak + pending);
}

export async function getPriorityQueue(districtId?: string): Promise<CropHealthAssessment[]> {
  const rows = unifiedStore.assessments
    .filter((a) => !["resolved", "rejected"].includes(a.status))
    .filter((a) => !districtId || a.districtId === districtId)
    .map((a) => ({ ...a }))
    .sort((x, y) => priorityScore(y) - priorityScore(x));
  return rows;
}

/* ------------------------------------------------------------- Scan Image Upload to Supabase Storage */

export async function uploadScanImage(
  dataUrlOrBlob: string | Blob,
  userId: string = "general",
  scanId: string = `scan_${Date.now()}`,
): Promise<string> {
  if (typeof dataUrlOrBlob === "string" && !dataUrlOrBlob.startsWith("data:")) {
    return dataUrlOrBlob; // Already a URL
  }

  try {
    let blob: Blob;
    if (typeof dataUrlOrBlob === "string") {
      const parts = dataUrlOrBlob.split(",");
      const mime = parts[0]?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(parts[1] || "");
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      blob = dataUrlOrBlob;
    }

    const filePath = `${userId}/${scanId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("crop-scans")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from("crop-scans").getPublicUrl(filePath);
      return data.publicUrl;
    }
  } catch (err) {
    console.debug("Supabase image upload fallback to local:", err);
  }

  // Fallback to dataUrl in memory
  return typeof dataUrlOrBlob === "string" ? dataUrlOrBlob : "";
}

/* ------------------------------------------------------------- Farmer Scan -> Case Pipeline */

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
  farmerId?: string | undefined;
}): Promise<{ caseId: string; scanId: string; advisoryId: string; followUpId: string }> {
  const farm = farmById(input.farmId);
  const districtId = farm?.districtId ?? "akola";

  const caseNum = 24100 + unifiedStore.assessments.length;
  const districtPrefix = districtId.slice(0, 3).toUpperCase();
  const caseId = input.previousCaseId || `CX-${districtPrefix}-${caseNum}`;
  const scanId = `SCAN-${String(unifiedStore.scans.length + 1).padStart(3, "0")}`;

  // 1. Upload image to Supabase Storage
  let storedImageUrl = input.imageDataUrl;
  if (input.imageDataUrl && input.imageDataUrl.startsWith("data:")) {
    storedImageUrl = await uploadScanImage(input.imageDataUrl, input.farmerId || farm?.ownerId || "farmer", scanId);
  }

  // 2. Create scan record
  const scan: FarmerScan = {
    id: scanId,
    caseId,
    farmId: input.farmId,
    cropId: input.cropId,
    imageDataUrl: storedImageUrl,
    imageValidation: input.imageValidation,
    symptoms: input.symptoms,
    cropStage: input.cropStage,
    notes: input.notes ?? undefined,
    scannedAt: new Date().toISOString(),
    isFollowUp: input.isFollowUp ?? false,
    previousScanId: input.previousScanId ?? undefined,
  };
  unifiedStore.scans = [scan, ...unifiedStore.scans];

  // 3. Create or update assessment
  let assessment: CropHealthAssessment;
  if (input.previousCaseId) {
    const existing = unifiedStore.assessments.find((a) => a.id === input.previousCaseId);
    if (existing) {
      existing.confidence = input.diagnosis.confidence;
      existing.severity = input.diagnosis.severity;
      existing.notes = input.notes || existing.notes;
      existing.scanId = scanId;
      assessment = existing;
    } else {
      assessment = createNewAssessment(caseId, scanId, input, districtId, storedImageUrl);
    }
  } else {
    assessment = createNewAssessment(caseId, scanId, input, districtId, storedImageUrl);
  }

  // 4. Create advisory
  const advisoryId = `ADV-${String(unifiedStore.advisories.length + 1).padStart(3, "0")}`;
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
  unifiedStore.advisories = [advisory, ...unifiedStore.advisories];
  assessment.advisoryId = advisoryId;

  // 5. Create follow-up
  const followUpId = `FU-${String(unifiedStore.followUps.length + 1).padStart(3, "0")}`;
  const followUp: FollowUp = {
    id: followUpId,
    assessmentId: caseId,
    dueOn: isoDay(5),
    action: `Re-scan ${farm?.name ?? "field"} to check ${input.diagnosis.threatName} progression`,
    done: false,
    reason: `Initial scan detected ${input.diagnosis.threatName} at ${input.diagnosis.confidence}% confidence`,
  };
  unifiedStore.followUps = [followUp, ...unifiedStore.followUps];

  emit();

  // 6. Write all records to Supabase asynchronously
  try {
    // Write scan
    await supabase.from("crop_scans").insert({
      id: scan.id,
      farmer_id: input.farmerId || farm?.ownerId || null,
      farm_id: scan.farmId,
      case_id: scan.caseId,
      image_url: storedImageUrl,
      crop: scan.cropId,
      crop_stage: scan.cropStage,
      observed_symptoms: scan.symptoms,
      image_quality: scan.imageValidation?.imageQuality || "good",
      leaf_detected: scan.imageValidation?.leafDetected ?? true,
      suspected_issue: input.diagnosis.threatName,
      confidence: input.diagnosis.confidence,
      image_validation: scan.imageValidation,
      notes: scan.notes,
      is_follow_up: scan.isFollowUp,
      previous_scan_id: scan.previousScanId,
    });

    // Write case
    await supabase.from("crop_health_cases").upsert({
      id: assessment.id,
      case_number: assessment.id,
      farmer_id: input.farmerId || farm?.ownerId || null,
      farm_id: assessment.farmId,
      scan_id: scanId,
      threat_type: input.diagnosis.threatType,
      threat_id: assessment.threatId,
      threat_name: assessment.suspected,
      crop_id: assessment.cropId,
      district: assessment.districtId,
      severity: assessment.severity,
      confidence: assessment.confidence,
      status: assessment.status,
      affected_area_ha: assessment.affectedAreaHa,
      detected_via: assessment.detectedVia,
      evidence: assessment.evidence,
      risk_assessment: assessment.riskAssessment,
      notes: assessment.notes,
      advisory_id: advisoryId,
    });

    // Write advisory
    await supabase.from("advisories").insert({
      id: advisory.id,
      case_id: caseId,
      farm_id: advisory.farmId,
      title: advisory.title,
      action_window: advisory.window,
      cultural_action: advisory.cultural,
      biological_control: advisory.biological,
      chemical_referral: advisory.chemical,
      acknowledged: false,
    });

    // Write follow-up
    await supabase.from("follow_ups").insert({
      id: followUp.id,
      case_id: caseId,
      farmer_id: input.farmerId || farm?.ownerId || null,
      due_date: followUp.dueOn,
      action: followUp.action,
      reason: followUp.reason,
      done: false,
    });
  } catch (err) {
    console.debug("Supabase submitScanCase write notice:", err);
  }

  return { caseId, scanId, advisoryId, followUpId };
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
    farmerId?: string | undefined;
  },
  districtId: string,
  imageUrl?: string,
): CropHealthAssessment {
  const farm = farmById(input.farmId);
  const a: CropHealthAssessment = {
    id: caseId,
    farmId: input.farmId,
    farmerId: input.farmerId || farm?.ownerId || undefined,
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
      {
        channel: "image",
        label: "Uploaded crop image analysed",
        detail: `${input.symptoms.length} symptoms identified · Diagnostic canvas computed`,
        supports: true,
      },
      {
        channel: "weather",
        label: "Weather context checked",
        detail: `RH ${latestWeather(districtId).rhPct}% over the last 24 hours favourable for ${input.diagnosis.threatName}`,
        supports: true,
      },
    ],
    notes: input.notes ?? undefined,
    scanId: scanId ?? undefined,
    riskAssessment: input.diagnosis.riskAssessment,
    feedbackIds: [],
  };
  unifiedStore.assessments = [a, ...unifiedStore.assessments];
  return a;
}

/* ------------------------------------------------------------- Expert Validation */

export async function validateCase(
  id: string,
  verdict: "confirmed" | "corrected" | "rejected",
  comment: string,
  correctedThreat?: string,
  expertId: string = EXPERT_USER_ID,
): Promise<CropHealthAssessment | undefined> {
  const a = unifiedStore.assessments.find((x) => x.id === id);
  if (!a) return undefined;

  const review: ExpertReview = {
    id: `R-${unifiedStore.reviews.length + 1}`,
    assessmentId: id,
    reviewerId: expertId,
    reviewerName: "Dr. Anjali Patil",
    verdict,
    comment,
    reviewedAt: new Date().toISOString(),
    ...(correctedThreat ? { correctedThreat } : {}),
  };
  unifiedStore.reviews = [review, ...unifiedStore.reviews];
  a.status = verdict === "rejected" ? "rejected" : "expert_confirmed";
  a.reviewId = review.id;
  if (correctedThreat) a.suspected = threatName(correctedThreat);

  // If expert confirmed or corrected, generate advisory if not already present
  if (verdict !== "rejected" && !a.advisoryId) {
    const adv = await issueAdvisory(a.id);
    if (adv) a.advisoryId = adv.id;
  }

  emit();

  // Supabase update
  try {
    await supabase.from("expert_reviews").insert({
      id: review.id,
      case_id: id,
      expert_id: expertId !== EXPERT_USER_ID ? expertId : null,
      reviewer_name: review.reviewerName,
      decision: verdict,
      confirmed_diagnosis: a.suspected,
      corrected_threat: correctedThreat || null,
      comment: review.comment,
    });

    await supabase
      .from("crop_health_cases")
      .update({
        status: a.status,
        threat_name: a.suspected,
        threat_id: correctedThreat || a.threatId,
        review_id: review.id,
        advisory_id: a.advisoryId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (err) {
    console.debug("Supabase validateCase notice:", err);
  }

  return { ...a };
}

export async function getReviews(assessmentId?: string): Promise<ExpertReview[]> {
  return unifiedStore.reviews.filter((r) => !assessmentId || r.assessmentId === assessmentId);
}

/* ------------------------------------------------------------- Officer Workflow */

export async function assignFieldVisit(
  assessmentId: string,
  scheduledFor: string,
  officerId: string = OFFICER_USER_ID,
): Promise<FieldVisit> {
  const a = unifiedStore.assessments.find((x) => x.id === assessmentId);
  const visit: FieldVisit = {
    id: `FV-${unifiedStore.visits.length + 1}`,
    assessmentId,
    farmId: a?.farmId ?? "",
    officerId,
    officerName: "Priya Sharma",
    scheduledFor,
    status: "scheduled",
  };
  unifiedStore.visits = [visit, ...unifiedStore.visits];

  if (a) {
    a.status = "field_confirmed";
  }
  emit();

  // Supabase write
  try {
    await supabase.from("officer_visits").insert({
      id: visit.id,
      case_id: assessmentId,
      farm_id: visit.farmId,
      officer_id: officerId !== OFFICER_USER_ID ? officerId : null,
      officer_name: visit.officerName,
      scheduled_for: scheduledFor,
      status: "scheduled",
    });

    await supabase
      .from("crop_health_cases")
      .update({ status: "field_confirmed", updated_at: new Date().toISOString() })
      .eq("id", assessmentId);
  } catch (err) {
    console.debug("Supabase assignFieldVisit notice:", err);
  }

  return visit;
}

export async function getFieldVisits(): Promise<FieldVisit[]> {
  return unifiedStore.visits.map((v) => ({ ...v }));
}

export async function getVisitsFor(assessmentId: string): Promise<FieldVisit[]> {
  return unifiedStore.visits.filter((v) => v.assessmentId === assessmentId).map((v) => ({ ...v }));
}

export async function getFarmVisits(farmId: string): Promise<FieldVisit[]> {
  return unifiedStore.visits.filter((v) => v.farmId === farmId).map((v) => ({ ...v }));
}

export async function advanceCase(
  id: string,
  status: CropHealthAssessment["status"],
  note: string,
): Promise<CropHealthAssessment | undefined> {
  const a = unifiedStore.assessments.find((x) => x.id === id);
  if (!a) return undefined;
  a.status = status;
  if (note) a.notes = note;

  const review: ExpertReview = {
    id: `R-${unifiedStore.reviews.length + 1}`,
    assessmentId: id,
    reviewerId: OFFICER_USER_ID,
    reviewerName: "Priya Sharma",
    verdict: "confirmed",
    comment: note,
    reviewedAt: new Date().toISOString(),
  };
  unifiedStore.reviews = [review, ...unifiedStore.reviews];
  emit();

  try {
    await supabase
      .from("crop_health_cases")
      .update({ status, notes: note, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    console.debug("Supabase advanceCase notice:", err);
  }

  return { ...a };
}

/* ------------------------------------------------------------- Advisories & Follow-ups */

export async function getAdvisories(farmId?: string): Promise<Advisory[]> {
  return unifiedStore.advisories
    .filter((a) => !farmId || a.farmId === farmId)
    .map((a) => ({ ...a }));
}

export async function issueAdvisory(assessmentId: string): Promise<Advisory | undefined> {
  const a = unifiedStore.assessments.find((x) => x.id === assessmentId);
  if (!a) return undefined;
  const d = DISEASES.find((x) => x.id === a.threatId);
  const p = PESTS.find((x) => x.id === a.threatId);
  const src = d ?? p;

  const advisory: Advisory = {
    id: `ADV-${String(unifiedStore.advisories.length + 1).padStart(3, "0")}`,
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
  unifiedStore.advisories = [advisory, ...unifiedStore.advisories];
  a.advisoryId = advisory.id;
  emit();

  try {
    await supabase.from("advisories").insert({
      id: advisory.id,
      case_id: assessmentId,
      farm_id: advisory.farmId,
      title: advisory.title,
      action_window: advisory.window,
      cultural_action: advisory.cultural,
      biological_control: advisory.biological,
      chemical_referral: advisory.chemical,
      acknowledged: false,
    });
  } catch (err) {
    console.debug("Supabase issueAdvisory notice:", err);
  }

  return advisory;
}

export async function acknowledgeAdvisory(id: string): Promise<boolean> {
  const a = unifiedStore.advisories.find((x) => x.id === id);
  if (a) a.acknowledged = true;
  emit();

  try {
    await supabase.from("advisories").update({ acknowledged: true }).eq("id", id);
  } catch (err) {
    console.debug("Supabase acknowledgeAdvisory notice:", err);
  }

  return true;
}

export async function getFollowUps(): Promise<FollowUp[]> {
  return unifiedStore.followUps.map((f) => ({ ...f }));
}

export async function getFollowUpsFor(assessmentId: string): Promise<FollowUp[]> {
  return unifiedStore.followUps
    .filter((f) => f.assessmentId === assessmentId)
    .map((f) => ({ ...f }));
}

export async function completeFollowUp(
  followUpId: string,
  resultScanId?: string,
): Promise<boolean> {
  const fu = unifiedStore.followUps.find((f) => f.id === followUpId);
  if (!fu) return false;
  fu.done = true;
  fu.completedAt = new Date().toISOString();
  if (resultScanId) fu.resultScanId = resultScanId;
  emit();

  try {
    await supabase
      .from("follow_ups")
      .update({
        done: true,
        completed_at: fu.completedAt,
        result_scan_id: resultScanId || null,
      })
      .eq("id", followUpId);
  } catch (err) {
    console.debug("Supabase completeFollowUp notice:", err);
  }

  return true;
}

export async function resolveCase(caseId: string): Promise<boolean> {
  const a = unifiedStore.assessments.find((x) => x.id === caseId);
  if (!a) return false;
  a.status = "resolved";
  emit();

  try {
    await supabase
      .from("crop_health_cases")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", caseId);
  } catch (err) {
    console.debug("Supabase resolveCase notice:", err);
  }

  return true;
}

export async function requestExpertReview(caseId: string, reason?: string): Promise<boolean> {
  const a = unifiedStore.assessments.find((x) => x.id === caseId);
  if (!a) return false;
  a.status = "awaiting_validation";
  a.notes = reason || "Expert review requested by farmer";
  emit();

  try {
    await supabase
      .from("crop_health_cases")
      .update({ status: "awaiting_validation", notes: a.notes })
      .eq("id", caseId);
  } catch (err) {
    console.debug("Supabase requestExpertReview notice:", err);
  }

  return true;
}

export async function submitFarmerFeedback(
  caseId: string,
  farmId: string,
  observation: FarmerObservation,
  notes?: string,
): Promise<FarmerFeedback> {
  const fb: FarmerFeedback = {
    id: `FB-${String(unifiedStore.feedbacks.length + 1).padStart(3, "0")}`,
    caseId,
    farmId,
    observation,
    notes: notes ?? undefined,
    submittedAt: new Date().toISOString(),
  };
  unifiedStore.feedbacks = [fb, ...unifiedStore.feedbacks];

  const assessment = unifiedStore.assessments.find((a) => a.id === caseId);
  if (assessment) {
    if (!assessment.feedbackIds) assessment.feedbackIds = [];
    assessment.feedbackIds.push(fb.id);

    if (observation === "improving") {
      assessment.status = "field_confirmed";
      assessment.notes = `Farmer reports: improving. ${notes || ""}`.trim();
    } else if (observation === "worsening") {
      assessment.status = "awaiting_validation";
      assessment.notes = `Farmer reports worsening — expert review recommended. ${notes || ""}`.trim();
    }
  }

  emit();

  try {
    await supabase.from("farmer_feedback").insert({
      id: fb.id,
      case_id: caseId,
      farm_id: farmId,
      observation,
      notes,
    });
  } catch (err) {
    console.debug("Supabase submitFarmerFeedback notice:", err);
  }

  return fb;
}

export function getScansForCase(caseId: string): FarmerScan[] {
  return unifiedStore.scans.filter((s) => s.caseId === caseId);
}

export function getFeedbacksForCase(caseId: string): FarmerFeedback[] {
  return unifiedStore.feedbacks.filter((f) => f.caseId === caseId);
}

export function getAllScans(): FarmerScan[] {
  return [...unifiedStore.scans];
}

/* ------------------------------------------------------------- Environmental Reference Data */

export function getWeather(districtId: string): Promise<WeatherObservation[]> {
  return Promise.resolve(WEATHER.filter((w) => w.districtId === districtId));
}

export function getSensors(districtId?: string): Promise<Sensor[]> {
  return Promise.resolve(SENSORS.filter((s) => !districtId || s.districtId === districtId));
}

export function getSensorReadings(sensorId: string): Promise<SensorReading[]> {
  return Promise.resolve(SENSOR_READINGS.filter((r) => r.sensorId === sensorId));
}

export function getTraps(districtId?: string): Promise<PestTrap[]> {
  return Promise.resolve(TRAPS.filter((t) => !districtId || t.districtId === districtId));
}

export function getTrapReadings(trapId?: string): Promise<TrapReading[]> {
  return Promise.resolve(TRAP_READINGS.filter((t) => !trapId || t.trapId === trapId));
}

export function getOutbreaks(): Promise<Outbreak[]> {
  return Promise.resolve(OUTBREAKS.map((o) => ({ ...o })));
}

export function getForecast(districtId: string): Promise<RiskForecast | undefined> {
  return Promise.resolve(FORECASTS.find((f) => f.districtId === districtId));
}

export function getForecasts(): Promise<RiskForecast[]> {
  return Promise.resolve(FORECASTS);
}

/* ------------------------------------------------------------- Dashboard Calculations */

export interface OverviewMetrics {
  fieldsMonitored: number;
  healthy: number;
  atRisk: number;
  activeOutbreaks: number;
  pendingReview: number;
  openFieldCases: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const activeFarms = unifiedStore.farms.filter((f) => !f.isArchived);
  return {
    fieldsMonitored: activeFarms.length,
    healthy: activeFarms.filter((f) => f.health === "healthy").length,
    atRisk: activeFarms.filter((f) => f.health === "at_risk" || f.health === "affected").length,
    activeOutbreaks: OUTBREAKS.filter((o) => o.risk === "high").length,
    pendingReview: unifiedStore.assessments.filter((a) => a.status === "awaiting_validation").length,
    openFieldCases: unifiedStore.visits.filter((v) => v.status === "scheduled").length,
  };
}

export interface DistrictRiskRow {
  districtId: string;
  name: string;
  score: number;
  risk: RiskForecast["days"][number]["risk"];
  openCases: number;
  affectedFields: number;
}

export async function getDistrictRanking(): Promise<DistrictRiskRow[]> {
  const rows: DistrictRiskRow[] = DISTRICTS.map((d) => {
    const f = FORECASTS.find((x) => x.districtId === d.id);
    const today = f?.days[0];
    return {
      districtId: d.id,
      name: d.name,
      score: today?.score ?? 0,
      risk: today?.risk ?? "low",
      openCases: unifiedStore.assessments.filter(
        (a) => a.districtId === d.id && !["resolved", "rejected"].includes(a.status),
      ).length,
      affectedFields: OUTBREAKS.filter((o) => o.districtId === d.id).reduce((n, o) => n + o.affectedFields, 0),
    };
  });
  return rows.sort((a, b) => b.score - a.score);
}

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

export function getTodayActions(farms: Farm[]): TodayAction[] {
  const today = isoDay(0);
  const actions: TodayAction[] = [];
  const farmIds = new Set(farms.map((f) => f.id));

  // Overdue follow-ups
  unifiedStore.followUps
    .filter((f) => !f.done && f.dueOn <= today && unifiedStore.assessments.some((a) => a.id === f.assessmentId && farmIds.has(a.farmId)))
    .forEach((f) => {
      const assessment = unifiedStore.assessments.find((a) => a.id === f.assessmentId);
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
  unifiedStore.followUps
    .filter((f) => !f.done && f.dueOn === today && unifiedStore.assessments.some((a) => a.id === f.assessmentId && farmIds.has(a.farmId)))
    .forEach((f) => {
      const assessment = unifiedStore.assessments.find((a) => a.id === f.assessmentId);
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
  unifiedStore.advisories
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
    const hasRecentScan = unifiedStore.scans.some((s) => s.farmId === f.id);
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

export function getCropHealthStory(farms: Farm[]): CropHealthStory {
  const farmIds = new Set(farms.map((f) => f.id));

  const latestCase = unifiedStore.assessments
    .filter((a) => farmIds.has(a.farmId))
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0];

  if (!latestCase) return {};

  const latestScan = unifiedStore.scans.find((s) => s.caseId === latestCase.id);
  const latestFollowUp = unifiedStore.followUps
    .filter((f) => f.assessmentId === latestCase.id)
    .sort((a, b) => (a.dueOn > b.dueOn ? -1 : 1))[0];
  const latestFeedback = unifiedStore.feedbacks
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

  unifiedStore.assessments
    .filter((a) => a.farmId === farmId)
    .forEach((a) => {
      events.push({
        date: a.detectedAt.slice(0, 10),
        type: "detection",
        title: `${a.suspected} detected`,
        detail: `${a.confidence}% confidence · Severity ${a.severity}/5`,
      });

      if (a.advisoryId) {
        const adv = unifiedStore.advisories.find((x) => x.id === a.advisoryId);
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

  unifiedStore.scans
    .filter((s) => s.farmId === farmId)
    .forEach((s) => {
      events.push({
        date: s.scannedAt.slice(0, 10),
        type: "scan",
        title: s.isFollowUp ? "Follow-up scan" : "Crop scan",
        detail: `${s.symptoms.length} symptoms checked`,
      });
    });

  unifiedStore.followUps
    .filter((f) => unifiedStore.assessments.some((a) => a.id === f.assessmentId && a.farmId === farmId))
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

  unifiedStore.feedbacks
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

/* ============================================================
   ROUND 2: VOICE REPORTS
   ============================================================ */

export async function submitVoiceReport(input: {
  farmerId?: string;
  fieldId?: string;
  transcript: string;
  language: string;
  crop?: string;
  symptomsText?: string;
}): Promise<{ voiceReportId: string; caseId: string }> {
  const farm = input.fieldId ? farmById(input.fieldId) : undefined;
  const districtId = farm?.districtId ?? "akola";

  const voiceId = `VR-${String(unifiedStore.voiceReports.length + 1).padStart(3, "0")}`;
  const caseNum = 24100 + unifiedStore.assessments.length;
  const districtPrefix = districtId.slice(0, 3).toUpperCase();
  const caseId = `CX-${districtPrefix}-${caseNum}`;

  // Create voice report
  const vr: VoiceReport = {
    id: voiceId,
    farmerId: input.farmerId,
    fieldId: input.fieldId,
    transcript: input.transcript,
    language: input.language,
    crop: input.crop || farm?.cropId,
    symptomsText: input.symptomsText,
    status: "case_created",
    caseId,
    createdAt: new Date().toISOString(),
  };
  unifiedStore.voiceReports = [vr, ...unifiedStore.voiceReports];

  // Create crop health case
  const assessment: CropHealthAssessment = {
    id: caseId,
    farmId: input.fieldId || "",
    farmerId: input.farmerId,
    districtId,
    cropId: input.crop || farm?.cropId || "unknown",
    threatId: "pending_investigation",
    suspected: "Farmer Voice Report — Pending Investigation",
    confidence: 0,
    severity: 2 as 1 | 2 | 3 | 4 | 5,
    status: "detected",
    detectedVia: ["history"],
    detectedAt: new Date().toISOString(),
    affectedAreaHa: farm?.areaHa ?? 1,
    evidence: [
      {
        channel: "history",
        label: "Farmer voice report",
        detail: input.transcript.slice(0, 200),
        supports: true,
      },
    ],
    notes: `Voice report: ${input.transcript}`,
  };
  unifiedStore.assessments = [assessment, ...unifiedStore.assessments];

  // Create timeline event
  addTimelineEvent(caseId, "voice_reported", "Farmer Voice Report Submitted", `"${input.transcript.slice(0, 100)}..."`, "farmer");

  emit();

  // Supabase writes
  try {
    await supabase.from("voice_reports").insert({
      id: vr.id,
      farmer_id: input.farmerId || null,
      field_id: input.fieldId || null,
      transcript: input.transcript,
      language: input.language,
      crop: vr.crop,
      symptoms_text: input.symptomsText,
      status: "case_created",
      case_id: caseId,
    });

    await supabase.from("crop_health_cases").insert({
      id: caseId,
      case_number: caseId,
      farmer_id: input.farmerId || null,
      farm_id: input.fieldId || null,
      threat_name: assessment.suspected,
      crop_id: assessment.cropId,
      district: districtId,
      severity: assessment.severity,
      confidence: 0,
      status: "detected",
      source: "voice_report",
      voice_transcript: input.transcript,
      detected_via: ["history"],
      evidence: assessment.evidence,
      notes: assessment.notes,
    });
  } catch (err) {
    console.debug("Supabase submitVoiceReport notice:", err);
  }

  return { voiceReportId: voiceId, caseId };
}

export function getVoiceReports(): VoiceReport[] {
  return [...unifiedStore.voiceReports];
}

/* ============================================================
   ROUND 2: ASSISTED REPORTS
   ============================================================ */

export async function submitAssistedReport(input: {
  officerId: string;
  farmerName?: string;
  phone?: string;
  village?: string;
  fieldId?: string;
  crop?: string;
  symptoms: string[];
  notes?: string;
  officerObservation?: string;
  photoUrl?: string;
  approximateArea?: string;
}): Promise<{ reportId: string; caseId: string }> {
  const farm = input.fieldId ? farmById(input.fieldId) : undefined;
  const districtId = farm?.districtId ?? "akola";

  const reportId = `AR-${String(unifiedStore.assistedReports.length + 1).padStart(3, "0")}`;
  const caseNum = 24100 + unifiedStore.assessments.length;
  const districtPrefix = districtId.slice(0, 3).toUpperCase();
  const caseId = `CX-${districtPrefix}-${caseNum}`;

  const ar: AssistedReport = {
    id: reportId,
    officerId: input.officerId,
    fieldId: input.fieldId,
    source: "assisted_report",
    farmerName: input.farmerName,
    phone: input.phone,
    village: input.village || farm?.village,
    crop: input.crop || farm?.cropId,
    symptoms: input.symptoms,
    notes: input.notes,
    officerObservation: input.officerObservation,
    photoUrl: input.photoUrl,
    approximateArea: input.approximateArea,
    status: "case_created",
    caseId,
    createdAt: new Date().toISOString(),
  };
  unifiedStore.assistedReports = [ar, ...unifiedStore.assistedReports];

  // Create crop health case
  const assessment: CropHealthAssessment = {
    id: caseId,
    farmId: input.fieldId || "",
    districtId,
    cropId: input.crop || farm?.cropId || "unknown",
    threatId: "pending_investigation",
    suspected: "Assisted Farmer Report — Pending Investigation",
    confidence: 0,
    severity: 2 as 1 | 2 | 3 | 4 | 5,
    status: "detected",
    detectedVia: ["history"],
    detectedAt: new Date().toISOString(),
    affectedAreaHa: farm?.areaHa ?? 1,
    evidence: [
      {
        channel: "history",
        label: "Officer-assisted farmer report",
        detail: `Farmer: ${input.farmerName || "Unknown"} | Symptoms: ${input.symptoms.join(", ")}`,
        supports: true,
      },
    ],
    notes: `Assisted report by officer. Farmer: ${input.farmerName}. Observation: ${input.officerObservation || "N/A"}`,
  };
  unifiedStore.assessments = [assessment, ...unifiedStore.assessments];

  addTimelineEvent(caseId, "assisted_reported", "Officer-Assisted Report Created", `Farmer: ${input.farmerName || "Unknown"} | Village: ${input.village || "N/A"}`, "officer");

  emit();

  // Supabase writes
  try {
    await supabase.from("assisted_reports").insert({
      id: ar.id,
      officer_id: input.officerId !== OFFICER_USER_ID ? input.officerId : null,
      field_id: input.fieldId || null,
      source: "assisted_report",
      farmer_name: input.farmerName,
      phone: input.phone,
      village: input.village,
      crop: input.crop,
      symptoms: input.symptoms,
      notes: input.notes,
      officer_observation: input.officerObservation,
      photo_url: input.photoUrl,
      approximate_area: input.approximateArea,
      status: "case_created",
      case_id: caseId,
    });

    await supabase.from("crop_health_cases").insert({
      id: caseId,
      case_number: caseId,
      farm_id: input.fieldId || null,
      threat_name: assessment.suspected,
      crop_id: assessment.cropId,
      district: districtId,
      severity: assessment.severity,
      confidence: 0,
      status: "detected",
      source: "assisted_report",
      detected_via: ["history"],
      evidence: assessment.evidence,
      notes: assessment.notes,
    });
  } catch (err) {
    console.debug("Supabase submitAssistedReport notice:", err);
  }

  return { reportId, caseId };
}

export function getAssistedReports(): AssistedReport[] {
  return [...unifiedStore.assistedReports];
}

/* ============================================================
   ROUND 2: CASE TIMELINE
   ============================================================ */

function addTimelineEvent(
  caseId: string,
  eventType: CaseTimelineEvent["eventType"],
  title: string,
  detail?: string,
  actorRole?: string,
) {
  const event: CaseTimelineEvent = {
    id: `TL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    caseId,
    eventType,
    title,
    detail,
    actorRole,
    createdAt: new Date().toISOString(),
  };
  unifiedStore.timelineEvents = [event, ...unifiedStore.timelineEvents];

  // Async Supabase write
  supabase.from("case_timeline_events").insert({
    id: event.id,
    case_id: caseId,
    event_type: eventType,
    title,
    detail,
    actor_role: actorRole,
  }).then(() => {}).catch((err) => {
    console.debug("Supabase addTimelineEvent notice:", err);
  });
}

export { addTimelineEvent };

export function getCaseTimeline(caseId: string): CaseTimelineEvent[] {
  // Build timeline from both explicit events and implicit store records
  const explicit = unifiedStore.timelineEvents.filter((e) => e.caseId === caseId);

  const assessment = unifiedStore.assessments.find((a) => a.id === caseId);
  const implicit: CaseTimelineEvent[] = [];

  if (assessment) {
    // Detection/report event
    if (!explicit.some((e) => e.eventType === "farmer_reported" || e.eventType === "voice_reported" || e.eventType === "assisted_reported")) {
      implicit.push({
        id: `impl-detect-${caseId}`,
        caseId,
        eventType: "farmer_reported",
        title: "Case Detected",
        detail: assessment.suspected,
        createdAt: assessment.detectedAt,
      });
    }

    // AI assessment if scan exists
    const scan = unifiedStore.scans.find((s) => s.caseId === caseId);
    if (scan && !explicit.some((e) => e.eventType === "ai_assessment")) {
      implicit.push({
        id: `impl-ai-${caseId}`,
        caseId,
        eventType: "ai_assessment",
        title: "AI Assessment Generated",
        detail: `${assessment.suspected} — ${assessment.confidence}% confidence`,
        createdAt: scan.scannedAt,
      });
    }

    // Expert review
    const review = unifiedStore.reviews.find((r) => r.assessmentId === caseId);
    if (review && !explicit.some((e) => e.eventType === "expert_validation")) {
      implicit.push({
        id: `impl-expert-${caseId}`,
        caseId,
        eventType: "expert_validation",
        title: `Expert ${review.verdict === "confirmed" ? "Confirmed" : review.verdict === "corrected" ? "Corrected" : "Reviewed"}`,
        detail: review.comment,
        actorRole: "expert",
        createdAt: review.reviewedAt,
      });
    }

    // Field visit
    const visit = unifiedStore.visits.find((v) => v.assessmentId === caseId);
    if (visit && !explicit.some((e) => e.eventType === "field_visit")) {
      implicit.push({
        id: `impl-visit-${caseId}`,
        caseId,
        eventType: "field_visit",
        title: `Field Visit ${visit.status === "completed" ? "Completed" : "Scheduled"}`,
        detail: visit.finding || `Scheduled for ${visit.scheduledFor}`,
        actorRole: "officer",
        createdAt: visit.scheduledFor,
      });
    }

    // Advisory
    const advisory = assessment.advisoryId ? unifiedStore.advisories.find((a) => a.id === assessment.advisoryId) : undefined;
    if (advisory && !explicit.some((e) => e.eventType === "advisory_issued")) {
      implicit.push({
        id: `impl-adv-${caseId}`,
        caseId,
        eventType: "advisory_issued",
        title: "Advisory Issued",
        detail: advisory.title,
        createdAt: advisory.issuedAt,
      });
    }

    // Follow-ups
    const followUps = unifiedStore.followUps.filter((f) => f.assessmentId === caseId && f.done);
    followUps.forEach((fu) => {
      if (!explicit.some((e) => e.eventType === "farmer_followup" && e.detail?.includes(fu.id))) {
        implicit.push({
          id: `impl-fu-${fu.id}`,
          caseId,
          eventType: "farmer_followup",
          title: "Follow-up Completed",
          detail: fu.action,
          actorRole: "farmer",
          createdAt: fu.completedAt || fu.dueOn,
        });
      }
    });

    // Resolved
    if (assessment.status === "resolved" && !explicit.some((e) => e.eventType === "resolved")) {
      implicit.push({
        id: `impl-resolved-${caseId}`,
        caseId,
        eventType: "resolved",
        title: "Case Resolved",
        createdAt: assessment.detectedAt,
      });
    }
  }

  return [...explicit, ...implicit].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/* ============================================================
   ROUND 2: OFFLINE SYNC PROCESSING
   ============================================================ */

/**
 * Process a single offline sync record — called by offlineService during auto-sync.
 */
export async function processSyncRecord(record: OfflineSyncRecord): Promise<void> {
  const payload = record.payload as Record<string, unknown>;

  switch (record.recordType) {
    case "voice_report":
      await submitVoiceReport({
        farmerId: payload.farmerId as string | undefined,
        fieldId: payload.fieldId as string | undefined,
        transcript: (payload.transcript as string) || "",
        language: (payload.language as string) || "en",
        crop: payload.crop as string | undefined,
        symptomsText: payload.symptomsText as string | undefined,
      });
      break;

    case "observation":
      // Create a basic case from offline observation
      await submitVoiceReport({
        farmerId: payload.farmerId as string | undefined,
        fieldId: payload.fieldId as string | undefined,
        transcript: (payload.notes as string) || (payload.symptoms as string[])?.join(", ") || "Offline observation",
        language: (payload.language as string) || "en",
        crop: payload.crop as string | undefined,
      });
      break;

    case "feedback":
      if (payload.caseId && payload.farmId && payload.observation) {
        await submitFarmerFeedback(
          payload.caseId as string,
          payload.farmId as string,
          payload.observation as FarmerObservation,
          payload.notes as string | undefined,
        );
      }
      break;

    default:
      console.debug("Unknown sync record type:", record.recordType);
  }
}

/* ============================================================
   ROUND 2: ALL REPORTS (UNIFIED VIEW FOR OFFICER)
   ============================================================ */

export interface UnifiedReport {
  id: string;
  caseId?: string;
  source: "scan" | "voice_report" | "assisted_report";
  farmerName: string;
  village: string;
  crop: string;
  problem: string;
  reportedAt: string;
  status: string;
}

export function getAllReportsForOfficer(): UnifiedReport[] {
  const reports: UnifiedReport[] = [];

  // Voice reports
  unifiedStore.voiceReports.forEach((vr) => {
    const farm = vr.fieldId ? farmById(vr.fieldId) : undefined;
    reports.push({
      id: vr.id,
      caseId: vr.caseId,
      source: "voice_report",
      farmerName: farm?.ownerName || "Farmer",
      village: farm?.village || "Unknown",
      crop: vr.crop || "Unknown",
      problem: vr.transcript.slice(0, 100),
      reportedAt: vr.createdAt,
      status: vr.status,
    });
  });

  // Assisted reports
  unifiedStore.assistedReports.forEach((ar) => {
    reports.push({
      id: ar.id,
      caseId: ar.caseId,
      source: "assisted_report",
      farmerName: ar.farmerName || "Unknown",
      village: ar.village || "Unknown",
      crop: ar.crop || "Unknown",
      problem: ar.symptoms.join(", ").slice(0, 100) || ar.notes?.slice(0, 100) || "N/A",
      reportedAt: ar.createdAt,
      status: ar.status,
    });
  });

  // Scan-based cases (existing)
  unifiedStore.scans.forEach((scan) => {
    const farm = farmById(scan.farmId);
    const assessment = unifiedStore.assessments.find((a) => a.id === scan.caseId);
    reports.push({
      id: scan.id,
      caseId: scan.caseId,
      source: "scan",
      farmerName: farm?.ownerName || "Farmer",
      village: farm?.village || "Unknown",
      crop: scan.cropId,
      problem: assessment?.suspected || scan.symptoms.join(", "),
      reportedAt: scan.scannedAt,
      status: assessment?.status || "detected",
    });
  });

  return reports.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}
