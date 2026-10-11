import type { ScheduleItem, State } from "../model";
import { uid } from "../model";

interface Props {
  st: State;
  pid: string;
  up: (f: (d: State) => void) => void;
  ask: (msg: string, yes: () => void) => void;
}

/** Editor for the "Today's matches" list: pick matches from your match list, order them, type a time for each. */
export default function SchedulePanel({ st, pid, up, ask }: Props) {
  const items = st.pages.find((x) => x.id === pid)?.schedule ?? [];
  const edit = (f: (s: ScheduleItem[]) => void) =>
    up((d) => {
      const p = d.pages.find((x) => x.id === pid);
      if (p) {
        p.schedule ??= [];
        f(p.schedule);
      }
    });
  const listed = new Set(items.map((i) => i.matchId));
  const label = (id: string) => {
    const m = st.matches.find((x) => x.id === id);
    return m
      ? `${st.matches.indexOf(m) + 1}. ${m.a.name} vs ${m.b.name}`
      : "(deleted match)";
  };
  const move = (i: number, dir: number) =>
    edit((s) => {
      const j = i + dir;
      if (j >= 0 && j < s.length) [s[i], s[j]] = [s[j], s[i]];
    });

  return (
    <div>
      <h3>🗓 MATCHES ON THIS SCREEN</h3>
      <p className="hint">
        They appear on OBS in this order. Scores, teams and formats come from
        your match list, so they always stay up to date. The time is just text
        you type.
      </p>
      {items.map((it, i) => (
        <div className="fx2" key={it.id}>
          <input
            placeholder="time, e.g. 6:00 PM"
            value={it.time}
            onChange={(e) =>
              edit((s) => {
                s[i].time = e.target.value;
              })
            }
          />
          <select
            value={it.matchId}
            onChange={(e) =>
              edit((s) => {
                s[i].matchId = e.target.value;
              })
            }
          >
            {!st.matches.some((x) => x.id === it.matchId) && (
              <option value={it.matchId}>{label(it.matchId)}</option>
            )}
            {st.matches.map((m, k) => (
              <option key={m.id} value={m.id}>
                {k + 1}. {m.a.name} vs {m.b.name}
              </option>
            ))}
          </select>
          <button onClick={() => move(i, -1)} title="Move up">
            ↑
          </button>
          <button onClick={() => move(i, 1)} title="Move down">
            ↓
          </button>
          <button
            className="danger"
            onClick={() =>
              edit((s) => {
                s.splice(i, 1);
              })
            }
            title="Remove from this screen (the match stays in your list)"
          >
            ✕
          </button>
        </div>
      ))}
      {!items.length && <p className="hint">No matches yet. Add some below.</p>}
      <div className="btns">
        <select
          value=""
          onChange={(e) =>
            e.target.value &&
            edit((s) => {
              s.push({ id: uid(), matchId: e.target.value, time: "" });
            })
          }
        >
          <option value="">+ Add a match…</option>
          {st.matches
            .filter((m) => !listed.has(m.id))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {st.matches.indexOf(m) + 1}. {m.a.name} vs {m.b.name}
              </option>
            ))}
        </select>
        <button
          onClick={() =>
            edit((s) => {
              st.matches
                .filter((m) => !listed.has(m.id))
                .forEach((m) => s.push({ id: uid(), matchId: m.id, time: "" }));
            })
          }
        >
          Add all matches
        </button>
        <button
          className="danger"
          onClick={() =>
            ask(
              "Remove every match from this screen? Your matches stay in your match list.",
              () =>
                edit((s) => {
                  s.length = 0;
                }),
            )
          }
        >
          Clear list
        </button>
      </div>
    </div>
  );
}
