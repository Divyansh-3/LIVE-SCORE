import { useState } from "react";
import type { LeagueTable, State } from "../model";
import {
  TABLE_SIZES,
  champion,
  createTable,
  isComplete,
  matchStatus,
  rebuild,
  resetResults,
  standings,
  validateTable,
  type Status,
} from "./table";

interface Props {
  st: State;
  pid: string;
  up: (f: (d: State) => void) => void;
  ask: (msg: string, yes: () => void) => void;
  say: (msg: string) => void;
}
const LABEL: Record<Status, string> = {
  completed: "COMPLETED",
  ongoing: "ONGOING",
  next: "UP NEXT",
  pending: "PENDING",
};

export default function TablePanel({ st, pid, up, ask, say }: Props) {
  const t = st.pages.find((x) => x.id === pid)?.table ?? null;
  const [name, setName] = useState("Group A"),
    [n, setN] = useState(8),
    [double, setDouble] = useState(false),
    [win, setWin] = useState(3),
    [draw, setDraw] = useState(1);
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: 8 }, (_, i) => `TEAM ${i + 1}`),
  );
  const [newN, setNewN] = useState(0);

  const setCount = (c: number) => {
    setN(c);
    setNames((prev) =>
      Array.from({ length: c }, (_, i) => prev[i] ?? `TEAM ${i + 1}`),
    );
  };
  const edit = (f: (x: LeagueTable) => void) =>
    up((d) => {
      const x = d.pages.find((y) => y.id === pid)?.table;
      if (x) f(x);
    });

  // ------------------------------------------------------------ create
  if (!t)
    return (
      <div>
        <h3>📊 CREATE A TABLE</h3>
        <p className="hint">
          Every team plays every other team. Wins give points, and the table
          ranks teams automatically. You can edit names and results afterwards.
        </p>
        <div className="txt">
          <span>Table name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="txt">
          <span>Number of teams</span>
          <select value={n} onChange={(e) => setCount(+e.target.value)}>
            {TABLE_SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="txt">
          <span>Format</span>
          <select
            value={double ? "d" : "s"}
            onChange={(e) => setDouble(e.target.value === "d")}
          >
            <option value="s">Everyone plays everyone once</option>
            <option value="d">Home &amp; away (twice)</option>
          </select>
        </div>
        <div className="txt">
          <span>Points</span>Win{" "}
          <input
            type="number"
            min={0}
            value={win}
            onChange={(e) => setWin(Math.max(0, +e.target.value))}
          />{" "}
          Draw{" "}
          <input
            type="number"
            min={0}
            value={draw}
            onChange={(e) => setDraw(Math.max(0, +e.target.value))}
          />
        </div>
        <h3>TEAMS</h3>
        <div className="teamgrid">
          {names.map((v, i) => (
            <div className="txt" key={i}>
              <span style={{ minWidth: 60 }}>Team {i + 1}</span>
              <input
                value={v}
                onChange={(e) =>
                  setNames(names.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
            </div>
          ))}
        </div>
        <div className="btns">
          <button
            className="go"
            onClick={() => {
              const err = validateTable(name, names);
              if (err) return say(err);
              up((d) => {
                const p = d.pages.find((x) => x.id === pid)!;
                p.table = createTable(name, names, { double, win, draw });
                p.title = name.trim();
              });
            }}
          >
            Create table
          </button>
        </div>
      </div>
    );

  // ------------------------------------------------------------ manage
  const rows = standings(t),
    champ = champion(t);
  const nameOf = (id: string) => t.teams.find((x) => x.id === id)?.name ?? "?";
  const rounds = [...new Set(t.matches.map((m) => m.round))];
  const firstOpen = t.matches.find(
    (m) => m.sa === null || m.sb === null,
  )?.round;
  const done = t.matches.filter((m) => m.sa !== null && m.sb !== null).length;
  const dupNames = new Set(
    t.teams
      .map((x) => x.name.trim().toLowerCase())
      .filter((k, i, a) => a.indexOf(k) !== i),
  );
  const target = newN || t.teams.length;
  const setScore = (id: string, k: "sa" | "sb", v: string) =>
    edit((x) => {
      const m = x.matches.find((y) => y.id === id);
      if (m) m[k] = v === "" ? null : Math.max(0, Math.floor(+v) || 0);
    });

  return (
    <div>
      <h3>
        📊 TABLE — {t.teams.length} teams · {done}/{t.matches.length} played
      </h3>
      {champ && (
        <p className="champ">
          🏆 Champion: <b>{champ.name}</b> ({champ.pts} pts)
        </p>
      )}
      {!champ && isComplete(t) === false && (
        <p className="hint">
          The champion appears here when every match has a result.
        </p>
      )}

      <div className="txt">
        <span>Table name</span>
        <input
          value={t.name}
          onChange={(e) =>
            edit((x) => {
              x.name = e.target.value;
            })
          }
        />
      </div>
      <div className="txt">
        <span>Points</span>Win{" "}
        <input
          type="number"
          min={0}
          value={t.win}
          onChange={(e) =>
            edit((x) => {
              x.win = Math.max(0, +e.target.value);
            })
          }
        />{" "}
        Draw{" "}
        <input
          type="number"
          min={0}
          value={t.draw}
          onChange={(e) =>
            edit((x) => {
              x.draw = Math.max(0, +e.target.value);
            })
          }
        />
      </div>

      <h3>STANDINGS</h3>
      <table className="stand">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>+/−</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.rank === 1 ? "top" : ""}>
              <td>{r.rank}</td>
              <td>{r.name}</td>
              <td>{r.p}</td>
              <td>{r.w}</td>
              <td>{r.d}</td>
              <td>{r.l}</td>
              <td>{r.gd}</td>
              <td>
                <b>{r.pts}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>MATCHES &amp; RESULTS</h3>
      <p className="hint">
        Type both scores to complete a match. Leave a score empty to clear it.
      </p>
      {rounds.map((r) => {
        const ms = t.matches.filter((m) => m.round === r);
        return (
          <details key={r} open={r === firstOpen} className="rnd">
            <summary>
              Round {r}{" "}
              <span className="hint">
                {ms.filter((m) => m.sa !== null && m.sb !== null).length}/
                {ms.length} done
              </span>
            </summary>
            {ms.map((m) => {
              const s = matchStatus(t, m);
              return (
                <div className="fx" key={m.id}>
                  <span className={"stt " + s}>{LABEL[s]}</span>
                  <span className="fa">{nameOf(m.a)}</span>
                  <input
                    type="number"
                    min={0}
                    value={m.sa ?? ""}
                    onChange={(e) => setScore(m.id, "sa", e.target.value)}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    min={0}
                    value={m.sb ?? ""}
                    onChange={(e) => setScore(m.id, "sb", e.target.value)}
                  />
                  <span className="fb">{nameOf(m.b)}</span>
                </div>
              );
            })}
          </details>
        );
      })}

      <h3>TEAMS</h3>
      <p className="hint">
        Rename or replace a team any time — its results stay.{" "}
        {dupNames.size > 0 && (
          <b style={{ color: "#ff6b6b" }}>Two teams have the same name.</b>
        )}
      </p>
      <div className="teamgrid">
        {t.teams.map((x, i) => (
          <div className="txt" key={x.id}>
            <span style={{ minWidth: 60 }}>Team {i + 1}</span>
            <input
              value={x.name}
              onChange={(e) =>
                edit((y) => {
                  y.teams[i].name = e.target.value;
                })
              }
            />
          </div>
        ))}
      </div>

      <h3>CHANGE TABLE SIZE / FORMAT</h3>
      <div className="btns">
        Teams:{" "}
        <select value={target} onChange={(e) => setNewN(+e.target.value)}>
          {TABLE_SIZES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() =>
            ask(
              `Change to ${target} teams? Fixtures are rebuilt and ALL results in this table are cleared (team names are kept).`,
              () => edit((x) => rebuild(x, target)),
            )
          }
          disabled={target === t.teams.length}
        >
          Apply team count
        </button>
        <button
          onClick={() =>
            ask(
              `Switch to ${t.double ? "single" : "home & away"} format? Fixtures are rebuilt and ALL results are cleared.`,
              () => edit((x) => rebuild(x, x.teams.length, !x.double)),
            )
          }
        >
          {t.double ? "Make single round" : "Make home & away"}
        </button>
      </div>

      <div className="btns" style={{ marginTop: 14 }}>
        <button
          className="danger"
          onClick={() =>
            ask("Reset ALL results in this table? Teams are kept.", () =>
              edit(resetResults),
            )
          }
        >
          Reset results
        </button>
        <button
          className="danger"
          onClick={() =>
            ask("Delete this table’s teams and results and start again?", () =>
              up((d) => {
                const p = d.pages.find((x) => x.id === pid);
                if (p) p.table = null;
              }),
            )
          }
        >
          Delete table data
        </button>
      </div>
    </div>
  );
}
