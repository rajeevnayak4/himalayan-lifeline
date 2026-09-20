/**
 * Offline-First SOS Queue using Native IndexedDB
 * Ensures distress calls are never lost in off-grid / zero-connectivity mountain terrain.
 */

export interface OfflineSOSPayload {
  id: string;
  victimName: string;
  phone: string;
  lat: number;
  lng: number;
  altitude?: number;
  locationName?: string;
  injuryType: string;
  message?: string;
  audioBase64?: string;
  emergencyContact?: string;
  trekRoute?: string;
  batteryLevel?: number;
  queuedAt: string;
  synced: boolean;
}

const DB_NAME = "HimalayanLifelineDB";
const STORE_NAME = "offline_sos_queue";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported on this platform"));
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueOfflineSOS(payload: OfflineSOSPayload): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(payload);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getQueuedAlerts(): Promise<OfflineSOSPayload[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedAlert(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Flushes all pending queued alerts to the server when network connectivity is restored.
 */
export async function flushOfflineQueue(
  onSyncedAlert?: (syncedAlertId: string) => void
): Promise<{ flushed: number }> {
  const queued = await getQueuedAlerts();
  if (queued.length === 0) return { flushed: 0 };

  let flushedCount = 0;
  for (const item of queued) {
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          isOfflineQueued: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await removeQueuedAlert(item.id);
        flushedCount++;
        if (onSyncedAlert) onSyncedAlert(data.alert?.id || item.id);
      }
    } catch (err) {
      console.warn("Retrying later, could not sync SOS:", err);
      break; // Still offline or server unreachable
    }
  }

  return { flushed: flushedCount };
}
