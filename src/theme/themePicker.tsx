import { useState } from "react";
import {
  THEMES,
  applyTheme,
  getSavedThemeId,
  saveTheme,
  type Theme,
} from "./theme";

export default function ThemePicker() {
  // apply the saved theme the first time this mounts
  const [id, setId] = useState(() => {
    const saved = getSavedThemeId();
    applyTheme(saved);
    return saved;
  });

  const pick = (t: Theme) => {
    applyTheme(t.id);
    saveTheme(t.id);
    setId(t.id);
  };

  return (
    <>
      <h3>THEME</h3>
      <p className="hint">
        Changes the control panel colours only. What viewers see keeps its own
        colours (Colors &amp; style).
      </p>
      <div className="themes">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={"theme" + (t.id === id ? " picked" : "")}
            title={t.name}
            style={{
              background: t.vars["--surface"],
              color: t.vars["--text"],
              borderColor: t.id === id ? t.vars["--accent"] : t.vars["--border"],
            }}
            onClick={() => pick(t)}
          >
            <span>{t.name}</span>
            <span>
              <i style={{ background: t.vars["--accent"] }} />
              <i style={{ background: t.vars["--accent-2"] }} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}