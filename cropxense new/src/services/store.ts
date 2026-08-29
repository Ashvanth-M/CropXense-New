/**
 * CropXense Store Compatibility Bridge.
 * Bridges legacy imports to the unified Supabase reactive store.
 */

import { unifiedStore, subscribe as supabaseSubscribe, emit as supabaseEmit, RAMESH_FIELDS, RAMESH_FIELD_IDS } from "./supabaseService";
import type { Farm } from "@/types";

export type Store = typeof unifiedStore;

export const store = unifiedStore;
export const subscribe = supabaseSubscribe;
export const emit = supabaseEmit;
export { RAMESH_FIELDS, RAMESH_FIELD_IDS };

export function saveStore() {
  // No-op: Supabase is now the single source of truth
}

export function delay<T>(value: T, _min = 0, _max = 0): Promise<T> {
  return Promise.resolve(value);
}

export function resetStore() {
  // Resets in-memory unified store
  unifiedStore.feedbacks = [];
  unifiedStore.scans = [];
  emit();
}
