import { useEffect, useState } from "react";

export interface El {
  x: number;
  y: number;
  s: number;
  h?: number;
  on?: boolean;
}
export interface Style {
  font: string;
  weight: number;
  text: string;
  nameC: string;
  scoreC: string;
  accent: string;
  panel: string;
  panelA: number;
  bw: number;
  radius: number;
  glow: number;
  shadow: number;
  opacity: number;
  ls: number;
}
export interface CD {
  total: number;
  left: number;
  endsAt: number | null;
}
export interface Scene {
  layout: Record<string, El>;
  style: Style;
  bg: string;
  bgSize: number;
  bgX: number;
  bgY: number;
  cd: CD;
}
export interface Team {
  name: string;
  abbr: string;
  logo: string;
  score: number;
}
export interface Match {
  id: string;
  banner: string;
  a: Team;
  b: Team;
  tour: string;
  fmt: "BO1" | "BO3" | "BO5";
}
export interface Page {
  kind?: "bracket";
  id: string;
  name: string;
  title: string;
  sub: string;
  done: string;
  showCd: boolean;
  showBoard: boolean;
  banner: string;
  info: string;
  matchId: string;
  scene: Scene;
}
export interface Preset {
  style: Partial<Style>;
  layout?: Record<string, El>;
}
export interface BracketMatch {
  id: string;
  matchId: string;
  nextMatchId: string | null;
  completed: boolean;
  label: string;
}
export interface BracketRound {
  id: string;
  name: string;
  matches: BracketMatch[];
}
export interface Bracket {
  format: "single-elimination" | "double-elimination";
  rounds: BracketRound[];
}
export interface State {
  pages: Page[];
  airId: string | null;
  matches: Match[];
  bracket: Bracket | null;
  curId: string;
  rev: number;
  custom: Preset | null;
  anim: boolean;
}

export const STYLE: Style = {
  font: 'Bahnschrift, "Segoe UI", "Arial Narrow", sans-serif',
  weight: 700,
  text: "#ffffff",
  nameC: "#ffffff",
  scoreC: "#ffffff",
  accent: "#00e5ff",
  panel: "#0a0e1a",
  panelA: 0.88,
  bw: 2,
  radius: 6,
  glow: 14,
  shadow: 20,
  opacity: 1,
  ls: 1,
};
export const PRESETS: Record<string, Preset> = {
  Minimal: {
    style: {
      panel: "#000000",
      panelA: 0.6,
      accent: "#ffffff",
      bw: 0,
      radius: 0,
      glow: 0,
      shadow: 0,
      ls: 0,
      weight: 600,
      scoreC: "#ffffff",
    },
  },
  Modern: {
    style: {
      panel: "#0a0e1a",
      panelA: 0.88,
      accent: "#00e5ff",
      bw: 2,
      radius: 6,
      glow: 14,
      shadow: 20,
      ls: 1,
      weight: 700,
      scoreC: "#ffffff",
    },
  },
  Broadcast: {
    style: {
      panel: "#14041f",
      panelA: 0.93,
      accent: "#ff3d6e",
      bw: 3,
      radius: 0,
      glow: 18,
      shadow: 30,
      ls: 2,
      weight: 800,
      scoreC: "#ffd24a",
    },
  },
};
export const LAYOUT: Record<string, El> = {
  banner: { x: 0, y: 0, s: 1920, h: 1080 },
  btitle: { x: 960, y: 290, s: 48 },
  bsub: { x: 960, y: 370, s: 64 },
  cd: { x: 960, y: 440, s: 200 },
  board: { x: 960, y: 730, s: 48 },
  binfo: { x: 960, y: 840, s: 28 },
};
export const BRACKET_LAYOUT: Record<string, El> = {
  banner: { x: 0, y: 0, s: 1920, h: 1080 },
  btitle: { x: 960, y: 60, s: 56 },
  board: { x: 100, y: 200, s: 28, h: 800 }, // x,y = top-left · s = text size · h = height (width = 1920 − 2·x)
};
export const uid = () => Math.random().toString(36).slice(2, 9);
export const mkScene = (t: number): Scene => ({
  layout: structuredClone(LAYOUT),
  style: { ...STYLE },
  bg: "",
  bgSize: 100,
  bgX: 0,
  bgY: 0,
  cd: { total: t, left: t, endsAt: null },
});
export const mkPage = (name: string): Page => ({
  id: uid(),
  name,
  title: "MATCH BREAK",
  sub: "NEXT MAP STARTING IN",
  done: "NEXT MAP STARTING",
  showCd: true,
  showBoard: true,
  banner: "",
  info: "",
  matchId: "",
  scene: mkScene(120000),
});
/** The bracket screen: shown on OBS like a page, but listed in its own section and with its OWN banner. */
export const mkBracketPage = (): Page => {
  const scene = mkScene(0);
  scene.layout = structuredClone(BRACKET_LAYOUT);
  return {
    ...mkPage("Bracket"),
    id: "bracket-screen",
    kind: "bracket",
    title: "TOURNAMENT BRACKET",
    scene,
  };
};
export function mkState(): State {
  const soon = mkPage("Starting soon"),
    b1 = mkPage("Break 1"),
    b2 = mkPage("Break 2");
  Object.assign(soon, {
    title: "STARTING SOON",
    sub: "GAME STARTING IN",
    done: "GAME STARTING NOW",
  });
  soon.scene.cd = { total: 300000, left: 300000, endsAt: null };
  b1.info = "NEXT: MAP 2";
  b2.info = "NEXT: MAP 3";
  const tm = (
    n1: string,
    a1: string,
    n2: string,
    a2: string,
    fmt: Match["fmt"],
  ): Match => ({
    id: uid(),
    banner: "",
    tour: "VCT // GRAND FINAL",
    fmt,
    a: { name: n1, abbr: a1, logo: "", score: 0 },
    b: { name: n2, abbr: a2, logo: "", score: 0 },
  });
  const ms = [
    tm("PHANTOM WOLVES", "PW", "SHADOW FORCE", "SF", "BO3"),
    tm("IRON VIPERS", "IV", "NEON KINGS", "NK", "BO3"),
    tm("STORM RIDERS", "SR", "LUNAR FOX", "LF", "BO5"),
  ];
  return {
    pages: [soon, b1, b2, mkBracketPage()],
    airId: soon.id,
    custom: null,
    anim: true,
    matches: ms,
    bracket: null,
    curId: ms[0].id,
    rev: 0,
  };
}
export const mkMatch = (): Match => ({
  id: uid(),
  banner: "",
  tour: "TOURNAMENT",
  fmt: "BO3",
  a: { name: "TEAM A", abbr: "A", logo: "", score: 0 },
  b: { name: "TEAM B", abbr: "B", logo: "", score: 0 },
});
const withBracketPage = (s: any) =>
  s.pages.some((p: any) => p.kind === "bracket")
    ? s
    : { ...s, pages: [...s.pages, mkBracketPage()] };
// upgrade saves from the single-match version
export function migrate(s: any): State | null {
  if (s?.pages && s.matches)
    return withBracketPage({ bracket: null, rev: 0, ...s });
  if (s?.pages && s.match) {
    const m = { id: uid(), ...s.match };
    const { match, ...rest } = s;
    return withBracketPage({
      ...rest,
      matches: [m],
      curId: m.id,
      bracket: null,
      rev: 0,
    });
  }
  return null;
}
export const cdLeft = (c: CD, now = Date.now()) =>
  c.endsAt ? Math.max(0, c.endsAt - now) : c.left;
export const fmtT = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
};
export const rgba = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
export function useNow(ms = 200) {
  const [n, set] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => set(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}
