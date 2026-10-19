import { cdLeft, type CD, type Match, type State, type Team } from "./model";

/** Maps a team has to win to take the series. BO1 is left out on purpose: its score may be rounds, not maps. */
const NEED: Partial<Record<Match["fmt"], number>> = { BO3: 2, BO5: 3, BO7: 4};
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
 * Puts a team into team slot "a"/"b" of the match used by bracket slot `bmId` on page `pid`
 * (the page can be another bracket screen, e.g. the Lower Bracket).
 * Never touches a match that has already started (any score above 0).
 */
function place(
  d: State,
  pid: string,
  bmId: string,
  slot: "a" | "b",
  team: Team,
): void {
  const slots =
    d.pages
      .find((x) => x.id === pid)
      ?.bracket?.rounds.flatMap((r) => r.matches) ?? [];
  const target = slots.find((x) => x.id === bmId);
  const tm = target && d.matches.find((x) => x.id === target.matchId);
  if (!tm) return;
  if (tm.a.score || tm.b.score) return; // already being played: never overwrite
  tm[slot] = {
    name: team.name,
    abbr: team.abbr,
    logo: team.logo,
    score: 0,
  };
}

/**
 * Finish the current match:
 *  1. every bracket slot that uses it is marked completed,
 *  2. the winner's team is copied into the slot the bracket says (on this screen, or on another screen
 *     for double elimination), and the loser's team is copied to its "loser drops to" slot (double elimination),
 *     but only if that next match has not started (both scores 0),
 *  3. the current match moves to the next match in your list that has no winner yet.
 * Use with up(advance). Returns false (= change nothing) if there is nothing to do.
 */
export function advance(d: State): false | void {
  if (!canAdvance(d)) return false;
  const i = d.matches.findIndex((x) => x.id === d.curId);
  const m = d.matches[i];
  const w = seriesWinner(m)!;
  const l = w === "a" ? "b" : "a";

  for (const pg of d.pages) {
    const slots = pg.bracket?.rounds.flatMap((r) => r.matches) ?? [];
    for (const bm of slots) {
      if (bm.matchId !== m.id) continue;
      bm.completed = true;

      // winner
      if (bm.winnerTo) {
        place(d, bm.winnerTo.pid, bm.winnerTo.bmId, bm.winnerTo.slot, m[w]);
      } else if (bm.nextMatchId) {
        const side =
          bm.nextSlot ??
          (slots.filter((x) => x.nextMatchId === bm.nextMatchId).indexOf(bm) ===
          0
            ? "a"
            : "b");
        place(d, pg.id, bm.nextMatchId, side, m[w]);
      }

      // loser (double elimination)
      if (bm.loserTo) {
        place(d, bm.loserTo.pid, bm.loserTo.bmId, bm.loserTo.slot, m[l]);
      }
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
