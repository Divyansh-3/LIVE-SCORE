// Points-table (league / round-robin) logic. Pure functions, no UI.
// Every team plays every other team once (or twice for "double round-robin").
// The supported sizes are all even, so nobody ever sits out: there are no byes in a round-robin.
import { uid, type LeagueTable, type TableMatch } from "../model";

export const TABLE_SIZES = [4, 6, 8, 10, 12, 14, 16];
export type Status = "completed" | "ongoing" | "next" | "pending";
export interface Row {
  id: string;
  name: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  rank: number;
}

const played = (m: TableMatch) => m.sa !== null && m.sb !== null;

/** Circle method: n−1 rounds, every team plays once per round and meets every other team exactly once. */
export function fixtures(ids: string[], double: boolean): TableMatch[] {
  const n = ids.length,
    arr = [...ids],
    out: TableMatch[] = [],
    rounds = n - 1;
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++)
      out.push({
        id: uid(),
        round: r + 1,
        a: arr[i],
        b: arr[n - 1 - i],
        sa: null,
        sb: null,
      });
    arr.splice(1, 0, arr.pop()!); // keep team 0 fixed, rotate the rest
  }
  if (double)
    [...out].forEach((m) =>
      out.push({
        id: uid(),
        round: m.round + rounds,
        a: m.b,
        b: m.a,
        sa: null,
        sb: null,
      }),
    );
  return out;
}

export function validateTable(name: string, names: string[]): string | null {
  if (!name.trim()) return "Give the table a name.";
  if (!TABLE_SIZES.includes(names.length))
    return "Choose 4, 6, 8, 10, 12, 14 or 16 teams.";
  const seen = new Set<string>();
  for (let i = 0; i < names.length; i++) {
    const k = names[i].trim().toLowerCase();
    if (!k) return `Team ${i + 1} needs a name.`;
    if (seen.has(k))
      return `"${names[i].trim()}" is used twice – team names must be different.`;
    seen.add(k);
  }
  return null;
}

export function createTable(
  name: string,
  names: string[],
  o: { double: boolean; win: number; draw: number },
): LeagueTable {
  const teams = names.map((n) => ({ id: uid(), name: n.trim() }));
  return {
    id: uid(),
    name: name.trim(),
    teams,
    matches: fixtures(
      teams.map((t) => t.id),
      o.double,
    ),
    double: o.double,
    win: o.win,
    draw: o.draw,
  };
}

/** New team count (or format): keeps the existing team names, adds "TEAM n" for new ones, rebuilds fixtures (results are cleared). */
export function rebuild(
  t: LeagueTable,
  count: number,
  double = t.double,
): void {
  t.teams = Array.from(
    { length: count },
    (_, i) => t.teams[i] ?? { id: uid(), name: `TEAM ${i + 1}` },
  );
  t.double = double;
  t.matches = fixtures(
    t.teams.map((x) => x.id),
    double,
  );
}

export function resetResults(t: LeagueTable): void {
  t.matches.forEach((m) => {
    m.sa = null;
    m.sb = null;
  });
}

/** Standings: points, then score difference, then scores for, then name. */
export function standings(t: LeagueTable): Row[] {
  const rows = new Map<string, Row>(
    t.teams.map((x) => [
      x.id,
      {
        id: x.id,
        name: x.name,
        p: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        rank: 0,
      },
    ]),
  );
  for (const m of t.matches) {
    if (!played(m)) continue;
    const A = rows.get(m.a),
      B = rows.get(m.b);
    if (!A || !B) continue;
    const sa = m.sa!,
      sb = m.sb!;
    A.p++;
    B.p++;
    A.gf += sa;
    A.ga += sb;
    B.gf += sb;
    B.ga += sa;
    if (sa > sb) {
      A.w++;
      B.l++;
      A.pts += t.win;
    } else if (sa < sb) {
      B.w++;
      A.l++;
      B.pts += t.win;
    } else {
      A.d++;
      B.d++;
      A.pts += t.draw;
      B.pts += t.draw;
    }
  }
  const list = [...rows.values()].map((r) => ({ ...r, gd: r.gf - r.ga }));
  list.sort(
    (x, y) =>
      y.pts - x.pts ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      x.name.localeCompare(y.name),
  );
  return list.map((r, i) => ({ ...r, rank: i + 1 }));
}

export const isComplete = (t: LeagueTable) =>
  t.matches.length > 0 && t.matches.every(played);
export const champion = (t: LeagueTable) =>
  isComplete(t) ? standings(t)[0] : null;
export const nextMatch = (t: LeagueTable) =>
  t.matches.find((m) => m.sa === null && m.sb === null)?.id ?? null;

/** completed = both scores in · ongoing = one score in · next = first match not started · pending = not started yet */
export function matchStatus(t: LeagueTable, m: TableMatch): Status {
  if (played(m)) return "completed";
  if (m.sa !== null || m.sb !== null) return "ongoing";
  return m.id === nextMatch(t) ? "next" : "pending";
}
