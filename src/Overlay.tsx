import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cdLeft, fmtT, rgba, useNow, type Match, type Style } from "./model";
import { useSharedState } from "./storage/sync";
import { stageColumns, winnerOf } from "./bracket/bracket";
import { isComplete, standings } from "./table/table";

const CENTER = new Set(["btitle", "bsub", "cd", "board", "binfo"]);
const FMT = { BO1: "BEST OF 1", BO3: "BEST OF 3", BO5: "BEST OF 5" };

function Logo({
  src,
  abbr,
  size,
  s,
}: {
  src: string;
  abbr: string;
  size: number;
  s: Style;
}) {
  return src ? (
    <img
      src={src}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
      }}
    />
  ) : (
    <div
      className="badge"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        borderColor: s.accent,
      }}
    >
      {abbr}
    </div>
  );
}

export default function Overlay() {
  const st = useSharedState(),
    now = useNow();
  const [k, setK] = useState(1);
  useEffect(() => {
    const f = () => setK(Math.min(innerWidth / 1920, innerHeight / 1080));
    f();
    addEventListener("resize", f);
    return () => removeEventListener("resize", f);
  }, []);
  if (!st || !st.pages || !st.matches) return <div className="ovr" />;
  const pid =
    new URLSearchParams(location.hash.slice(1)).get("page") || st.airId;
  const p = st.pages.find((x) => x.id === pid);
  if (!p) return <div className="ovr" />;

  const mt =
      st.matches.find((x) => x.id === (p.matchId || st.curId)) || st.matches[0],
    sc = p.scene,
    s = sc.style,
    L = sc.layout;
  const left = cdLeft(sc.cd, now),
    done = left <= 0 && sc.cd.total > 0;
  const col = (id: string) =>
    id === "cd" ? s.scoreC : id === "btitle" ? s.accent : s.text;
  const E = (id: string, node: ReactNode, css: CSSProperties = {}) => {
    const e = L[id];
    if (!e || e.on === false || !node) return null;
    const glow = id === "cd" ? `0 0 ${s.glow}px ${s.accent}, ` : "";
    return (
      <div
        key={id}
        className={"el " + id}
        style={{
          left: e.x,
          top: e.y,
          fontSize: e.s,
          color: col(id),
          transform: CENTER.has(id) ? "translateX(-50%)" : undefined,
          textShadow: `${glow}0 2px ${s.shadow / 4}px rgba(0,0,0,.85)`,
          ...css,
        }}
      >
        {node}
      </div>
    );
  };
  const box: CSSProperties = {
    background: rgba(s.panel, s.panelA),
    border: `${s.bw}px solid ${s.accent}`,
    borderRadius: s.radius,
    boxShadow: `0 0 ${s.glow}px ${s.accent}, 0 ${s.shadow / 2}px ${s.shadow}px rgba(0,0,0,.6)`,
  };
  const sceneCss = {
    fontFamily: s.font,
    fontWeight: s.weight,
    color: s.text,
    letterSpacing: s.ls + "px",
    opacity: s.opacity,
    "--accent": s.accent,
  } as CSSProperties;
  const bn = p.kind ? p.banner : mt.banner || p.banner; // bracket / banner / table screens use their OWN banner     // the bracket screen has its OWN banner
  const ls = (L.board?.s || 48) * 1.4;
  const blink = done ? { animation: "blink .6s 4 alternate" } : {};

  // ---- bracket screen: one column per stage, connector lines between columns ----
  // Source: the generated (auto-advancing) bracket if one exists, otherwise your matches grouped by their stage tag.
  const bracketView = (() => {
    const B = L.board;
    if (p.kind !== "bracket" || !B || B.on === false) return null;
    type Item = { key: string; next?: string | null; m: Match; done: boolean };
    const find = (id: string) => st.matches.find((x) => x.id === id);
    // Generated/manual bracket: columns = its rounds, links = each slot's "winner goes to".
    // No bracket: your matches grouped by their optional stage tag (links only when a column halves).
    const cols: { id: string; name: string; items: Item[] }[] = p.bracket
      ? p.bracket.rounds.map((rd, r) => ({
          id: rd.id,
          name: rd.name,
          items: rd.matches.flatMap((bm) => {
            const m = find(bm.matchId);
            return m
              ? [{ key: bm.id, next: bm.nextMatchId, m, done: bm.completed }]
              : [];
          }),
        }))
      : stageColumns(st.matches).map((c) => ({
          id: c.name,
          name: c.name,
          items: c.matches.map((m) => ({ key: m.id, m, done: !!winnerOf(m) })),
        }));
    const shown = cols.filter((c) => c.items.length);
    if (!shown.length)
      return E(
        "board",
        p.bracket
          ? "Add matches to your bracket"
          : "Give your matches a stage tag (Quarter Final, Semi Final…)",
        { transform: "none" },
      );
    cols.length = 0;
    cols.push(...shown);
    const W = B.w ?? 1920 - 2 * B.x,
      H = B.h || 800,
      R = cols.length;
    const gap = Math.min(110, W / (R * 4)),
      colW = (W - gap * (R - 1)) / R;
    const cardH = Math.min(
      B.s * 3.1,
      (H / Math.max(...cols.map((c) => c.items.length))) * 0.9,
    );
    const cx = (r: number) => r * (colW + gap);
    const cy = (r: number, i: number) => ((i + 0.5) * H) / cols[r].items.length;
    const pos = new Map<string, [number, number]>();
    cols.forEach((c, r) => c.items.forEach((it, i) => pos.set(it.key, [r, i])));
    const links: { from: [number, number]; to: [number, number] }[] = [];
    cols.forEach((c, r) =>
      c.items.forEach((it, i) => {
        if (p.bracket) {
          const t = it.next ? pos.get(it.next) : undefined;
          if (t && t[0] > r) links.push({ from: [r, i], to: t });
        } else if (
          cols[r + 1] &&
          cols[r + 1].items.length * 2 === c.items.length
        )
          links.push({ from: [r, i], to: [r + 1, i >> 1] });
      }),
    );
    return E(
      "board",
      <>
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {links.map((l, k) => {
            const x1 = cx(l.from[0]) + colW,
              y1 = cy(l.from[0], l.from[1]),
              x2 = cx(l.to[0]),
              y2 = cy(l.to[0], l.to[1]),
              mx = x1 + gap / 2;
            return (
              <path
                key={k}
                d={`M${x1} ${y1}H${mx}V${y2}H${x2}`}
                fill="none"
                stroke={s.accent}
                strokeOpacity=".6"
                strokeWidth="3"
              />
            );
          })}
        </svg>
        {cols.map((c, r) => (
          <div key={c.id}>
            {c.name && (
              <div
                style={{
                  position: "absolute",
                  left: cx(r),
                  top: -B.s * 1.7,
                  width: colW,
                  textAlign: "center",
                  color: s.accent,
                  fontSize: B.s * 0.8,
                }}
              >
                {c.name}
              </div>
            )}
            {c.items.map((it, i) => {
              const m = it.m,
                w = it.done ? winnerOf(m, true) : null;
              return (
                <div
                  key={it.key}
                  style={{
                    position: "absolute",
                    left: cx(r),
                    top: cy(r, i) - cardH / 2,
                    width: colW,
                    height: cardH,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "0 .5em",
                    ...box,
                    borderColor: m.id === st.curId ? s.scoreC : s.accent,
                  }}
                >
                  {(["a", "b"] as const).map((t) => (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: ".5em",
                        color:
                          w === t
                            ? s.scoreC
                            : w
                              ? "rgba(255,255,255,.45)"
                              : s.nameC,
                      }}
                    >
                      <span
                        style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {m[t].name}
                      </span>
                      {p.showBoard && <b>{m[t].score}</b>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </>,
      { width: W, height: H, transform: "none" },
    ); // 'none': positioned from its top-left, NOT centred
  })();

  // ---- points table screen: rank, team, P W D L, +/-, PTS (text shrinks to fit the Height you set) ----
  const tableView = (() => {
    const T = p.table,
      B = L.board;
    if (p.kind !== "table" || !B || B.on === false) return null;
    if (!T) return null; // nothing on air until a table is created
    const rows = standings(T),
      champ = isComplete(T);
    const fs = Math.min(B.s, (B.h || 800) / ((rows.length + 1) * 1.95));
    const cols = `${fs * 2}px minmax(0,1fr) repeat(4, ${fs * 2.2}px) ${fs * 2.8}px ${fs * 3.2}px`;
    const row: CSSProperties = {
      display: "grid",
      gridTemplateColumns: cols,
      alignItems: "center",
      gap: fs * 0.2,
      height: fs * 1.7,
      padding: `0 ${fs * 0.6}px`,
    };
    const cell = (v: ReactNode, i: number) => (
      <span
        key={i}
        style={{
          textAlign: i === 1 ? "left" : "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {v}
      </span>
    );
    return E(
      "board",
      <div style={{ display: "flex", flexDirection: "column", gap: fs * 0.25 }}>
        <div style={{ ...row, color: s.accent, fontSize: fs * 0.8 }}>
          {["#", "TEAM", "P", "W", "D", "L", "+/−", "PTS"].map((v, i) =>
            cell(v, i),
          )}
        </div>
        {rows.map((r) => (
          <div
            key={r.id}
            style={{
              ...row,
              ...box,
              borderColor: r.rank === 1 ? s.scoreC : s.accent,
              color: s.nameC,
            }}
          >
            {cell(champ && r.rank === 1 ? "🏆" : r.rank, 0)}
            {cell(r.name, 1)}
            {[r.p, r.w, r.d, r.l, r.gd > 0 ? "+" + r.gd : r.gd].map((v, i) =>
              cell(v, i + 2),
            )}
            <b style={{ textAlign: "center", color: s.scoreC }}>{r.pts}</b>
          </div>
        ))}
      </div>,
      { width: B.w ?? 1200, fontSize: fs, transform: "none" },
    );
  })();

  return (
    <div className="ovr">
      <div
        className={"stage" + (st.anim ? "" : " noanim")}
        style={{ transform: `translate(-50%,-50%) scale(${k})` }}
      >
        <div key={p.id} className="scene" style={sceneCss}>
          {sc.bg && (
            <img
              className="abs"
              src={sc.bg}
              style={{
                left: sc.bgX,
                top: sc.bgY,
                width: (1920 * sc.bgSize) / 100,
              }}
            />
          )}
          {bn && L.banner && L.banner.on !== false && (
            <img
              className="abs"
              src={bn}
              style={{
                left: L.banner.x,
                top: L.banner.y,
                width: L.banner.s,
                height: L.banner.h,
                objectFit: p.fit === "contain" ? "contain" : "cover",
              }}
            />
          )}
          {E("btitle", p.title)}
          {E("bsub", done ? p.done : p.sub)}
          {p.showCd && E("cd", fmtT(left), blink)}
          {!p.kind &&
            p.showBoard &&
            E(
              "board",
              <div className="card" style={box}>
                <Logo src={mt.a.logo} abbr={mt.a.abbr} size={ls} s={s} />
                <span style={{ color: s.nameC }}>{mt.a.name}</span>
                <span
                  key={mt.a.score + "-" + mt.b.score}
                  className="vs pop"
                  style={{ color: s.scoreC }}
                >
                  {mt.a.score} — {mt.b.score}
                </span>
                <span style={{ color: s.nameC }}>{mt.b.name}</span>
                <Logo src={mt.b.logo} abbr={mt.b.abbr} size={ls} s={s} />
              </div>,
            )}
          {!p.kind &&
            p.showBoard &&
            E(
              "binfo",
              [mt.stage, FMT[mt.fmt], p.info, mt.tour]
                .filter(Boolean)
                .join(" · "),
            )}
          {bracketView}
          {tableView}
        </div>
      </div>
    </div>
  );
}
