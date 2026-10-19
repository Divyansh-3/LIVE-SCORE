import { migrate, mkState, type State } from "../model";

const DB_NAME = "live-score";
const STORE = "kv";
const KEY = "state";
const REV = "rev";

let dbp: Promise<IDBDatabase> | null = null;

/** Opens the database once and asks the browser not to evict it under storage pressure. */
export function initDB(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined")
        return reject(new Error("IndexedDB is not available in this browser."));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () =>
        reject(
          new Error(
            "The database is blocked by another tab. Close other copies of this app.",
          ),
        );
    });
    dbp
      .then(() => navigator.storage?.persist?.())
      .catch(() => {
        dbp = null;
      }); // allow a retry after a failure
  }
  return dbp;
}

async function get<T>(key: string): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE).objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

/** Small key-value helpers for other settings (e.g. the backup folder handle). */
export async function kvGet<T>(key: string): Promise<T | undefined> {
  return get<T>(key);
}
export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(value, key);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/** Writes state + revision in ONE transaction (both succeed or neither does). Resolves when durably committed. */
export async function saveState(s: State): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    const o = t.objectStore(STORE);
    o.put(s, KEY);
    o.put(s.rev, REV);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/** Loads the saved state, upgrading old formats with migrate(). Returns null if nothing is saved. */
export async function loadState(): Promise<State | null> {
  return migrate(await get(KEY));
}

export async function loadRev(): Promise<number> {
  return (await get<number>(REV)) ?? -1;
}

/** First launch → create + save the default state. Otherwise load what was saved. */
export async function loadOrInit(): Promise<State> {
  let s = await loadState();
  if (!s) {
    s = mkState();
    await saveState(s);
  }
  return s;
}

export async function clearState(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).clear();
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
