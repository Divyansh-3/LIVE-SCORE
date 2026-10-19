import { useCallback, useEffect, useRef, useState } from "react";
import type { State } from "../model";
import { kvGet, kvSet } from "./db";

const KEY = "backupDir";
const EVERY = 60_000; // check for changes every minute
const STAMP_EVERY = 30 * 60_000; // plus a dated copy every 30 minutes
const KEEP = 12; // dated copies kept
const supported =
  typeof window !== "undefined" && "showDirectoryPicker" in window;

export type BackupPerm = "unsupported" | "none" | "ask" | "ok";

const pad = (n: number) => String(n).padStart(2, "0");
const stampName = (d = new Date()) =>
  `scoreboard-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;

/**
 * Writes the whole tournament to a folder YOU pick, so it survives cleared browser data.
 * Needs Chrome / Edge (File System Access API). The folder is remembered; after a browser
 * restart one click on "Resume backups" re-grants permission.
 */
export function useAutoBackup(getState: () => State | null, paused: boolean) {
  const dir = useRef<any>(null);
  const lastRev = useRef(-1);
  const lastStamp = useRef(0);
  const [perm, setPerm] = useState<BackupPerm>(
    supported ? "none" : "unsupported",
  );
  const [name, setName] = useState("");
  const [last, setLast] = useState<Date | null>(null);
  const [err, setErr] = useState("");

  const write = useCallback(
    async (force = false) => {
      const s = getState();
      const d = dir.current;
      if (!s || !d) return;
      if (!force && s.rev === lastRev.current) return;
      try {
        const json = JSON.stringify(s);
        const put = async (n: string) => {
          const w = await (
            await d.getFileHandle(n, { create: true })
          ).createWritable();
          await w.write(json);
          await w.close();
        };
        await put("scoreboard-backup-latest.json");
        const t = Date.now();
        if (force || t - lastStamp.current >= STAMP_EVERY) {
          lastStamp.current = t;
          await put(stampName());
          const names: string[] = [];
          for await (const [n] of d.entries())
            if (/^scoreboard-backup-\d{4}-/.test(n)) names.push(n);
          names.sort();
          for (const n of names.slice(0, Math.max(0, names.length - KEEP)))
            await d.removeEntry(n);
        }
        lastRev.current = s.rev;
        setLast(new Date());
        setErr("");
      } catch (e: any) {
        setErr(String(e?.message || e));
      }
    },
    [getState],
  );

  // remembered folder from last time
  useEffect(() => {
    if (!supported) return;
    kvGet<any>(KEY)
      .then(async (h) => {
        if (!h) return;
        dir.current = h;
        setName(h.name);
        const p = await h.queryPermission({ mode: "readwrite" });
        setPerm(p === "granted" ? "ok" : "ask");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (perm !== "ok" || paused) return;
    const t = setInterval(() => write(), EVERY);
    return () => clearInterval(t);
  }, [perm, paused, write]);

  const pick = async () => {
    try {
      const h = await (window as any).showDirectoryPicker({
        mode: "readwrite",
        id: "scoreboard-backup",
      });
      dir.current = h;
      await kvSet(KEY, h);
      setName(h.name);
      setPerm("ok");
      write(true);
    } catch (e: any) {
      if (e?.name !== "AbortError") setErr(String(e?.message || e));
    }
  };
  const resume = async () => {
    try {
      const p = await dir.current.requestPermission({ mode: "readwrite" });
      if (p === "granted") {
        setPerm("ok");
        write(true);
      }
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  };
  return { perm, name, last, err, pick, resume, now: () => write(true) };
}
