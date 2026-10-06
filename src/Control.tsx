import { useEffect, useState } from "react";
import {
  PRESETS,
  cdLeft,
  fmtT,
  mkMatch,
  mkPage,
  mkState,
  migrate,
  useNow,
  type Match,
  type Page,
  type Scene,
  type State,
  type Style,
} from "./model";

const L: Record<string, string> = {
  plate: "Plate (W = width)",
  tournament: "Tournament name",
  tlogo: "Tournament logo",
  info: "Match info",
  map: "Map",
  logoA: "Team A logo",
  nameA: "Team A name",
  scoreA: "Team A score",
  logoB: "Team B logo",
  nameB: "Team B name",
  scoreB: "Team B score",
  cd: "Countdown",
  banner: "Banner (W = width)",
  btitle: "Break title",
  bsub: "Break subtitle",
  board: "Scoreboard (teams + score)",
  binfo: "Info line",
};
const FONTS = [
  "Bahnschrift",
  "Segoe UI",
  "Arial Black",
  "Impact",
  "Orbitron",
  "Rajdhani",
  "Oswald",
  "Teko",
  "Consolas",
  "Verdana",
];

function Num({
  l,
  v,
  set,
  step = 1,
  min = -9999,
  max = 99999,
}: {
  l: string;
  v: number;
  set: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const f = (n: number) => set(Math.min(max, Math.max(min, +n.toFixed(2))));
  return (
    <div className="num">
      <span>{l}</span>
      <button onClick={() => f(v - step)}>−</button>
      <input
        type="number"
        value={v}
        step={step}
        onChange={(e) => f(+e.target.value)}
      />
      <button onClick={() => f(v + step)}>+</button>
    </div>
  );
}
const Txt = ({
  l,
  v,
  set,
}: {
  l: string;
  v: string;
  set: (s: string) => void;
}) => (
  <div className="txt">
    <span>{l}</span>
    <input value={v} onChange={(e) => set(e.target.value)} />
  </div>
);
const Col = ({
  l,
  v,
  set,
}: {
  l: string;
  v: string;
  set: (s: string) => void;
}) => (
  <div className="num">
    <span>{l}</span>
    <input type="color" value={v} onChange={(e) => set(e.target.value)} />
  </div>
);
const Chk = ({
  l,
  v,
  set,
}: {
  l: string;
  v: boolean;
  set: (b: boolean) => void;
}) => (
  <label style={{ marginRight: 12 }}>
    <input
      type="checkbox"
      checked={v}
      onChange={(e) => set(e.target.checked)}
    />{" "}
    {l}
  </label>
);

// Images are downscaled and stored as data URLs inside the saved state (data/state.json),
// so they are not limited by the 5 MB localStorage quota. PNG/WEBP transparency is preserved.
async function load(f: File, max: number) {
  const bm = await createImageBitmap(f),
    r = Math.min(1, max / Math.max(bm.width, bm.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bm.width * r);
  c.height = Math.round(bm.height * r);
  c.getContext("2d")!.drawImage(bm, 0, 0, c.width, c.height);
  return c.toDataURL(
    f.type === "image/jpeg" ? "image/jpeg" : "image/webp",
    0.92,
  );
}
function Img({
  l,
  v,
  set,
  max = 1920,
}: {
  l: string;
  v: string;
  set: (s: string) => void;
  max?: number;
}) {
  return (
    <div className="num">
      <span>{l}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ width: 170 }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) set(await load(f, max));
          e.target.value = "";
        }}
      />
      {v && (
        <>
          <img src={v} height={28} style={{ background: "#444" }} />
          <button onClick={() => set("")}>✕</button>
        </>
      )}
    </div>
  );
}
const parseT = (s: string) => {
  const a = s.split(":").map(Number);
  return (a.length > 1 ? a[0] * 60 + a[1] : a[0]) * 1000 || 0;
};

