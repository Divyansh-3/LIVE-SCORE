import { cdLeft, type CD, type Match, type State } from "./model";

/** Maps a team has to win to take the series. BO1 is left out on purpose: its score may be rounds, not maps. */
const NEED: Partial<Record<Match["fmt"], number>> = { BO3: 2, BO5: 3 };
/** How long a finished series stays on screen before "Auto-advance" moves on. */
export const AUTO_MS = 8000;

/** "a" / "b" once a team has won the series, otherwise null. */
export function seriesWinner(m: Match): "a" | "b" | null {
  const n = NEED[m.fmt];
  if (!n) return null;
  if (m.a.score >= n && m.a.score > m.b.score) return "a";
  if (m.b.score >= n && m.b.score > m.a.score) return "b";
  return null;
}

/** True when the current match is won AND advancing would still change something. */
export function canAdvance(s: State): boolean {
  const i = s.matches.findIndex((x) => x.id === s.curId);
  const m = s.matches[i];
  if (!m || !seriesWinner(m)) return false;
  if (s.matches.some((x, j) => j > i && !seriesWinner(x))) return true;
  return s.pages.some((pg) =>
    pg.bracket?.rounds.some((r) =>
      r.matches.some((b) => b.matchId === m.id && !b.completed),
    ),
  );
}

/**
 * Finish the current match:
 *  1. every bracket slot that uses it is marked completed,
 *  2. the winner's team is copied into the next bracket slot (first feeder -> team A, second -> team B),
 *     but only if that next match has not started (both scores 0),
 *  3. the current match moves to the next match in your list that has no winner yet.
 * Use with up(advance). Returns false (= change nothing) if there is nothing to do.
 */
export function advance(d: State): false | void {
  if (!canAdvance(d)) return false;
  const i = d.matches.findIndex((x) => x.id === d.curId);
  const m = d.matches[i];
  const w = seriesWinner(m)!;
  const team = m[w];

  for (const pg of d.pages) {
    const slots = pg.bracket?.rounds.flatMap((r) => r.matches) ?? [];
    for (const bm of slots) {
      if (bm.matchId !== m.id) continue;
      bm.completed = true;
      const nxt = slots.find((x) => x.id === bm.nextMatchId);
      const tm = nxt && d.matches.find((x) => x.id === nxt.matchId);
      if (!nxt || !tm || tm.id === m.id) continue;
      if (tm.a.score || tm.b.score) continue; // already being played: never overwrite
      const side =
        slots.filter((x) => x.nextMatchId === nxt.id).indexOf(bm) === 0
          ? "a"
          : "b";
      tm[side] = {
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        score: 0,
      };
    }
  }

  const nx = d.matches.findIndex((x, j) => j > i && !seriesWinner(x));
  if (nx >= 0) d.curId = d.matches[nx].id;
}

/** Start/pause a countdown (same rules as the Start and Pause buttons). */
export function cdToggle(c: CD): void {
  const left = cdLeft(c);
  if (c.endsAt && c.endsAt > Date.now()) {
    c.left = left;
    c.endsAt = null;
  } else {
    const t = left > 0 ? left : c.total;
    c.left = t;
    c.endsAt = Date.now() + t;
  }
}
