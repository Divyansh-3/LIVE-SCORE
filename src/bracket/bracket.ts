// Bracket logic. Every bracket SCREEN (a page with kind 'bracket') owns its own bracket, so you can have several.
// A bracket slot never stores scores – it only points at an existing Match (matchId),
// so the normal score controls and the overlay keep working unchanged.
//   • createBracket(): automatic single-elimination for 2/4/8/16 teams (rounds are NOT named – you type the names)
//   • startManual() + addRound/addSlot/setNext/…: build it yourself, step by step, with NO preset names or tags
// All functions that take (d, pid, …) mutate the draft state d; pid = the id of the bracket screen.
import {
  mkMatch,
  uid,
  type Bracket,
  type BracketMatch,
  type Match,
  type State,
} from "../model";

const NEED = { BO1: 1, BO3: 2, BO5: 3 }; // wins needed to take the series

export const STAGES = [
  "Round of 32",
  "Round of 16",
  "Quarter Final",
  "Semi Final",
  "Final",
  "Third Place",
  "Group Stage",
];
const RANK: Record<string, number> = {
  "group stage": -1,
  "round of 32": 0,
  "round of 16": 1,
  "quarter final": 2,
  "semi final": 3,
  final: 4,
  "third place": 5,
};

/** Groups matches by their (optional) stage tag, ordered Round of 32 → … → Final. Untagged matches are ignored. */
export function stageColumns(
  ms: Match[],
): { name: string; matches: Match[] }[] {
  const cols = new Map<
    string,
    { name: string; matches: Match[]; rank: number }
  >();
  for (const m of ms) {
    const name = (m.stage || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!cols.has(key))
      cols.set(key, { name, matches: [], rank: RANK[key] ?? 10 + cols.size });
    cols.get(key)!.matches.push(m);
  }
  return [...cols.values()].sort((a, b) => a.rank - b.rank);
}

const bkOf = (d: State, pid: string): Bracket | null =>
  d.pages.find((p) => p.id === pid)?.bracket ?? null;
export function setBracket(d: State, pid: string, b: Bracket | null): void {
  const pg = d.pages.find((p) => p.id === pid);
  if (pg) pg.bracket = b;
}

export function locate(b: Bracket, id: string) {
  for (let r = 0; r < b.rounds.length; r++) {
    const i = b.rounds[r].matches.findIndex((x) => x.id === id);
    if (i >= 0) return { r, i, bm: b.rounds[r].matches[i] };
  }
  return null;
}

/** Display name of a slot, e.g. "Semi Final #2" (or "Round 2 #1" while the round has no name). */
export const labelOf = (b: Bracket, id: string) => {
  const l = locate(b, id);
  return l ? `${b.rounds[l.r].name || "Round " + (l.r + 1)} #${l.i + 1}` : "?";
};