export default function Control() {
  const [st, setSt] = useState<State | null>(null);
  const [sel, setSel] = useState("");
  const [tab, setTab] = useState<"page" | "match" | "layout" | "look">("page");
  const [pre, setPre] = useState("Modern"),
    [tgt, setTgt] = useState("this"),
    [tin, setTin] = useState("01:30"),
    [clk, setClk] = useState("22:00"),
    [msel, setMsel] = useState("");
  const now = useNow();
  const air = (id: string | null) => setSt((s) => s && { ...s, airId: id });
  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((s) => {
        const v: State = migrate(s) || mkState();
        setSt(v);
        setSel(v.airId || v.pages[0].id);
      });
  }, []);
  useEffect(() => {
    if (!st) return;
    const t = setTimeout(
      () => fetch("/api/state", { method: "POST", body: JSON.stringify(st) }),
      120,
    );
    return () => clearTimeout(t);
  }, [st]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (
        !st ||
        /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.key === "0") air(null);
      const i = +e.key;
      if (i >= 1 && st.pages[i - 1]) air(st.pages[i - 1].id);
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [st]);
  if (!st)
    return (
      <div className="cp">
        Loading… (make sure <code>npm run dev</code> is running)
      </div>
    );

  const up = (f: (d: State) => void) =>
    setSt((s) => {
      const d = structuredClone(s!);
      f(d);
      return d;
    });
  const p = st.pages.find((x) => x.id === sel) || st.pages[0];
  const cur = st.matches.find((x) => x.id === st.curId) || st.matches[0];
  const em = st.matches.find((x) => x.id === msel) || cur;
  const EM = (d: State) => d.matches.find((x) => x.id === em.id)!;
  const mname = (m: Match) => `${m.a.name} vs ${m.b.name}`;
  const PP = (d: State) => d.pages.find((x) => x.id === p.id)!;
  const setP = (f: (x: Page) => void) => up((d) => f(PP(d)));
  const sc = p.scene,
    S = sc.style;
  const sty = <K extends keyof Style>(k: K, v: Style[K]) =>
    up((d) => {
      PP(d).scene.style[k] = v;
    });
  const el = (id: string, k: "x" | "y" | "s" | "h", v: number) =>
    up((d) => {
      (PP(d).scene.layout[id] as any)[k] = v;
    });
  const airIdx = st.pages.findIndex((x) => x.id === st.airId);
  const onAir = p.id === st.airId;

  const run = !!sc.cd.endsAt && sc.cd.endsAt > now;
  const act = (a: string, v = 0) =>
    up((d) => {
      const c = PP(d).scene.cd,
        l = cdLeft(c),
        r = !!c.endsAt && c.endsAt > Date.now();
      if (a === "start" && !r) {
        const t = l > 0 ? l : c.total;
        c.left = t;
        c.endsAt = Date.now() + t;
      } else if (a === "pause") {
        c.left = l;
        c.endsAt = null;
      } else if (a === "reset") {
        c.left = c.total;
        c.endsAt = null;
      } else if (a === "add") {
        if (r) c.endsAt = Math.max(Date.now(), c.endsAt! + v);
        else {
          c.left = Math.max(0, l + v);
          c.endsAt = null;
        }
      } else if (a === "until") {
        c.total = v;
        c.left = v;
        c.endsAt = Date.now() + v;
      } else if (a === "set") {
        c.total = v;
        c.left = v;
        c.endsAt = null;
      }
    });
  const score = (t: "a" | "b", n: number) =>
    up((d) => {
      const m = d.matches.find((x) => x.id === d.curId) || d.matches[0];
      m[t].score = Math.max(0, m[t].score + n);
    });
  const setT = (t: "a" | "b", f: (x: State["match"]["a"]) => void) =>
    up((d) => f(EM(d)[t]));
  const add = () => {
    const np = mkPage("Break " + st.pages.length);
    up((d) => {
      d.pages.push(np);
    });
    setSel(np.id);
    setTab("page");
  };
  const dup = () => {
    const id = Math.random().toString(36).slice(2, 9);
    up((d) => {
      const i = d.pages.findIndex((x) => x.id === p.id),
        c = structuredClone(d.pages[i]);
      c.id = id;
      c.name += " copy";
      d.pages.splice(i + 1, 0, c);
    });
    setSel(id);
  };
  const del = () => {
    if (st.pages.length < 2 || !confirm(`Delete "${p.name}"?`)) return;
    const rest = st.pages.filter((x) => x.id !== p.id);
    up((d) => {
      d.pages = rest;
      if (d.airId === p.id) d.airId = null;
    });
    setSel(rest[0].id);
  };
  const move = (dir: number) =>
    up((d) => {
      const i = d.pages.findIndex((x) => x.id === p.id),
        j = i + dir;
      if (j < 0 || j >= d.pages.length) return;
      [d.pages[i], d.pages[j]] = [d.pages[j], d.pages[i]];
    });
  const apply = () => {
    const pr = pre === "Custom" ? st.custom : PRESETS[pre];
    if (!pr)
      return alert(
        'No custom look saved yet. Style a page, then press "Save current look as Custom".',
      );
    if (
      tgt === "all" &&
      !confirm(
        "Apply this look to ALL pages? Texts, images and scores are kept; only the style changes.",
      )
    )
      return;
    const f = (s: Scene) => {
      Object.assign(s.style, pr.style);
      if (pr.layout) s.layout = structuredClone(pr.layout);
    };
    up((d) => {
      if (tgt === "this") f(PP(d).scene);
      else d.pages.forEach((x) => f(x.scene));
    });
  };
  const exp = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(st)], { type: "application/json" }),
    );
    a.download = "scoreboard-config.json";
    a.click();
  };
  const imp = async (f: File) => {
    try {
      const s = migrate(JSON.parse(await f.text()));
      if (!s?.pages?.length) throw 0;
      setSt(s);
      setSel(s.airId || s.pages[0].id);
    } catch {
      alert("That file is not a valid scoreboard configuration.");
    }
  };
  const makeCur = (id: string) =>
    up((d) => {
      d.curId = id;
    });
  const addM = () => {
    const nm = mkMatch();
    nm.tour = cur.tour;
    nm.fmt = cur.fmt;
    up((d) => {
      d.matches.push(nm);
    });
    setMsel(nm.id);
    setTab("match");
  };
  const dupM = () => {
    const id = Math.random().toString(36).slice(2, 9);
    up((d) => {
      const i = d.matches.findIndex((x) => x.id === em.id),
        c = structuredClone(d.matches[i]);
      c.id = id;
      c.a.score = 0;
      c.b.score = 0;
      d.matches.splice(i + 1, 0, c);
    });
    setMsel(id);
  };
  const delM = () => {
    if (st.matches.length < 2 || !confirm(`Delete match "${mname(em)}"?`))
      return;
    const rest = st.matches.filter((x) => x.id !== em.id);
    up((d) => {
      d.matches = rest;
      if (d.curId === em.id) d.curId = rest[0].id;
    });
    setMsel(rest[0].id);
  };
  const moveM = (dir: number) =>
    up((d) => {
      const i = d.matches.findIndex((x) => x.id === em.id),
        j = i + dir;
      if (j < 0 || j >= d.matches.length) return;
      [d.matches[i], d.matches[j]] = [d.matches[j], d.matches[i]];
    });
  const nextM = () =>
    up((d) => {
      const i = d.matches.findIndex((x) => x.id === d.curId);
      d.curId = d.matches[Math.min(i + 1, d.matches.length - 1)].id;
    });
  const url = location.origin + "/#overlay";

  return (
    <div className="cp">
      <div className="top">
        <b style={{ fontSize: 18 }}>SCOREBOARD CONTROL</b>
        <div className="onair">
          {airIdx >= 0 ? (
            <>
              🔴 ON OBS NOW:{" "}
              <b>
                {airIdx + 1}. {st.pages[airIdx].name}
              </b>
            </>
          ) : (
            <>
              ⚪ OBS shows <b>nothing</b> (hidden)
            </>
          )}
        </div>
        <button onClick={() => air(null)}>Hide overlay (key 0)</button>
        <span style={{ flex: 1 }} />
        <span>
          Paste in OBS:{" "}
          <input
            readOnly
            value={url}
            style={{ width: 200 }}
            onFocus={(e) => e.target.select()}
          />
        </span>
        <details className="menu">
          <summary>⚙ Backup &amp; settings</summary>
          <div className="pop">
            <Chk
              l="Animations"
              v={st.anim}
              set={(v) =>
                up((d) => {
                  d.anim = v;
                })
              }
            />
            <div className="btns">
              <button onClick={exp}>Save configuration</button>
              <label>
                <button
                  onClick={(e) =>
                    (e.currentTarget.nextSibling as HTMLInputElement).click()
                  }
                >
                  Load configuration
                </button>
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={(e) =>
                    e.target.files?.[0] && imp(e.target.files[0])
                  }
                />
              </label>
              <button
                className="danger"
                onClick={() => {
                  if (confirm("Reset EVERYTHING to defaults?")) {
                    const v = mkState();
                    setSt(v);
                    setSel(v.airId!);
                  }
                }}
              >
                Reset everything
              </button>
            </div>
          </div>
        </details>
      </div>

      <div className="strip">
        <b>
          CURRENT MATCH {st.matches.indexOf(cur) + 1} · {cur.fmt}
        </b>
        {(["a", "b"] as const).map((t) => (
          <div className="side" key={t}>
            <span className="nm">{cur[t].name}</span>
            <b className="bigscore">{cur[t].score}</b>
            <button className="go" onClick={() => score(t, 1)}>
              +1
            </button>
            <button onClick={() => score(t, -1)}>−1</button>
          </div>
        ))}
        <button
          onClick={() =>
            up((d) => {
              const m = d.matches.find((x) => x.id === d.curId)!;
              m.a.score = 0;
              m.b.score = 0;
            })
          }
        >
          Reset scores
        </button>
        <button onClick={nextM}>Next match →</button>
        <span className="hint">
          Scores belong to this match and show on every page.
        </span>
      </div>

      <div className="grid">
        <div>
          <h3>① MATCHES TODAY</h3>
          <p className="hint">
            Click a match to edit it. <b>Make current</b> puts it on the
            scoreboard.
          </p>
          <div className="mlist">
            {st.matches.map((x, i) => (
              <div
                key={x.id}
                className={
                  "pg" +
                  (x.id === em.id ? " sel" : "") +
                  (x.id === cur.id ? " cur" : "")
                }
                onClick={() => {
                  setMsel(x.id);
                  setTab("match");
                }}
              >
                <b className="no">{i + 1}</b>
                <div style={{ flex: 1 }}>
                  <div>{mname(x)}</div>
                  <small>
                    {x.fmt} · {x.a.score} – {x.b.score}
                  </small>
                </div>
                {x.id === cur.id ? (
                  <span className="tag n">CURRENT</span>
                ) : (
                  <button
                    className="go"
                    onClick={(e) => {
                      e.stopPropagation();
                      makeCur(x.id);
                    }}
                  >
                    Make current
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="btns">
            <button onClick={addM}>+ New match</button>
            <button onClick={dupM}>Duplicate</button>
            <button onClick={() => moveM(-1)}>↑</button>
            <button onClick={() => moveM(1)}>↓</button>
            <button className="danger" onClick={delM}>
              Delete
            </button>
          </div>
          <h3>② YOUR PAGES</h3>
          <p className="hint">
            Click a page to edit it. Press <b>▶ Show</b> (or its number key) to
            put it on OBS.
          </p>
          {st.pages.map((x, i) => (
            <div
              key={x.id}
              className={
                "pg" +
                (x.id === p.id ? " sel" : "") +
                (x.id === st.airId ? " air" : "")
              }
              onClick={() => setSel(x.id)}
            >
              <b className="no">{i + 1}</b>
              <div style={{ flex: 1 }}>{x.name}</div>
              {x.id === st.airId ? (
                <span className="tag">ON AIR</span>
              ) : (
                <button
                  className="go"
                  onClick={(e) => {
                    e.stopPropagation();
                    air(x.id);
                  }}
                >
                  ▶ Show
                </button>
              )}
            </div>
          ))}
          <div className="btns">
            <button onClick={add}>+ New page</button>
            <button onClick={dup}>Duplicate</button>
          </div>
          <div className="btns">
            <button onClick={() => move(-1)}>↑ Up</button>
            <button onClick={() => move(1)}>↓ Down</button>
            <button className="danger" onClick={del}>
              Delete
            </button>
          </div>
        </div>

        <div>
          <h3>
            ③ EDITING PAGE: {st.pages.indexOf(p) + 1}. {p.name}
          </h3>
          <div className="btns">
            {onAir ? (
              <span className="tag">
                THIS PAGE IS ON AIR — changes show instantly
              </span>
            ) : (
              <button className="go" onClick={() => air(p.id)}>
                ▶ Show this page on OBS
              </button>
            )}
          </div>
          <div className="btns">
            {(["page", "match", "layout", "look"] as const).map((t) => (
              <button
                key={t}
                className={tab === t ? "on" : ""}
                onClick={() => setTab(t)}
              >
                {
                  {
                    page: "This page",
                    match: "Teams & match",
                    layout: "Position & size",
                    look: "Colors & style",
                  }[t]
                }
              </button>
            ))}
          </div>

          {tab === "page" && (
            <>
              <Txt
                l="Page name"
                v={p.name}
                set={(v) =>
                  setP((x) => {
                    x.name = v;
                  })
                }
              />
              <Txt
                l="Big title"
                v={p.title}
                set={(v) =>
                  setP((x) => {
                    x.title = v;
                  })
                }
              />
              <Txt
                l="Line above timer"
                v={p.sub}
                set={(v) =>
                  setP((x) => {
                    x.sub = v;
                  })
                }
              />
              <Txt
                l="When timer hits 0"
                v={p.done}
                set={(v) =>
                  setP((x) => {
                    x.done = v;
                  })
                }
              />
              <Txt
                l="Info line (e.g. next map)"
                v={p.info}
                set={(v) =>
                  setP((x) => {
                    x.info = v;
                  })
                }
              />
              <div className="txt">
                <span>Match shown</span>
                <select
                  value={p.matchId || ""}
                  onChange={(e) =>
                    setP((x) => {
                      x.matchId = e.target.value;
                    })
                  }
                >
                  <option value="">Current match (automatic)</option>
                  {st.matches.map((x, i) => (
                    <option key={x.id} value={x.id}>
                      {i + 1}. {mname(x)}
                    </option>
                  ))}
                </select>
              </div>
              <Chk
                l="Show countdown"
                v={p.showCd}
                set={(v) =>
                  setP((x) => {
                    x.showCd = v;
                  })
                }
              />
              <Chk
                l="Show scoreboard (teams + score)"
                v={p.showBoard}
                set={(v) =>
                  setP((x) => {
                    x.showBoard = v;
                  })
                }
              />
              <Img
                l="Banner image"
                v={p.banner}
                set={(v) =>
                  setP((x) => {
                    x.banner = v;
                  })
                }
              />
              <h3>COUNTDOWN</h3>
              <div className="big">{fmtT(cdLeft(sc.cd, now))}</div>
              <div className="btns">
                <button className="go" onClick={() => act("start")}>
                  {run
                    ? "Running…"
                    : cdLeft(sc.cd) > 0 && cdLeft(sc.cd) < sc.cd.total
                      ? "▶ Resume"
                      : "▶ Start"}
                </button>
                <button onClick={() => act("pause")}>⏸ Pause</button>
                <button onClick={() => act("reset")}>↺ Reset</button>
                <button onClick={() => act("add", 10000)}>+10s</button>
                <button onClick={() => act("add", -10000)}>−10s</button>
              </div>
              <div className="btns">
                Set time:{" "}
                {["00:30", "01:00", "02:00", "05:00"].map((t) => (
                  <button key={t} onClick={() => act("set", parseT(t))}>
                    {t}
                  </button>
                ))}
                <input
                  value={tin}
                  style={{ width: 70 }}
                  onChange={(e) => setTin(e.target.value)}
                />
                <button onClick={() => act("set", parseT(tin))}>Set</button>
              </div>
              <div className="btns">
                Count down to clock time (24h, 22:00 = 10 PM):{" "}
                <input
                  value={clk}
                  style={{ width: 70 }}
                  onChange={(e) => setClk(e.target.value)}
                />
                <button
                  className="go"
                  onClick={() => {
                    const [h, mi] = clk.split(":").map(Number);
                    const d = new Date();
                    d.setHours(h || 0, mi || 0, 0, 0);
                    if (+d <= Date.now()) d.setDate(d.getDate() + 1);
                    act("until", +d - Date.now());
                  }}
                >
                  Start countdown to it
                </button>
              </div>
            </>
          )}

          {tab === "match" && (
            <>
              {em.id !== cur.id ? (
                <p className="hint">
                  ⚠ Editing match {st.matches.indexOf(em) + 1}, which is NOT the
                  current match, so OBS is not showing it.{" "}
                  <button className="go" onClick={() => makeCur(em.id)}>
                    Make current
                  </button>
                </p>
              ) : (
                <p className="hint">
                  This is the current match — edits show on OBS instantly.
                </p>
              )}
              <Txt
                l="Tournament"
                v={em.tour}
                set={(v) =>
                  up((d) => {
                    EM(d).tour = v;
                  })
                }
              />
              <div className="txt">
                <span>Format</span>
                <select
                  value={em.fmt}
                  onChange={(e) =>
                    up((d) => {
                      EM(d).fmt = e.target.value as any;
                    })
                  }
                >
                  <option>BO1</option>
                  <option>BO3</option>
                  <option>BO5</option>
                </select>
              </div>
              {(["a", "b"] as const).map((t) => (
                <div key={t} className="box">
                  <h3>TEAM {t.toUpperCase()}</h3>
                  <Txt
                    l="Name"
                    v={em[t].name}
                    set={(v) =>
                      setT(t, (x) => {
                        x.name = v;
                      })
                    }
                  />
                  <Txt
                    l="Short name"
                    v={em[t].abbr}
                    set={(v) =>
                      setT(t, (x) => {
                        x.abbr = v;
                      })
                    }
                  />
                  <Img
                    l="Logo"
                    v={em[t].logo}
                    max={512}
                    set={(v) =>
                      setT(t, (x) => {
                        x.logo = v;
                      })
                    }
                  />
                </div>
              ))}
            </>
          )}

          {tab === "layout" && (
            <>
              <p className="hint">
                Each row moves/resizes ONE element. X = left→right, Y =
                top→bottom (screen is 1920×1080). Untick “show” to hide one.
              </p>
              {Object.entries(sc.layout).map(([id, e]) => (
                <div className="row" key={id}>
                  <b>{L[id] || id}</b>
                  <Chk
                    l="show"
                    v={e.on !== false}
                    set={(v) =>
                      up((d) => {
                        PP(d).scene.layout[id].on = v;
                      })
                    }
                  />
                  <Num l="X" v={e.x} step={10} set={(v) => el(id, "x", v)} />
                  <Num l="Y" v={e.y} step={10} set={(v) => el(id, "y", v)} />
                  <Num
                    l={id === "banner" ? "Width" : "Size"}
                    v={e.s}
                    step={id === "banner" ? 20 : 2}
                    min={1}
                    set={(v) => el(id, "s", v)}
                  />
                  {e.h !== undefined && (
                    <Num
                      l="Height"
                      v={e.h}
                      step={10}
                      min={1}
                      set={(v) => el(id, "h", v)}
                    />
                  )}
                </div>
              ))}
              <h3>BACKGROUND IMAGE</h3>
              <Img
                l="Image"
                v={sc.bg}
                set={(v) =>
                  up((d) => {
                    PP(d).scene.bg = v;
                  })
                }
              />
              <Num
                l="Size %"
                v={sc.bgSize}
                step={5}
                min={5}
                set={(v) =>
                  up((d) => {
                    PP(d).scene.bgSize = v;
                  })
                }
              />
              <Num
                l="X"
                v={sc.bgX}
                step={10}
                set={(v) =>
                  up((d) => {
                    PP(d).scene.bgX = v;
                  })
                }
              />
              <Num
                l="Y"
                v={sc.bgY}
                step={10}
                set={(v) =>
                  up((d) => {
                    PP(d).scene.bgY = v;
                  })
                }
              />
            </>
          )}

          {tab === "look" && (
            <>
              <h3>QUICK LOOKS</h3>
              <div className="btns">
                <select value={pre} onChange={(e) => setPre(e.target.value)}>
                  {[...Object.keys(PRESETS), "Custom"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select value={tgt} onChange={(e) => setTgt(e.target.value)}>
                  <option value="this">apply to this page</option>
                  <option value="all">apply to ALL pages</option>
                </select>
                <button className="go" onClick={apply}>
                  Apply
                </button>
                <button
                  onClick={() =>
                    up((d) => {
                      const s = PP(d).scene;
                      d.custom = {
                        style: structuredClone(s.style),
                        layout: structuredClone(s.layout),
                      };
                    })
                  }
                >
                  Save current look as Custom
                </button>
              </div>
              <h3>FONT &amp; COLORS</h3>
              <div className="txt">
                <span>Font</span>
                <input
                  list="fonts"
                  value={S.font}
                  onChange={(e) => sty("font", e.target.value)}
                />
                <datalist id="fonts">
                  {FONTS.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <Num
                l="Weight"
                v={S.weight}
                step={100}
                min={100}
                max={900}
                set={(v) => sty("weight", v)}
              />
              <Num
                l="Letter spacing"
                v={S.ls}
                step={0.5}
                min={-5}
                max={30}
                set={(v) => sty("ls", v)}
              />
              <Col l="Text" v={S.text} set={(v) => sty("text", v)} />
              <Col l="Team names" v={S.nameC} set={(v) => sty("nameC", v)} />
              <Col
                l="Score / timer"
                v={S.scoreC}
                set={(v) => sty("scoreC", v)}
              />
              <Col
                l="Accent / border"
                v={S.accent}
                set={(v) => sty("accent", v)}
              />
              <Col l="Panel color" v={S.panel} set={(v) => sty("panel", v)} />
              <h3>PANEL EFFECTS</h3>
              <Num
                l="Panel opacity"
                v={S.panelA}
                step={0.05}
                min={0}
                max={1}
                set={(v) => sty("panelA", v)}
              />
              <Num
                l="Border px"
                v={S.bw}
                min={0}
                max={20}
                set={(v) => sty("bw", v)}
              />
              <Num
                l="Corner radius"
                v={S.radius}
                min={0}
                max={80}
                set={(v) => sty("radius", v)}
              />
              <Num
                l="Glow px"
                v={S.glow}
                step={2}
                min={0}
                max={80}
                set={(v) => sty("glow", v)}
              />
              <Num
                l="Shadow px"
                v={S.shadow}
                step={2}
                min={0}
                max={80}
                set={(v) => sty("shadow", v)}
              />
              <Num
                l="Overall opacity"
                v={S.opacity}
                step={0.05}
                min={0}
                max={1}
                set={(v) => sty("opacity", v)}
              />
            </>
          )}
        </div>

        <div style={{ position: "sticky", top: 0, alignSelf: "start" }}>
          <h3>④ WHAT OBS SHOWS NOW</h3>
          <div className="pv">
            <iframe src="/#overlay" title="on air" />
          </div>
          <h3>THE PAGE YOU ARE EDITING</h3>
          <div className="pv">
            <iframe key={p.id} src={`/#overlay&page=${p.id}`} title="editing" />
          </div>
          <p className="hint">
            Checkerboard = transparent (your game shows through in OBS).
          </p>
        </div>
      </div>
    </div>
  );
}
