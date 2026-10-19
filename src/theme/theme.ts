/*
 * Every theme only sets CSS variables. styles.css reads them with var(--accent) etc.
 * "default" is the green + black look the panel ships with.
 */
export interface Theme {
  id: string;
  name: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: "default",
    name: "Matrix Green",
    vars: {
      "--bg": "#040a06",
      "--surface": "#07110b",
      "--surface-2": "#0d2016",
      "--border": "#12301d",
      "--text": "#e2f6ea",
      "--text-muted": "#7ba88b",
      "--accent": "#22e67a",
      "--accent-2": "#b4ff5c",
      "--on-accent": "#021208",
    },
  },
  {
    id: "ascent-blue",
    name: "Ascent Blue",
    vars: {
      "--bg": "#07090f",
      "--surface": "#0e1320",
      "--surface-2": "#161d2e",
      "--border": "#222c44",
      "--text": "#eef2ff",
      "--text-muted": "#8b95b0",
      "--accent": "#2f7bff",
      "--accent-2": "#6aa2ff",
      "--on-accent": "#ffffff",
    },
  },
  {
    id: "sakura-ashes",
    name: "Sakura Ashes",
    vars: {
      "--bg": "#161315",
      "--surface": "#211c1f",
      "--surface-2": "#2c2529",
      "--border": "#3d3338",
      "--text": "#f6ecef",
      "--text-muted": "#a8979d",
      "--accent": "#f4a7bb",
      "--accent-2": "#c9b6bd",
      "--on-accent": "#2a1a20",
    },
  },
  {
    id: "pikachu",
    name: "Pikachu",
    vars: {
      "--bg": "#14120a",
      "--surface": "#1f1c0e",
      "--surface-2": "#2b2713",
      "--border": "#433c1a",
      "--text": "#fff9db",
      "--text-muted": "#b3a977",
      "--accent": "#ffd60a",
      "--accent-2": "#ff4d4d",
      "--on-accent": "#1a1500",
    },
  },
  {
    id: "dragonfruit",
    name: "Dragonfruit",
    vars: {
      "--bg": "#12060f",
      "--surface": "#1e0c19",
      "--surface-2": "#2b1325",
      "--border": "#4a2040",
      "--text": "#ffeaf6",
      "--text-muted": "#b58aa7",
      "--accent": "#ff2e93",
      "--accent-2": "#7bd957",
      "--on-accent": "#ffffff",
    },
  },
  {
    id: "frostfire",
    name: "Frostfire",
    vars: {
      "--bg": "#06101a",
      "--surface": "#0b1b2b",
      "--surface-2": "#122a40",
      "--border": "#1d3d5a",
      "--text": "#e9f7ff",
      "--text-muted": "#85a9c2",
      "--accent": "#46d9ff",
      "--accent-2": "#ff7a30",
      "--on-accent": "#021018",
    },
  },
  {
    id: "hello-yellow",
    name: "Hello Yellow",
    vars: {
      "--bg": "#fff9d6",
      "--surface": "#ffffff",
      "--surface-2": "#fff2a8",
      "--border": "#ecd96a",
      "--text": "#2a2300",
      "--text-muted": "#7a6d1f",
      "--accent": "#f5b800",
      "--accent-2": "#2a2300",
      "--on-accent": "#2a2300",
    },
  },
  {
    id: "blackpink",
    name: "Blackpink",
    vars: {
      "--bg": "#000000",
      "--surface": "#0d0d0d",
      "--surface-2": "#1a1a1a",
      "--border": "#2e2e2e",
      "--text": "#ffffff",
      "--text-muted": "#9a9a9a",
      "--accent": "#ff4fa3",
      "--accent-2": "#ffffff",
      "--on-accent": "#000000",
    },
  },
  {
    id: "voltage",
    name: "Voltage",
    vars: {
      "--bg": "#050505",
      "--surface": "#0f130a",
      "--surface-2": "#182010",
      "--border": "#2d3d18",
      "--text": "#f4ffe0",
      "--text-muted": "#8fa06a",
      "--accent": "#c6ff1a",
      "--accent-2": "#f4ff7a",
      "--on-accent": "#0a1000",
    },
  },
  {
    id: "ginger",
    name: "Ginger",
    vars: {
      "--bg": "#150d07",
      "--surface": "#22150c",
      "--surface-2": "#321f12",
      "--border": "#523319",
      "--text": "#fff0e3",
      "--text-muted": "#b69274",
      "--accent": "#ff8a3d",
      "--accent-2": "#ffc27a",
      "--on-accent": "#1c0d02",
    },
  },
  {
    id: "pinewood",
    name: "Pinewood",
    vars: {
      "--bg": "#07130e",
      "--surface": "#0d201a",
      "--surface-2": "#14302a",
      "--border": "#1f4a3d",
      "--text": "#e8f6ee",
      "--text-muted": "#7fa593",
      "--accent": "#3ddc84",
      "--accent-2": "#c9a36b",
      "--on-accent": "#04150c",
    },
  },
];

export const DEFAULT_THEME_ID = "default";
export const THEME_STORAGE_KEY = "scoreboard:theme";

export const getTheme = (id: string): Theme =>
  THEMES.find((t) => t.id === id) || THEMES[0];

export function getSavedThemeId(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

/* every variable we ever set, so switching themes always starts clean */
const ALL_VAR_KEYS = [
  ...Object.keys(THEMES[0].vars),
  "--accent-rgb",
  "--accent-2-rgb",
  "--bg-rgb",
];

export function applyTheme(id: string): Theme {
  const theme = getTheme(id);
  const root = document.documentElement;

  ALL_VAR_KEYS.forEach((key) => root.style.removeProperty(key));
  Object.entries(theme.vars).forEach(([key, value]) =>
    root.style.setProperty(key, value),
  );

  /* "r, g, b" versions so CSS can do rgba(var(--accent-rgb), 0.3) */
  root.style.setProperty("--accent-rgb", hexToRgb(theme.vars["--accent"]));
  root.style.setProperty("--accent-2-rgb", hexToRgb(theme.vars["--accent-2"]));
  root.style.setProperty("--bg-rgb", hexToRgb(theme.vars["--bg"]));

  root.setAttribute("data-theme", theme.id);
  return theme;
}

export function saveTheme(id: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* storage blocked: theme still applies for this session */
  }
}
