/**
 * CropXense Offline-First Service.
 *
 * IndexedDB-based offline queue for field observations, voice transcripts,
 * scan metadata, and images. Auto-syncs when connectivity returns.
 *
 * Client-side only — all IndexedDB access is guarded with typeof window checks.
 */

import type { OfflineSyncRecord } from "@/types";

const DB_NAME = "cropxense_offline";
const DB_VERSION = 1;
const STORE_RECORDS = "sync_queue";
const STORE_IMAGES = "image_queue";

/* ─────────────────── IndexedDB Helpers ─────────────────── */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        const store = db.createObjectStore(STORE_RECORDS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("recordType", "recordType", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: "id" });
      }
    };
  });
}

/* ─────────────────── Offline Status ─────────────────── */

export type OfflineStatus = "online" | "offline" | "syncing" | "synced" | "sync_failed";

let currentStatus: OfflineStatus = typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";
const statusListeners = new Set<(status: OfflineStatus) => void>();

export function getOfflineStatus(): OfflineStatus {
  return currentStatus;
}

export function onStatusChange(fn: (status: OfflineStatus) => void): () => void {
  statusListeners.add(fn);
  return () => { statusListeners.delete(fn); };
}

function setStatus(s: OfflineStatus) {
  currentStatus = s;
  statusListeners.forEach((fn) => fn(s));
}

/** Initialize online/offline event listeners. Call once on app mount. */
export function initOfflineListeners() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    setStatus("online");
    // Auto-sync when coming back online
    syncPendingRecords().catch(console.error);
  });

  window.addEventListener("offline", () => {
    setStatus("offline");
  });

  // Set initial status
  setStatus(navigator.onLine ? "online" : "offline");
}

/* ─────────────────── Save Offline Records ─────────────────── */

export async function saveOfflineRecord(record: Omit<OfflineSyncRecord, "id" | "createdAt" | "status">): Promise<string> {
  const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: OfflineSyncRecord = {
    id,
    ...record,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    tx.objectStore(STORE_RECORDS).put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to save offline record:", err);
    throw err;
  }

  return id;
}

/** Save an image blob offline for later upload. */
export async function saveOfflineImage(id: string, blob: Blob, metadata: Record<string, unknown>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).put({ id, blob, metadata, createdAt: new Date().toISOString() });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to save offline image:", err);
  }
}

/* ─────────────────── Read Pending Records ─────────────────── */

export async function getPendingRecords(): Promise<OfflineSyncRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, "readonly");
    const store = tx.objectStore(STORE_RECORDS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const all = (request.result || []) as OfflineSyncRecord[];
        resolve(all.filter((r) => r.status === "pending" || r.status === "failed"));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function getPendingImages(): Promise<{ id: string; blob: Blob; metadata: Record<string, unknown> }[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_IMAGES, "readonly");
    return new Promise((resolve, reject) => {
      const request = tx.objectStore(STORE_IMAGES).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function getPendingCount(): Promise<number> {
  const records = await getPendingRecords();
  const images = await getPendingImages();
  return records.length + images.length;
}

/* ─────────────────── Sync ─────────────────── */

/** Synchronize all pending records with Supabase. */
export async function syncPendingRecords(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  setStatus("syncing");
  let synced = 0;
  let failed = 0;

  try {
    const records = await getPendingRecords();

    for (const record of records) {
      try {
        // Dynamic import to avoid circular dependency and SSR issues
        const { processSyncRecord } = await import("./supabaseService");
        await processSyncRecord(record);
        await updateRecordStatus(record.id, "synced");
        synced++;
      } catch (err) {
        console.error(`Failed to sync record ${record.id}:`, err);
        await updateRecordStatus(record.id, "failed");
        failed++;
      }
    }

    // Sync pending images
    const images = await getPendingImages();
    for (const img of images) {
      try {
        const { uploadScanImage } = await import("./supabaseService");
        await uploadScanImage(img.blob, (img.metadata?.userId as string) || "offline", img.id);
        await removeImage(img.id);
        synced++;
      } catch (err) {
        console.error(`Failed to sync image ${img.id}:`, err);
        failed++;
      }
    }

    setStatus(failed > 0 ? "sync_failed" : "synced");

    // Reset to online after a brief "synced" display
    if (failed === 0) {
      setTimeout(() => {
        if (currentStatus === "synced") setStatus("online");
      }, 3000);
    }
  } catch (err) {
    console.error("Sync failed:", err);
    setStatus("sync_failed");
  }

  return { synced, failed };
}

async function updateRecordStatus(id: string, status: OfflineSyncRecord["status"]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    const store = tx.objectStore(STORE_RECORDS);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.status = status;
        if (status === "synced") record.syncedAt = new Date().toISOString();
        store.put(record);
      }
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to update record status:", err);
  }
}

async function removeImage(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to remove image:", err);
  }
}

/** Clear all synced records from IndexedDB (housekeeping). */
export async function clearSyncedRecords(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_RECORDS, "readwrite");
    const store = tx.objectStore(STORE_RECORDS);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as OfflineSyncRecord[];
      for (const r of all) {
        if (r.status === "synced") store.delete(r.id);
      }
    };
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Failed to clear synced records:", err);
  }
}
