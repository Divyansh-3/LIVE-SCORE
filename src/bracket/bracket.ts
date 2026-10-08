// Single-elimination bracket logic. A bracket match never stores scores – it only points at an
// existing Match (matchId), so the normal score controls and the overlay keep working unchanged.
import {
  mkMatch,
  uid,
  type Bracket,
  type BracketMatch,
  type Match,
  type State,
} from "../model";

const NEED = { BO1: 1, BO3: 2, BO5: 3 }; // wins needed to take the series

export const roundName = (r: number, total: number) =>
  r === total - 1
    ? "Final"
    : r === total - 2
      ? "Semi Final"
      : r === total - 3
        ? "Quarter Final"
        : `Round ${r + 1}`;
const label = (name: string, r: number, i: number) =>
  name === "Final"
    ? "F"
    : name === "Semi Final"
      ? `SF${i + 1}`
      : name === "Quarter Final"
        ? `QF${i + 1}`
        : `R${r + 1}-${i + 1}`;

/** size = number of teams (2, 4, 8 or 16). Returns the bracket plus the NEW Match objects to add to state.matches. */
export function createBracket(
  size: number,
  tour: string,
): { bracket: Bracket; matches: Match[] } {
  const total = Math.log2(size);
  const rounds: Bracket["rounds"] = [];
  const matches: Match[] = [];
  for (let r = 0; r < total; r++) {
    const name = roundName(r, total);
    const ms: BracketMatch[] = [];
    for (let i = 0; i < size / 2 ** (r + 1); i++) {
      const m = mkMatch();
      m.tour = `${tour} // ${name.toUpperCase()}`;
      if (r === 0) {
        m.a.name = `TEAM ${2 * i + 1}`;
        m.b.name = `TEAM ${2 * i + 2}`;
        m.a.abbr = `T${2 * i + 1}`;
        m.b.abbr = `T${2 * i + 2}`;
      } else {
        m.a.name = m.b.name = "TBD";
        m.a.abbr = m.b.abbr = "TBD";
      }
      matches.push(m);
      ms.push({
        id: uid(),
        matchId: m.id,
        nextMatchId: null,
        completed: false,
        label: label(name, r, i),
      });
    }
    rounds.push({ id: uid(), name, matches: ms });
  }
  rounds.forEach((rd, r) => {
    if (r < total - 1)
      rd.matches.forEach((bm, i) => {
        bm.nextMatchId = rounds[r + 1].matches[i >> 1].id;
      });
  });
  return { bracket: { format: "single-elimination", rounds }, matches };
}

export function locate(b: Bracket, id: string) {
  for (let r = 0; r < b.rounds.length; r++) {
    const i = b.rounds[r].matches.findIndex((x) => x.id === id);
    if (i >= 0) return { r, i, bm: b.rounds[r].matches[i] };
  }
  return null;
}

/** Who has won the series? Needs the BO1/BO3/BO5 win target, unless force=true (then higher score wins). */
export function winnerOf(m: Match, force = false): "a" | "b" | null {
  const n = NEED[m.fmt];
  if (m.a.score >= n && m.a.score > m.b.score) return "a";
  if (m.b.score >= n && m.b.score > m.a.score) return "b";
  if (force && m.a.score !== m.b.score)
    return m.a.score > m.b.score ? "a" : "b";
  return null;
}

export interface Result {
  ok: boolean;
  note: string;
  canForce?: boolean;
}

/** Marks a bracket match complete and moves the winner into the next match (mutates the draft state d). */
export function completeMatch(d: State, id: string, force = false): Result {
  const loc = d.bracket && locate(d.bracket, id);
  if (!d.bracket || !loc)
    return { ok: false, note: "Bracket match not found." };
  const m = d.matches.find((x) => x.id === loc.bm.matchId);
  if (!m)
    return {
      ok: false,
      note: "The match linked to this slot no longer exists.",
    };
  const w = winnerOf(m, force);
  if (!w)
    return {
      ok: false,
      canForce: m.a.score !== m.b.score,
      note: `No winner yet: a team needs ${NEED[m.fmt]} win(s) in a ${m.fmt}.`,
    };

  loc.bm.completed = true;
  const next = loc.bm.nextMatchId
    ? locate(d.bracket, loc.bm.nextMatchId)
    : null;
  if (!next) return { ok: true, note: `🏆 ${m[w].name} wins the tournament!` };
  const nm = d.matches.find((x) => x.id === next.bm.matchId);
  if (!nm)
    return {
      ok: true,
      note: `${next.bm.label} has no linked match, so nobody was placed.`,
    };

  const slot = loc.i % 2 === 0 ? "a" : "b"; // top feeder → team A, bottom feeder → team B
  const cur = nm[slot];
  if (!cur.name || cur.name === "TBD") {
    nm[slot] = { ...structuredClone(m[w]), score: 0 };
    return { ok: true, note: `${m[w].name} advances to ${next.bm.label}.` };
  }
  if (cur.name === m[w].name)
    return {
      ok: true,
      note: `${m[w].name} was already placed in ${next.bm.label}.`,
    };
  return {
    ok: true,
    note: `⚠ ${next.bm.label} already has "${cur.name}" in that slot, so it was NOT overwritten. Edit it manually if needed.`,
  };
}

export function reopenMatch(d: State, id: string): void {
  const loc = d.bracket && locate(d.bracket, id);
  if (loc) loc.bm.completed = false; // teams already advanced are left as they are
}
