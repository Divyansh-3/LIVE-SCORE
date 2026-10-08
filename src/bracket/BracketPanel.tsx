import { useState } from "react";
import { mkMatch, type Match, type State } from "../model";
import {
  STAGES,
  completeMatch,
  createBracket,
  createBracketN,
  locate,
  reopenMatch,
  winnerOf,
} from "./bracket";

interface Props {
  st: State;
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
  up,
  onCur,
  onEdit,
  ask,
  say,
}: Props) {
  const [size, setSize] = useState(8);
  const [addN, setAddN] = useState(2);
  const b = st.bracket;
  const cur = st.matches.find((x) => x.id === st.curId);
  const [tour, setTour] = useState(() => baseTour(cur?.tour));

  const create = () => {
    const go = () => {
      const made = createBracket(size, tour.trim() || "TOURNAMENT");
      up((d) => {
        d.bracket = made.bracket;
        d.matches.push(...made.matches);
      });
    };
    if (b)
      ask(
        "Replace the current bracket? Its matches stay in your match list.",
        go,
      );
    else go();
  };

  // Create a bracket from N new best-of-3 matches (rename the rounds afterwards)
  const addMatches = () => {
    const go = () => {
      const made = createBracketN(addN, baseTour(cur?.tour));
      up((d) => {
        d.bracket = made.bracket;
        d.matches.push(...made.matches);
      });
    };
    if (b)
      ask(
        "Replace the current bracket? Its matches stay in your match list.",
        go,
      );
    else go();
  };

  const complete = (id: string, force = false) => {
    const r = completeMatch(structuredClone(st), id, force); // dry run on a copy first
    if (!r.ok && r.canForce && !force)
      return ask(
        `${r.note}\n\nComplete anyway (the team with more points wins)?`,
        () => complete(id, true),
      );
    if (!r.ok) return say(r.note);
    up((d) => {
      completeMatch(d, id, force);
    });
    say(r.note);
  };

  const delAll = () =>
    ask(
      "Delete the bracket AND every match it uses? Their teams and scores are lost.",
      doDelAll,
    );
  const doDelAll = () => {
    up((d) => {
      const ids = new Set(
        d.bracket!.rounds.flatMap((r) => r.matches.map((m) => m.matchId)),
      );
      d.bracket = null;
      d.matches = d.matches.filter((x) => !ids.has(x.id));
      if (!d.matches.length) d.matches.push(mkMatch());
      if (!d.matches.some((x) => x.id === d.curId)) d.curId = d.matches[0].id;
    });
  };

  if (!b)
    return (
      <div>
        <h3>🏆 BRACKET FROM YOUR MATCHES</h3>
        <p className="hint">
          Pick how many matches you want and press “Create bracket”. The rounds
          are built for you and you can rename any round afterwards (Semi Final,
          Quarter Final, Group Stage…). Or tag existing matches by hand below.
          Leave a match blank to keep it out of the tag-based bracket.
        </p>
        <datalist id="stages-b">
          {STAGES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="btns">
          Matches:{" "}
          <select value={addN} onChange={(e) => setAddN(+e.target.value)}>
            {[2, 4, 6, 8, 10, 12, 14, 16].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <button className="go" onClick={addMatches}>
            Create bracket
          </button>
        </div>

        {st.matches.map((m, i) => (
          <div className="txt" key={m.id}>
            <span style={{ minWidth: 250 }}>
              {i + 1}. {name(m)}
            </span>
            <input
              list="stages-b"
              placeholder="stage tag"
              value={m.stage || ""}
              onChange={(e) =>
                up((d) => {
                  d.matches.find((x) => x.id === m.id)!.stage = e.target.value;
                })
              }
            />
            <button onClick={() => onEdit(m.id)}>Edit</button>
          </div>
        ))}
        <details style={{ marginTop: 14 }}>
          <summary>
            Advanced: auto-advancing bracket (creates new matches)
          </summary>
          <p className="hint">
            Creates empty matches for every slot, and “Complete &amp; advance”
            moves winners on automatically.
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
            <button className="go" onClick={create}>
              Create bracket
            </button>
          </div>
        </details>
      </div>
    );

  return (
    <div>
      <h3>🏆 BRACKET — {b.format}</h3>
      <p className="hint">
        Scores are the normal match scores. “Make current” puts that match on
        the scoreboard; “Complete &amp; advance” moves the winner on. Click a
        round name to rename it.
      </p>
      <div className="rounds">
        {b.rounds.map((rd) => (
          <div className="rcol" key={rd.id}>
            <input
              list="stages-b"
              value={rd.name}
              title="Rename this round"
              onChange={(e) =>
                up((d) => {
                  const r = d.bracket!.rounds.find((x) => x.id === rd.id)!;
                  r.name = e.target.value;
                  r.matches.forEach((bm) => {
                    const m = d.matches.find((x) => x.id === bm.matchId);
                    if (m) m.stage = e.target.value;
                  });
                })
              }
            />
            {rd.matches.map((bm) => {
              const m = st.matches.find((x) => x.id === bm.matchId);
              const next = bm.nextMatchId
                ? locate(b, bm.nextMatchId)?.bm.label
                : null;
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
                    <b>{bm.label}</b>
                    {next && <span className="hint">→ {next}</span>}
                    {bm.completed && <span className="tag n">DONE</span>}
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
                        locate(d.bracket!, bm.id)!.bm.matchId = e.target.value;
                      })
                    }
                  >
                    {!m && <option value={bm.matchId}>— pick a match —</option>}
                    {st.matches.map((x, i) => (
                      <option key={x.id} value={x.id}>
                        {i + 1}. {name(x)}
                      </option>
                    ))}
                  </select>
                  <div className="btns">
                    <button className="go" onClick={() => onCur(bm.matchId)}>
                      Make current
                    </button>
                    <button onClick={() => onEdit(bm.matchId)}>Edit</button>
                    {bm.completed ? (
                      <button onClick={() => up((d) => reopenMatch(d, bm.id))}>
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
          </div>
        ))}
      </div>
      <div className="btns">
        <button
          className="danger"
          onClick={() =>
            ask("Delete the bracket? Your matches and scores are kept.", () =>
              up((d) => {
                d.bracket = null;
              }),
            )
          }
        >
          Delete bracket (keep matches)
        </button>
        <button className="danger" onClick={delAll}>
          Delete bracket + its matches
        </button>
      </div>
    </div>
  );
}
