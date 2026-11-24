import {
  GameSettings,
  PlayerState,
  SaveSlotRecord,
  WorldState,
} from '../core/types';

const DB_NAME = 'the_last_ember_db';
const DB_VERSION = 1;
const STORE_SAVES = 'save_slots';
const LS_FALLBACK_KEY = 'the_last_ember_saves_v1';
const LS_SETTINGS_KEY = 'the_last_ember_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  sfxEnabled: true,
  masterVolume: 0.55,
  showMinimap: true,
  showControlHints: true,
  touchJoystickSide: 'left',
  cameraZoom: 'VERY_CLOSE',
};

function emptySlot(slotIndex: 1 | 2 | 3): SaveSlotRecord {
  return {
    slotIndex,
    exists: false,
    updatedAt: 0,
    player: null,
    world: null,
  };
}

function readLocalFallback(): Record<number, SaveSlotRecord> {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, SaveSlotRecord>;
  } catch {
    return {};
  }
}

function writeLocalFallback(slots: Record<number, SaveSlotRecord>) {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(slots));
  } catch {
    // ignore quota errors
  }
}

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SAVES)) {
          db.createObjectStore(STORE_SAVES, { keyPath: 'slotIndex' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function listSaveSlots(): Promise<SaveSlotRecord[]> {
  const db = await openDB();
  const fallback = readLocalFallback();

  if (!db) {
    return [1, 2, 3].map((i) => fallback[i] ?? emptySlot(i as 1 | 2 | 3));
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SAVES, 'readonly');
      const store = tx.objectStore(STORE_SAVES);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = (req.result ?? []) as SaveSlotRecord[];
        const map = new Map<number, SaveSlotRecord>();
        for (const r of rows) {
          map.set(r.slotIndex, r);
        }
        const merged = [1, 2, 3].map((idx) => {
          const fromDb = map.get(idx);
          if (fromDb && fromDb.exists) return fromDb;
          const fromLs = fallback[idx];
          if (fromLs && fromLs.exists) return fromLs;
          return emptySlot(idx as 1 | 2 | 3);
        });
        resolve(merged);
      };
      req.onerror = () => {
        resolve([1, 2, 3].map((i) => fallback[i] ?? emptySlot(i as 1 | 2 | 3)));
      };
    } catch {
      resolve([1, 2, 3].map((i) => fallback[i] ?? emptySlot(i as 1 | 2 | 3)));
    }
  });
}

export async function saveToSlot(
  slotIndex: 1 | 2 | 3,
  player: PlayerState,
  world: WorldState
): Promise<SaveSlotRecord> {
  const record: SaveSlotRecord = {
    slotIndex,
    exists: true,
    updatedAt: Date.now(),
    player: JSON.parse(JSON.stringify(player)) as PlayerState,
    world: JSON.parse(JSON.stringify(world)) as WorldState,
  };

  // Synchronous mirror to localStorage
  const fallback = readLocalFallback();
  fallback[slotIndex] = record;
  writeLocalFallback(fallback);

  const db = await openDB();
  if (!db) return record;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SAVES, 'readwrite');
      const store = tx.objectStore(STORE_SAVES);
      store.put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => resolve(record);
    } catch {
      resolve(record);
    }
  });
}

export async function loadFromSlot(slotIndex: 1 | 2 | 3): Promise<SaveSlotRecord | null> {
  const slots = await listSaveSlots();
  const found = slots.find((s) => s.slotIndex === slotIndex);
  if (!found || !found.exists || !found.player || !found.world) return null;
  return JSON.parse(JSON.stringify(found)) as SaveSlotRecord;
}

export async function deleteSaveSlot(slotIndex: 1 | 2 | 3): Promise<void> {
  const fallback = readLocalFallback();
  delete fallback[slotIndex];
  writeLocalFallback(fallback);

  const db = await openDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_SAVES, 'readwrite');
      const store = tx.objectStore(STORE_SAVES);
      store.delete(slotIndex);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getMostRecentSaveSlot(): Promise<SaveSlotRecord | null> {
  const slots = await listSaveSlots();
  const valid = slots.filter((s) => s.exists && s.player && s.world);
  if (valid.length === 0) return null;
  valid.sort((a, b) => b.updatedAt - a.updatedAt);
  return valid[0];
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}