// ---------------------------------------------------------------- automatic bracket (teams)
/** size = number of teams (2, 4, 8 or 16). Returns the bracket plus the NEW Match objects to add to state.matches. */
export function createBracket(
  size: number,
  tour: string,
): { bracket: Bracket; matches: Match[] } {
  const total = Math.log2(size);
  const rounds: Bracket["rounds"] = [];
  const matches: Match[] = [];
  for (let r = 0; r < total; r++) {
    const name = ""; // no preset round names or tags
    const ms: BracketMatch[] = [];
    for (let i = 0; i < size / 2 ** (r + 1); i++) {
      const m = mkMatch();
      m.tour = tour;
      m.stage = name;
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
        label: "",
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

// ---------------------------------------------------------------- manual bracket
const feedersOf = (b: Bracket, id: string) =>
  b.rounds.flatMap((r) => r.matches).filter((x) => x.nextMatchId === id);

/** Empty bracket: one round with no name and no matches. Nothing is tagged or named for you. */
export function startManual(d: State, pid: string): void {
  setBracket(d, pid, {
    format: "single-elimination",
    rounds: [{ id: uid(), name: "", matches: [] }],
  });
}
export function addRound(d: State, pid: string): void {
  bkOf(d, pid)?.rounds.push({ id: uid(), name: "", matches: [] });
}

/** Renaming a round also sets the stage tag shown on the scoreboard for that round's matches. */
export function renameRound(
  d: State,
  pid: string,
  rid: string,
  name: string,
): void {
  const rd = bkOf(d, pid)?.rounds.find((x) => x.id === rid);
  if (!rd) return;
  rd.name = name;
  rd.matches.forEach((bm) => {
    const m = d.matches.find((x) => x.id === bm.matchId);
    if (m) m.stage = name;
  });
}

export function removeRound(d: State, pid: string, rid: string): void {
  const b = bkOf(d, pid);
  if (!b) return;
  const gone = new Set(
    b.rounds.find((r) => r.id === rid)?.matches.map((m) => m.id),
  );
  b.rounds = b.rounds.filter((r) => r.id !== rid);
  b.rounds.forEach((r) =>
    r.matches.forEach((m) => {
      if (m.nextMatchId && gone.has(m.nextMatchId)) m.nextMatchId = null;
    }),
  );
  if (!b.rounds.length) setBracket(d, pid, null);
}

/** Adds a slot to a round: a NEW match (blank teams; "TBD" after round 1) or an existing unused match. */
export function addSlot(
  d: State,
  pid: string,
  rid: string,
  existingId?: string,
): void {
  const b = bkOf(d, pid);
  const r = b ? b.rounds.findIndex((x) => x.id === rid) : -1;
  if (!b || r < 0) return;
  let matchId = existingId;
  if (!matchId) {
    const m = mkMatch();
    m.tour = d.matches.find((x) => x.id === d.curId)?.tour || "TOURNAMENT";
    m.fmt = "BO3";
    m.stage = b.rounds[r].name;
    if (r > 0) {
      m.a.name = m.b.name = "TBD";
      m.a.abbr = m.b.abbr = "TBD";
    }
    d.matches.push(m);
    matchId = m.id;
  }
  b.rounds[r].matches.push({
    id: uid(),
    matchId,
    nextMatchId: null,
    completed: false,
    label: "",
  });
}

/** Removes the slot only – the match itself stays in your match list. */
export function removeSlot(d: State, pid: string, bmId: string): void {
  const b = bkOf(d, pid);
  if (!b) return;
  b.rounds.forEach((r) => {
    r.matches = r.matches.filter((m) => m.id !== bmId);
    r.matches.forEach((m) => {
      if (m.nextMatchId === bmId) m.nextMatchId = null;
    });
  });
}

/** Where does this slot's winner go? Must be a slot in a LATER round with a free place (max 2 feeders). */
export function setNext(
  d: State,
  pid: string,
  bmId: string,
  next: string | null,
): string | void {
  const b = bkOf(d, pid),
    from = b && locate(b, bmId);
  if (!b || !from) return;
  if (next) {
    const to = locate(b, next);
    if (!to || to.r <= from.r)
      return "The winner can only go to a match in a later round.";
    if (from.bm.nextMatchId !== next && feedersOf(b, next).length >= 2)
      return "That match already has two matches feeding it.";
  }
  from.bm.nextMatchId = next;
}

/** Sends the winners of a round to the next round two-by-two: 1st+2nd → first match, 3rd+4th → second … */
export function linkPairs(d: State, pid: string, rid: string): string | void {
  const b = bkOf(d, pid),
    r = b ? b.rounds.findIndex((x) => x.id === rid) : -1;
  if (!b || r < 0 || r >= b.rounds.length - 1) return;
  const nx = b.rounds[r + 1];
  if (!nx.matches.length) return "Add matches to the next round first.";
  b.rounds[r].matches.forEach((bm, i) => {
    const t = nx.matches[i >> 1];
    bm.nextMatchId = t ? t.id : null;
  });
}

/** Removes every round name and the stage tags it put on the matches. */
export function clearRoundNames(d: State, pid: string): void {
  bkOf(d, pid)?.rounds.forEach((rd) => {
    rd.name = "";
    rd.matches.forEach((bm) => {
      const m = d.matches.find((x) => x.id === bm.matchId);
      if (m) m.stage = "";
    });
  });
}

// ---------------------------------------------------------------- results
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

/** Marks a slot complete and moves the winner into the slot it points to (mutates the draft state d). */
export function completeMatch(
  d: State,
  pid: string,
  id: string,
  force = false,
): Result {
  const b = bkOf(d, pid),
    loc = b && locate(b, id);
  if (!b || !loc) return { ok: false, note: "Bracket match not found." };
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
  const next = loc.bm.nextMatchId ? locate(b, loc.bm.nextMatchId) : null;
  if (!next) return { ok: true, note: `🏆 ${m[w].name} wins!` };
  const nm = d.matches.find((x) => x.id === next.bm.matchId);
  const where = labelOf(b, next.bm.id);
  if (!nm)
    return {
      ok: true,
      note: `${where} has no linked match, so nobody was placed.`,
    };

  const slot = feedersOf(b, next.bm.id).indexOf(loc.bm) % 2 === 0 ? "a" : "b"; // first feeder → team A, second → team B
  const cur = nm[slot];
  if (!cur.name || cur.name === "TBD") {
    nm[slot] = { ...structuredClone(m[w]), score: 0 };
    return { ok: true, note: `${m[w].name} advances to ${where}.` };
  }
  if (cur.name === m[w].name)
    return { ok: true, note: `${m[w].name} was already placed in ${where}.` };
  return {
    ok: true,
    note: `⚠ ${where} already has "${cur.name}" in that slot, so it was NOT overwritten. Edit it manually if needed.`,
  };
}

export function reopenMatch(d: State, pid: string, id: string): void {
  const b = bkOf(d, pid),
    loc = b && locate(b, id);
  if (loc) loc.bm.completed = false; // teams already advanced are left as they are
}
