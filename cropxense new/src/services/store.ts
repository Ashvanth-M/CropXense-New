import type {
  Advisory,
  CropHealthAssessment,
  ExpertReview,
  Farm,
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

type Store = {
  assessments: CropHealthAssessment[];
  reviews: ExpertReview[];
  advisories: Advisory[];
  visits: FieldVisit[];
  followUps: FollowUp[];
  farms: Farm[];
};

const STORAGE_KEY = "cropxense_store_v2";

function loadInitialStore(): Store {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.assessments)) {
          return {
            ...parsed,
            farms: Array.isArray(parsed.farms) ? parsed.farms : FARMS.map((f) => ({ ...f })),
          };
        }
      }
    } catch (e) {
      console.warn("Failed to load store from localStorage", e);
    }
  }
  return {
    assessments: ASSESSMENTS.map((a) => ({ ...a })),
    reviews: REVIEWS.map((r) => ({ ...r })),
    advisories: ADVISORIES.map((a) => ({ ...a })),
    visits: FIELD_VISITS.map((v) => ({ ...v })),
    followUps: FOLLOW_UPS.map((f) => ({ ...f })),
    farms: FARMS.map((f) => ({ ...f })),
  };
}

const g = globalThis as unknown as { __cropxense?: Store };

export const store: Store = g.__cropxense ?? (g.__cropxense = loadInitialStore());

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
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
export function delay<T>(value: T, min = 100, max = 250): Promise<T> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Put the store back to its seeded state. */
export function resetStore() {
  store.assessments = ASSESSMENTS.map((a) => ({ ...a }));
  store.reviews = REVIEWS.map((r) => ({ ...r }));
  store.advisories = ADVISORIES.map((a) => ({ ...a }));
  store.visits = FIELD_VISITS.map((v) => ({ ...v }));
  store.followUps = FOLLOW_UPS.map((f) => ({ ...f }));
  store.farms = FARMS.map((f) => ({ ...f }));
  emit();
}

