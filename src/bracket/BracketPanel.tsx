import { useState } from "react";
import { mkMatch, type Match, type State } from "../model";
import {
  STAGES,
  addRound,
  addSlot,
  clearRoundNames,
  completeMatch,
  createBracket,
  labelOf,
  linkPairs,
  removeRound,
  removeSlot,
  renameRound,
  reopenMatch,
  setBracket,
  setNext,
  startManual,
  winnerOf,
} from "./bracket";

interface Props {
  st: State;
  pid: string; // the bracket screen being edited (each screen has its own bracket)
  up: (f: (d: State) => void) => void;
  onCur: (matchId: string) => void;
  onEdit: (matchId: string) => void;
  ask: (msg: string, yes: () => void) => void;
  say: (msg: string) => void;
}
// remove a trailing " // QUARTER FINAL"-style suffix so repeated creation never doubles it
const baseTour = (t = "") =>
  t.replace(/( \/\/ (QUARTER FINAL|SEMI FINAL|FINAL|ROUND \d+))+$/i, "") ||
  "TOURNAMENT";
const name = (m: Match) => `${m.a.name} vs ${m.b.name}`;

export default function BracketPanel({
  st,
  pid,
  up,
  onCur,
  onEdit,
  ask,
  say,
}: Props) {
  const [size, setSize] = useState(8);
  const [tour, setTour] = useState(() =>
    baseTour(st.matches.find((x) => x.id === st.curId)?.tour),
  );
  const b = st.pages.find((x) => x.id === pid)?.bracket ?? null;
  const find = (id: string) => st.matches.find((x) => x.id === id);
  const allSlots = b ? b.rounds.flatMap((r) => r.matches) : [];
  const used = new Set(allSlots.map((s) => s.matchId));
  const feeders = (id: string) =>
    allSlots.filter((s) => s.nextMatchId === id).length;

  /** Runs an edit on a copy first; if it returns an error text, shows it instead of changing anything. */
  const run = (f: (d: State) => string | void) => {
    const err = f(structuredClone(st));
    if (err) return say(err);
    up((d) => {
      f(d);
    });
  };

  const createAuto = () => {
    const go = () => {
      const made = createBracket(size, tour.trim() || "TOURNAMENT");
      up((d) => {
        setBracket(d, pid, made.bracket);
        d.matches.push(...made.matches);
      });
    };
    if (b)
      ask("Replace this bracket? Its matches stay in your match list.", go);
    else go();
  };
  const complete = (id: string, force = false) => {
    const r = completeMatch(structuredClone(st), pid, id, force); // dry run on a copy first
    if (!r.ok && r.canForce && !force)
      return ask(
        `${r.note}\n\nComplete anyway (the team with more points wins)?`,
        () => complete(id, true),
      );
    if (!r.ok) return say(r.note);
    up((d) => {
      completeMatch(d, pid, id, force);
    });
    say(r.note);
  };
  const delAll = () =>
    ask(
      "Delete this bracket AND every match it uses (matches used by your other brackets are kept)? Their teams and scores are lost.",
      () =>
        up((d) => {
          const pg = d.pages.find((x) => x.id === pid);
          if (!pg?.bracket) return;
          const keep = new Set(
            d.pages
              .filter((x) => x.id !== pid)
              .flatMap((x) =>
                x.bracket
                  ? x.bracket.rounds.flatMap((r) =>
                      r.matches.map((m) => m.matchId),
                    )
                  : [],
              ),
          );
          const ids = new Set(
            pg.bracket.rounds
              .flatMap((r) => r.matches.map((m) => m.matchId))
              .filter((i) => !keep.has(i)),
          );
          pg.bracket = null;
          d.matches = d.matches.filter((x) => !ids.has(x.id));
          if (!d.matches.length) d.matches.push(mkMatch());
          if (!d.matches.some((x) => x.id === d.curId))
            d.curId = d.matches[0].id;
        }),
    );

  const autoForm = (
    <details style={{ marginTop: 14 }}>
      <summary>
        Advanced: auto-advancing bracket for 2 / 4 / 8 / 16 teams
      </summary>
      <p className="hint">
        Builds the rounds and matches for you, without naming the rounds (you
        type the names). “Complete &amp; advance” moves winners on.
      </p>
      <div className="txt">
        <span>Tournament name</span>
        <input value={tour} onChange={(e) => setTour(e.target.value)} />
      </div>
      <div className="btns">
        Teams:{" "}
        <select value={size} onChange={(e) => setSize(+e.target.value)}>
          {[2, 4, 8, 16].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <button className="go" onClick={createAuto}>
          Create automatic bracket
        </button>
      </div>
    </details>
  );

  if (!b)
    return (
      <div>
        <h3>🏆 BRACKET</h3>
        <p className="hint">
          Build it step by step: start an empty bracket, add a round, add
          matches into it, then choose where each winner goes. You type the
          round names yourself (Quarter Final, Semi Final, Final… or anything) —
          nothing is named or tagged for you.
        </p>
        <div className="btns">
          <button className="go" onClick={() => up((d) => startManual(d, pid))}>
            Start a new bracket
          </button>
        </div>
        {autoForm}
      </div>
    );

  return (
    <div>
      <h3>🏆 BRACKET</h3>
      <p className="hint">
        Step by step: ① type a round name (optional) ② “+ New match” (or add an
        existing one) ③ on each match, pick <b>Winner goes to</b> (or press{" "}
        <b>Link pairs →</b> on the round) ④ “+ Add round” for the next stage.
        Winners move up when you press “Complete &amp; advance”.
      </p>
      <datalist id="stages-b">
        {STAGES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="rounds">
        {b.rounds.map((rd, r) => (
          <div className="rcol" key={rd.id}>
            <input
              list="stages-b"
              placeholder={`Round ${r + 1} name (e.g. Semi Final)`}
              value={rd.name}
              onChange={(e) =>
                up((d) => renameRound(d, pid, rd.id, e.target.value))
              }
            />
            <div className="btns">
              {r < b.rounds.length - 1 && (
                <button
                  title="Send this round's winners to the next round, two by two"
                  onClick={() => run((d) => linkPairs(d, pid, rd.id))}
                >
                  Link pairs →
                </button>
              )}
              <button
                className="danger"
                onClick={() =>
                  ask(
                    `Remove ${rd.name || "round " + (r + 1)}? Its matches stay in your match list.`,
                    () => up((d) => removeRound(d, pid, rd.id)),
                  )
                }
              >
                Remove round
              </button>
            </div>

            {rd.matches.map((bm) => {
              const m = find(bm.matchId);
              const w = m && bm.completed ? winnerOf(m, true) : null;
              return (
                <div
                  key={bm.id}
                  className={
                    "bm" +
                    (bm.completed ? " done" : "") +
                    (m && m.id === st.curId ? " cur" : "")
                  }
                >
                  <div className="bmh">
                    <b>{labelOf(b, bm.id)}</b>
                    {bm.completed && <span className="tag n">DONE</span>}
                    <span style={{ flex: 1 }} />
                    <button
                      className="danger"
                      title="Remove this slot (the match stays in your list)"
                      onClick={() => up((d) => removeSlot(d, pid, bm.id))}
                    >
                      ✕
                    </button>
                  </div>
                  {m ? (
                    (["a", "b"] as const).map((t) => (
                      <div key={t} className={"t" + (w === t ? " win" : "")}>
                        <span>{m[t].name}</span>
                        <b>{m[t].score}</b>
                      </div>
                    ))
                  ) : (
                    <i>linked match missing</i>
                  )}
                  <select
                    value={bm.matchId}
                    title="Which match this slot uses"
                    onChange={(e) =>
                      up((d) => {
                        d.pages
                          .find((x) => x.id === pid)
                          ?.bracket?.rounds.forEach((x) =>
                            x.matches.forEach((s) => {
                              if (s.id === bm.id) s.matchId = e.target.value;
                            }),
                          );
                      })
                    }
                  >
                    {!m && <option value={bm.matchId}>— pick a match —</option>}
                    {st.matches
                      .filter((x) => x.id === bm.matchId || !used.has(x.id))
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {st.matches.indexOf(x) + 1}. {name(x)}
                        </option>
                      ))}
                  </select>
                  <select
                    value={bm.nextMatchId || ""}
                    title="Where does the winner go?"
                    onChange={(e) =>
                      run((d) => setNext(d, pid, bm.id, e.target.value || null))
                    }
                  >
                    <option value="">Winner goes to… (nowhere)</option>
                    {b.rounds.slice(r + 1).flatMap((rr) =>
                      rr.matches.map((t) => {
                        const tm = find(t.matchId);
                        return (
                          <option
                            key={t.id}
                            value={t.id}
                            disabled={
                              t.id !== bm.nextMatchId && feeders(t.id) >= 2
                            }
                          >
                            ↑ {labelOf(b, t.id)}
                            {tm ? ` (${name(tm)})` : ""}
                          </option>
                        );
                      }),
                    )}
                  </select>
                  <div className="btns">
                    <button className="go" onClick={() => onCur(bm.matchId)}>
                      Make current
                    </button>
                    <button onClick={() => onEdit(bm.matchId)}>Edit</button>
                    {bm.completed ? (
                      <button
                        onClick={() => up((d) => reopenMatch(d, pid, bm.id))}
                      >
                        Reopen
                      </button>
                    ) : (
                      <button onClick={() => complete(bm.id)}>
                        Complete &amp; advance
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="btns">
              <button
                className="go"
                onClick={() => up((d) => addSlot(d, pid, rd.id))}
              >
                + New match
              </button>
              <select
                value=""
                onChange={(e) =>
                  e.target.value &&
                  up((d) => addSlot(d, pid, rd.id, e.target.value))
                }
              >
                <option value="">+ Existing match…</option>
                {st.matches
                  .filter((x) => !used.has(x.id))
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {st.matches.indexOf(x) + 1}. {name(x)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
        <div className="rcol">
          <button className="go" onClick={() => up((d) => addRound(d, pid))}>
            + Add round
          </button>
        </div>
      </div>
      <div className="btns">
        <button onClick={() => up((d) => clearRoundNames(d, pid))}>
          Clear all round names
        </button>
        <button
          className="danger"
          onClick={() =>
            ask("Delete this bracket? Your matches and scores are kept.", () =>
              up((d) => setBracket(d, pid, null)),
            )
          }
        >
          Delete bracket (keep matches)
        </button>
        <button className="danger" onClick={delAll}>
          Delete bracket + its matches
        </button>
      </div>
      {autoForm}
    </div>
  );
}
