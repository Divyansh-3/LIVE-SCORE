import { useEffect, useRef, useState } from "react";
import BracketPanel from "./bracket/BracketPanel";
import TablePanel from "./table/TablePanel";
import { champion } from "./table/table";
import { STAGES } from "./bracket/bracket";
import { loadOrInit, saveState } from "./storage/db";
import { closePublisher, publish, subscribe } from "./storage/sync";
import {
  PRESETS,
  cdLeft,
  fmtT,
  mkBannerPage,
  mkBracketPage,
  mkTablePage,
  mkMatch,
  mkPage,
  mkState,
  uid,
  migrate,
  useNow,
  type Match,
  type Page,
  type Scene,
  type State,
  type Style,
  type Team,
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
  const [tab, setTab] = useState<
    "page" | "match" | "bracket" | "table" | "layout" | "look"
  >("page");
  const [pre, setPre] = useState("Modern"),
    [tgt, setTgt] = useState("this"),
    [tin, setTin] = useState("01:30"),
    [clk, setClk] = useState("22:00"),
    [msel, setMsel] = useState("");
  const now = useNow();
  const [err, setErr] = useState(""),
    [memOnly, setMem] = useState(false),
    [saved, setSaved] = useState<Date | null>(null),
    [saveErr, setSaveErr] = useState("");
  // In-page dialogs (browser alert/confirm can be blocked or hidden, which made buttons look dead)
  const [dlg, setDlg] = useState<{ msg: string; yes?: () => void } | null>(
    null,
  );
  const say = (msg: string) => setDlg({ msg });
  const ask = (msg: string, yes: () => void) => setDlg({ msg, yes });
  const stRef = useRef<State | null>(null),
    savedRev = useRef(-1);
  const air = (id: string | null) =>
    setSt((s) => s && { ...s, airId: id, rev: s.rev + 1 });

  // Load (or create on first launch) the tournament from IndexedDB
  useEffect(() => {
    loadOrInit()
      .then((v) => {
        savedRev.current = v.rev;
        setSt(v);
        setSel(v.airId || v.pages[0].id);
        setSaved(new Date());
      })
      .catch((e) => setErr(String(e?.message || e)));
  }, []);
  // Broadcast quickly (40 ms) and save with a small debounce (400 ms)
  useEffect(() => {
    stRef.current = st;
    if (!st || st.rev <= savedRev.current) return;
    const pub = setTimeout(() => publish(st), 40);
    const sv = setTimeout(() => {
      if (memOnly) return;
      saveState(st)
        .then(() => {
          savedRev.current = Math.max(savedRev.current, st.rev);
          setSaved(new Date());
          setSaveErr("");
        })
        .catch((e) => setSaveErr(String(e?.message || e)));
    }, 400);
    return () => {
      clearTimeout(pub);
      clearTimeout(sv);
    };
  }, [st, memOnly]);
  // A newer state from ANOTHER Control tab replaces ours (an old tab can never overwrite a newer one)
  useEffect(
    () =>
      subscribe((n) => {
        const c = stRef.current;
        if (c && n.rev > c.rev) {
          savedRev.current = n.rev;
          setSt(n);
        }
      }),
    [],
  );
  // Last-chance save when the tab closes; close the channel on unmount
  useEffect(() => {
    const f = () => {
      const s = stRef.current;
      if (s && s.rev > savedRev.current && !memOnly) saveState(s);
    };
    addEventListener("pagehide", f);
    return () => {
      removeEventListener("pagehide", f);
      closePublisher();
    };
  }, [memOnly]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (
        !st ||
        /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.key === "0") air(null);
      const list = st.pages.filter(
          (x) => x.kind !== "bracket" && x.kind !== "table",
        ),
        i = +e.key;
      if (i >= 1 && list[i - 1]) air(list[i - 1].id);
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [st]);
  if (!st)
    return (
      <div className="cp">
        {err ? (
          <div className="box">
            <h3>⚠ Could not open the local database</h3>
            <p>{err}</p>
            <p className="hint">
              Your browser may be blocking storage (private/incognito window?).
              You can continue, but nothing will be saved — export a backup
              often.
            </p>
            <button
              className="go"
              onClick={() => {
                setMem(true);
                const v = mkState();
                setSt(v);
                setSel(v.airId!);
              }}
            >
              Continue without saving
            </button>
          </div>
        ) : (
          "Loading…"
        )}
      </div>
    );

  const up = (f: (d: State) => void) =>
    setSt((s) => {
      const d = structuredClone(s!);
      f(d);
      d.rev = s!.rev + 1;
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
  const el = (id: string, k: "x" | "y" | "s" | "h" | "w", v: number) =>
    up((d) => {
      (PP(d).scene.layout[id] as any)[k] = v;
    });
  // Shift the bracket left/right/up/down (or centre it) WITHOUT changing its size
  const shift = (id: string, dx: number, dy: number, centre = false) =>
    up((d) => {
      const l = PP(d).scene.layout[id];
      if (l.w === undefined) l.w = 1920 - 2 * l.x;
      if (centre) l.x = Math.round((1920 - l.w) / 2);
      else {
        l.x += dx;
        l.y += dy;
      }
    });
  const airIdx = st.pages.findIndex((x) => x.id === st.airId);
  const shown = st.pages.filter(
    (x) => x.kind !== "bracket" && x.kind !== "table",
  ); // numbered pages (matches' breaks)
  const tbs = st.pages.filter((x) => x.kind === "table"); // the table screens (own section)
  const bps = st.pages.filter((x) => x.kind === "bracket"); // the bracket screens (own section)
  const airPage = st.pages[airIdx];
  const lbl = (x: Page) =>
    x.kind === "bracket"
      ? "🏆 " + x.name
      : x.kind === "table"
        ? "📊 " + x.name
        : `${shown.indexOf(x) + 1}. ${x.name}`;
  const lab = (id: string) =>
    (p.kind === "bracket" || p.kind === "table"
      ? (
          {
            btitle: "Title",
            board:
              p.kind === "table"
                ? "Table (X,Y = top-left · Size = largest text · Width/Height)"
                : "Bracket (X,Y = top-left · Size = text · Width/Height)",
          } as Record<string, string>
        )[id]
      : undefined) ||
    L[id] ||
    id;
  const onAir = p.id === st.airId;
  // The bracket screen only gets bracket tools; normal pages never see the bracket tab
  const tabs: ("page" | "match" | "bracket" | "table" | "layout" | "look")[] =
    p.kind === "bracket"
      ? ["bracket", "layout", "look"]
      : p.kind === "table"
        ? ["table", "layout", "look"]
        : p.kind === "banner"
          ? ["page", "layout"]
          : ["page", "match", "layout", "look"];
  const tb = tabs.includes(tab) ? tab : tabs[0];

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
  const setT = (t: "a" | "b", f: (x: Team) => void) => up((d) => f(EM(d)[t]));
  const add = () => {
    const np = mkPage("Break " + shown.length);
    up((d) => {
      d.pages.push(np);
    });
    setSel(np.id);
    setTab("page");
  };
  const addBanner = () => {
    const np = mkBannerPage(
      "Banner " + (shown.filter((x) => x.kind === "banner").length + 1),
    );
    up((d) => {
      d.pages.push(np);
    });
    setSel(np.id);
    setTab("page");
  };
  const addBracket = () => {
    const np = mkBracketPage(uid(), "Bracket " + (bps.length + 1));
    up((d) => {
      d.pages.push(np);
    });
    setSel(np.id);
    setTab("bracket");
  };
  const addTable = () => {
    const np = mkTablePage("Table " + (tbs.length + 1));
    up((d) => {
      d.pages.push(np);
    });
    setSel(np.id);
    setTab("table");
  };
  const dupTable = (id: string) => {
    const nid = uid();
    up((d) => {
      const i = d.pages.findIndex((x) => x.id === id),
        c = structuredClone(d.pages[i]);
      c.id = nid;
      c.name += " copy";
      d.pages.splice(i + 1, 0, c);
    });
    setSel(nid);
    setTab("table");
  };
  const dup = () => {
    if (p.kind === "bracket")
      return say("The bracket screen cannot be duplicated.");
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
  const delP = (id: string) => {
    const x = st.pages.find((y) => y.id === id);
    if (!x) return;
    if (x.kind === "bracket" && bps.length < 2)
      return say("You need at least one bracket screen. Just do not show it.");
    if (x.kind !== "bracket" && x.kind !== "table" && shown.length < 2)
      return say("You need at least one page.");
    ask(`Delete "${x.name}"?`, () => {
      up((d) => {
        d.pages = d.pages.filter((y) => y.id !== id);
        if (d.airId === id) d.airId = null;
      });
      if (sel === id)
        setSel(
          (shown.find((y) => y.id !== id) ?? st.pages.find((y) => y.id !== id)!)
            .id,
        );
    });
  };
  const move = (dir: number) =>
    up((d) => {
      const ids = d.pages
          .filter((x) => x.kind !== "bracket" && x.kind !== "table")
          .map((x) => x.id),
        k = ids.indexOf(p.id) + dir;
      if (k < 0 || k >= ids.length) return;
      const i = d.pages.findIndex((x) => x.id === p.id),
        j = d.pages.findIndex((x) => x.id === ids[k]);
      [d.pages[i], d.pages[j]] = [d.pages[j], d.pages[i]];
    });
  const apply = () => {
    const pr = pre === "Custom" ? st.custom : PRESETS[pre];
    if (!pr)
      return say(
        'No custom look saved yet. Style a page, then press "Save current look as Custom".',
      );
    const run = () => {
      const f = (s: Scene) => {
        Object.assign(s.style, pr.style);
        if (pr.layout) s.layout = structuredClone(pr.layout);
      };
      up((d) => {
        if (tgt === "this") f(PP(d).scene);
        else d.pages.filter((x) => !x.kind).forEach((x) => f(x.scene));
      });
    };
    if (tgt === "all")
      ask(
        "Apply this look to ALL pages? Texts, images and scores are kept; only the style changes.",
        run,
      );
    else run();
  };
  const exp = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(st)], { type: "application/json" }),
    );
    a.download = `tournament-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const imp = async (f: File) => {
    let v: State;
    try {
      const s = migrate(JSON.parse(await f.text()));
      if (!s?.pages?.length) throw 0;
      v = s;
    } catch {
      return say("That file is not a valid scoreboard configuration.");
    }
    ask(
      "Loading a backup replaces ALL current tournament data (export one first if unsure). Continue?",
      () => {
        setSt({ ...v, rev: (stRef.current?.rev ?? 0) + 1 });
        setSel(v.airId || v.pages[0].id);
      },
    );
  };
  const makeCur = (id: string) =>
    up((d) => {
      d.curId = id;
    });
  // open a match in the normal editor (leaves the bracket screen if it was selected)
  const editMatch = (id: string) => {
    setMsel(id);
    if (p.kind === "bracket")
      setSel((shown.find((x) => x.id === st.airId) || shown[0]).id);
    setTab("match");
  };
  const addM = () => {
    const nm = mkMatch();
    nm.tour = cur.tour;
    nm.fmt = cur.fmt;
    up((d) => {
      d.matches.push(nm);
    });
    editMatch(nm.id);
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
  const delM = (id: string) => {
    const m = st.matches.find((x) => x.id === id);
    if (!m) return;
    if (st.matches.length < 2)
      return say(
        "You need at least one match. Add another before deleting this one.",
      );
    const inBr = st.pages.some((pg) =>
      pg.bracket?.rounds.some((r) => r.matches.some((b) => b.matchId === id)),
    );
    ask(
      `Delete match "${mname(m)}"?` +
        (inBr
          ? " It is used by the bracket, so that bracket slot will be empty until you pick another match."
          : ""),
      () => {
        up((d) => {
          d.matches = d.matches.filter((x) => x.id !== id);
          if (d.curId === id) d.curId = d.matches[0].id;
        });
        if (msel === id) setMsel("");
      },
    );
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
      {dlg && (
        <div className="dlg">
          <div className="dlgbox">
            <p>{dlg.msg}</p>
            <div className="btns">
              {dlg.yes ? (
                <>
                  <button
                    className="danger"
                    onClick={() => {
                      const f = dlg.yes!;
                      setDlg(null);
                      f();
                    }}
                  >
                    Yes
                  </button>
                  <button onClick={() => setDlg(null)}>Cancel</button>
                </>
              ) : (
                <button className="go" onClick={() => setDlg(null)}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="top">
        <b style={{ fontSize: 18 }}>SCOREBOARD CONTROL</b>
        <div className="onair">
          {airPage ? (
            <>
              🔴 ON OBS NOW: <b>{lbl(airPage)}</b>
            </>
          ) : (
            <>
              ⚪ OBS shows <b>nothing</b> (hidden)
            </>
          )}
        </div>
        <button onClick={() => air(null)}>Hide overlay (key 0)</button>
        <span className="hint">
          {saveErr ? (
            <b style={{ color: "#ff6b6b" }}>⚠ NOT SAVED: {saveErr}</b>
          ) : memOnly ? (
            "⚠ memory only — not saving"
          ) : st.rev > savedRev.current ? (
            "⏳ saving…"
          ) : saved ? (
            `💾 Last saved ${saved.toLocaleTimeString()}`
          ) : (
            ""
          )}
        </span>
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
          <div className="menu-body">
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
                onClick={() =>
                  ask(
                    "Reset EVERYTHING to defaults? All matches, pages and images will be erased.",
                    () => {
                      const v = mkState();
                      setSt({ ...v, rev: st.rev + 1 });
                      setSel(v.airId!);
                    },
                  )
                }
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
                onClick={() => editMatch(x.id)}
              >
                <b className="no">{i + 1}</b>
                <div style={{ flex: 1 }}>
                  <div>{mname(x)}</div>
                  <small>
                    {x.stage ? x.stage + " · " : ""}
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
                <button
                  className="danger"
                  title="Delete this match"
                  onClick={(e) => {
                    e.stopPropagation();
                    delM(x.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="btns">
            <button onClick={addM}>+ New match</button>
            <button onClick={dupM}>Duplicate</button>
            <button onClick={() => moveM(-1)}>↑</button>
            <button onClick={() => moveM(1)}>↓</button>
          </div>
          <h3>② YOUR PAGES</h3>
          <p className="hint">
            Click a page to edit it. Press <b>▶ Show</b> (or its number key) to
            put it on OBS.
          </p>
          {shown.map((x, i) => (
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
              <button
                className="danger"
                title="Delete this page"
                onClick={(e) => {
                  e.stopPropagation();
                  delP(x.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="btns">
            <button onClick={add}>+ New page</button>
            <button
              onClick={addBanner}
              title="A page with only an image – no text at all"
            >
              + New banner page
            </button>
            <button onClick={dup}>Duplicate</button>
          </div>
          <div className="btns">
            <button onClick={() => move(-1)}>↑ Up</button>
            <button onClick={() => move(1)}>↓ Down</button>
          </div>

          <h3>③ BRACKET SCREENS</h3>
          <p className="hint">
            Each bracket screen shows its own bracket on OBS, with its own
            banner and style. Add as many as you need (Upper bracket, Lower
            bracket, Group A…).
          </p>
          {bps.map((bp) => (
            <div
              key={bp.id}
              className={
                "pg" +
                (bp.id === p.id ? " sel" : "") +
                (bp.id === st.airId ? " air" : "")
              }
              onClick={() => {
                setSel(bp.id);
                setTab("bracket");
              }}
            >
              <b className="no">🏆</b>
              <div>
                {bp.name}
                <small>
                  {bp.bracket
                    ? `${bp.bracket.rounds.length} round(s)`
                    : "no bracket yet"}
                </small>
              </div>
              {bp.id === st.airId ? (
                <span className="tag">ON AIR</span>
              ) : (
                <button
                  className="go"
                  onClick={(e) => {
                    e.stopPropagation();
                    air(bp.id);
                  }}
                >
                  ▶ Show
                </button>
              )}
              <button
                className="danger"
                title="Delete this bracket screen"
                onClick={(e) => {
                  e.stopPropagation();
                  delP(bp.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="btns">
            <button className="go" onClick={addBracket}>
              + New bracket
            </button>
          </div>

          <h3>④ TABLES</h3>
          <p className="hint">
            Each table has its own teams, fixtures, results and champion, and is
            shown on OBS as its own screen. Add as many as you need (Group A,
            Group B, Finals…).
          </p>
          {tbs.map((tp) => {
            const T = tp.table,
              ch = T ? champion(T) : null,
              dn = T
                ? T.matches.filter((m) => m.sa !== null && m.sb !== null).length
                : 0;
            return (
              <div
                key={tp.id}
                className={
                  "pg" +
                  (tp.id === p.id ? " sel" : "") +
                  (tp.id === st.airId ? " air" : "")
                }
                onClick={() => {
                  setSel(tp.id);
                  setTab("table");
                }}
              >
                <b className="no">📊</b>
                <div>
                  {tp.name}
                  <small>
                    {T
                      ? ch
                        ? `🏆 ${ch.name}`
                        : `${T.teams.length} teams · ${dn}/${T.matches.length} played`
                      : "not created yet"}
                  </small>
                </div>
                {tp.id === st.airId ? (
                  <span className="tag">ON AIR</span>
                ) : (
                  <button
                    className="go"
                    onClick={(e) => {
                      e.stopPropagation();
                      air(tp.id);
                    }}
                  >
                    ▶ Show
                  </button>
                )}
                <button
                  title="Duplicate this table"
                  onClick={(e) => {
                    e.stopPropagation();
                    dupTable(tp.id);
                  }}
                >
                  ⧉
                </button>
                <button
                  className="danger"
                  title="Delete this table"
                  onClick={(e) => {
                    e.stopPropagation();
                    delP(tp.id);
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
          <div className="btns">
            <button className="go" onClick={addTable}>
              + New table
            </button>
          </div>
        </div>

        <div>
          <h3>④ EDITING: {lbl(p)}</h3>
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
            {tabs.map((t) => (
              <button
                key={t}
                className={tb === t ? "on" : ""}
                onClick={() => setTab(t)}
              >
                {
                  {
                    page: "This page",
                    match: "Teams & match",
                    bracket: "🏆 Bracket options",
                    table: "📊 Table options",
                    layout: "Position & size",
                    look: "Colors & style",
                  }[t]
                }
              </button>
            ))}
          </div>

          {tb === "page" && p.kind === "banner" && (
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
              <Img
                l="Banner image"
                v={p.banner}
                set={(v) =>
                  setP((x) => {
                    x.banner = v;
                  })
                }
              />
              <div className="txt">
                <span>Image fit</span>
                <select
                  value={p.fit || "cover"}
                  onChange={(e) =>
                    setP((x) => {
                      x.fit = e.target.value as "cover" | "contain";
                    })
                  }
                >
                  <option value="cover">Fill the screen (may crop)</option>
                  <option value="contain">Show the whole image</option>
                </select>
              </div>
              <p className="hint">
                This page shows ONLY the image — no title, countdown, scoreboard
                or other text. The image belongs to this page alone. Use
                “Position &amp; size” to move or resize it.
              </p>
            </>
          )}
          {tb === "page" && p.kind !== "banner" && (
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
                l="Default banner (if match has none)"
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

          {tb === "match" && (
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
              <div className="txt">
                <span>Stage tag</span>
                <input
                  list="stages"
                  placeholder="e.g. Semi Final"
                  value={em.stage || ""}
                  onChange={(e) =>
                    up((d) => {
                      EM(d).stage = e.target.value;
                    })
                  }
                />
                <datalist id="stages">
                  {STAGES.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <Img
                l="Banner for THIS match"
                v={em.banner || ""}
                set={(v) =>
                  up((d) => {
                    EM(d).banner = v;
                  })
                }
              />
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

          {tb === "bracket" && (
            <>
              <Txt
                l="Screen name"
                v={p.name}
                set={(v) =>
                  setP((x) => {
                    x.name = v;
                  })
                }
              />
              <Txt
                l="Title on screen"
                v={p.title}
                set={(v) =>
                  setP((x) => {
                    x.title = v;
                  })
                }
              />
              <Chk
                l="Show scores"
                v={p.showBoard}
                set={(v) =>
                  setP((x) => {
                    x.showBoard = v;
                  })
                }
              />
              <Img
                l="Banner (only this screen)"
                v={p.banner}
                set={(v) =>
                  setP((x) => {
                    x.banner = v;
                  })
                }
              />
              <p className="hint">
                This banner is used ONLY by the bracket screen — it never
                affects matches or breaks.
              </p>
              <BracketPanel
                st={st}
                pid={p.id}
                up={up}
                onCur={makeCur}
                onEdit={editMatch}
                ask={ask}
                say={say}
              />
            </>
          )}

          {tb === "table" && (
            <>
              <Txt
                l="Screen name"
                v={p.name}
                set={(v) =>
                  setP((x) => {
                    x.name = v;
                  })
                }
              />
              <Txt
                l="Title on screen"
                v={p.title}
                set={(v) =>
                  setP((x) => {
                    x.title = v;
                  })
                }
              />
              <Img
                l="Banner (only this screen)"
                v={p.banner}
                set={(v) =>
                  setP((x) => {
                    x.banner = v;
                  })
                }
              />
              <p className="hint">
                This banner is used ONLY by this table screen. Use “Position
                &amp; size” to move or resize the table.
              </p>
              <TablePanel st={st} pid={p.id} up={up} ask={ask} say={say} />
            </>
          )}

          {tb === "layout" && (
            <>
              <p className="hint">
                Each row moves/resizes ONE element. X = left→right, Y =
                top→bottom (screen is 1920×1080). Untick “show” to hide one.
              </p>
              {Object.entries(sc.layout).map(([id, e]) => (
                <div className="row" key={id}>
                  <b>{lab(id)}</b>
                  <Chk
                    l="show"
                    v={e.on !== false}
                    set={(v) =>
                      up((d) => {
                        PP(d).scene.layout[id].on = v;
                      })
                    }
                  />
                  <Num
                    l="X"
                    v={e.x}
                    step={10}
                    set={(v) =>
                      up((d) => {
                        const l = PP(d).scene.layout[id];
                        if (
                          (p.kind === "bracket" || p.kind === "table") &&
                          id === "board" &&
                          l.w === undefined
                        )
                          l.w = 1920 - 2 * l.x;
                        l.x = v;
                      })
                    }
                  />
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
                  {(p.kind === "bracket" || p.kind === "table") &&
                    id === "board" && (
                      <Num
                        l="Width"
                        v={e.w ?? 1920 - 2 * e.x}
                        step={20}
                        min={200}
                        set={(v) => el(id, "w", v)}
                      />
                    )}
                  {(p.kind === "bracket" || p.kind === "table") &&
                    id === "board" && (
                      <div className="btns" style={{ width: "100%" }}>
                        <b style={{ width: "auto" }}>Shift:</b>
                        <button onClick={() => shift(id, -50, 0)}>
                          ⏪ −50
                        </button>
                        <button onClick={() => shift(id, -10, 0)}>◀ −10</button>
                        <button onClick={() => shift(id, 10, 0)}>+10 ▶</button>
                        <button onClick={() => shift(id, 50, 0)}>+50 ⏩</button>
                        <button onClick={() => shift(id, 0, -10)}>▲ up</button>
                        <button onClick={() => shift(id, 0, 10)}>▼ down</button>
                        <button
                          className="go"
                          onClick={() => shift(id, 0, 0, true)}
                        >
                          Center
                        </button>
                      </div>
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

          {tb === "look" && (
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
          <h3>⑤ WHAT OBS SHOWS NOW</h3>
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
