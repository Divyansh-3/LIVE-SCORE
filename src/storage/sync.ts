// Real-time sync between the Control Panel and Overlay pages (same browser profile).
//   1. BroadcastChannel – instant push of every change
//   2. A 2-second check of the tiny "rev" key in IndexedDB – safety net if a message is ever missed
// Every state carries a revision number (rev). A page only accepts a state NEWER than the one it has,
// so an old state can never overwrite a newer one.
import { useEffect, useState } from "react";
import type { State } from "../model";
import { loadRev, loadState } from "./db";

const NAME = "live-score-sync";
let out: BroadcastChannel | null = null;

export function publish(s: State): void {
  try {
    (out ??= new BroadcastChannel(NAME)).postMessage(s);
  } catch {
    /* BroadcastChannel unsupported: the IndexedDB check still syncs */
  }
}
export function closePublisher(): void {
  out?.close();
  out = null;
}

/** Calls cb for every state broadcast by ANOTHER page. Returns a cleanup function. */
export function subscribe(cb: (s: State) => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const c = new BroadcastChannel(NAME);
  c.onmessage = (e) => cb(e.data as State);
  return () => c.close();
}

/** Overlay hook: loads from IndexedDB, then follows broadcasts (and the rev check). */
export function useSharedState(pollMs = 2000): State | null {
  const [state, set] = useState<State | null>(null);
  useEffect(() => {
    let alive = true,
      rev = -1;
    const apply = (n: State) => {
      if (!alive || n.rev <= rev) return;
      rev = n.rev;
      set(n);
    };
    const off = subscribe(apply);
    loadState()
      .then((n) => n && apply(n))
      .catch(() => {});
    const timer = setInterval(async () => {
      try {
        if ((await loadRev()) > rev) {
          const n = await loadState();
          if (n) apply(n);
        }
      } catch {
        /* retry next tick */
      }
    }, pollMs);
    return () => {
      alive = false;
      off();
      clearInterval(timer);
    };
  }, [pollMs]);
  return state;
}
