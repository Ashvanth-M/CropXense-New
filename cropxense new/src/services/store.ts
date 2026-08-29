import type {
  Advisory,
  CropHealthAssessment,
  ExpertReview,
  FarmerFeedback,
  FarmerScan,
  FieldVisit,
  FollowUp,
} from "@/types";
import {
  ADVISORIES,
  ASSESSMENTS,
  FARMS,
  FIELD_VISITS,
  FOLLOW_UPS,
  REVIEWS,
} from "@/data/seed";

export type Store = {
  farms: Farm[];
  assessments: CropHealthAssessment[];
  reviews: ExpertReview[];
  advisories: Advisory[];
  visits: FieldVisit[];
  followUps: FollowUp[];
  scans: FarmerScan[];
  feedbacks: FarmerFeedback[];
};

const STORAGE_KEY = "cropxense_store_v7";

export const RAMESH_FIELDS: Farm[] = [
  {
    id: "F-AKO-001",
    name: "Vitthal Farm",
    ownerName: "Ramesh Kumar",
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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
    ownerId: "demo-farmer-ramesh",
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

export const RAMESH_FIELD_IDS = new Set(RAMESH_FIELDS.map((f) => f.id));

function seedFarms(): Farm[] {
  const otherFarms = FARMS.filter((f) => !RAMESH_FIELD_IDS.has(f.id)).map((f) => ({
    ...f,
    ownerId: undefined, // Non-Ramesh farms have no ownerId by default
    state: "Maharashtra",
    isArchived: false,
    createdAt: f.sowingDate,
    updatedAt: f.sowingDate,
  }));
  return [...RAMESH_FIELDS, ...otherFarms];
}

function loadInitialStore(): Store {
  if (typeof window !== "undefined") {
    try {
      // Clear all legacy storage keys
      for (let v = 1; v <= 6; v++) {
        localStorage.removeItem(`cropxense_store_v${v}`);
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.assessments) && Array.isArray(parsed.farms)) {
          // Verify that only the 10 RAMESH_FIELDS are tagged for demo-farmer-ramesh
          const rameshCount = parsed.farms.filter((f: Farm) => RAMESH_FIELD_IDS.has(f.id)).length;
          if (rameshCount !== 10) {
            parsed.farms = seedFarms();
          }
          if (!Array.isArray(parsed.scans)) parsed.scans = [];
          if (!Array.isArray(parsed.feedbacks)) parsed.feedbacks = [];
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load store from localStorage", e);
    }
  }
  return {
    farms: seedFarms(),
    assessments: ASSESSMENTS.map((a) => ({
      ...a,
      farmerId: RAMESH_FIELD_IDS.has(a.farmId) ? "demo-farmer-ramesh" : undefined,
    })),
    reviews: REVIEWS.map((r) => ({ ...r })),
    advisories: ADVISORIES.map((a) => ({ ...a })),
    visits: FIELD_VISITS.map((v) => ({ ...v })),
    followUps: FOLLOW_UPS.map((f) => ({ ...f })),
    scans: [],
    feedbacks: [],
  };
}

const g = globalThis as unknown as { __cropxense?: Store };

export const store: Store = g.__cropxense ?? (g.__cropxense = loadInitialStore());

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function saveStore() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("Failed to persist store to localStorage", e);
    }
  }
}

export function emit() {
  saveStore();
  listeners.forEach((l) => l());
}

/** Artificial latency for realistic demo interactions. */
export function delay<T>(value: T, min = 80, max = 200): Promise<T> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Put the store back to its seeded state. */
export function resetStore() {
  store.farms = seedFarms();
  store.assessments = ASSESSMENTS.map((a) => ({
    ...a,
    farmerId: ["F-AKO-001", "F-AKO-002", "F-AKO-003"].includes(a.farmId) ? "demo-farmer-ramesh" : undefined,
  }));
  store.reviews = REVIEWS.map((r) => ({ ...r }));
  store.advisories = ADVISORIES.map((a) => ({ ...a }));
  store.visits = FIELD_VISITS.map((v) => ({ ...v }));
  store.followUps = FOLLOW_UPS.map((f) => ({ ...f }));
  store.scans = [];
  store.feedbacks = [];
  emit();
}


