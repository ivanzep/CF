import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
type Accent = "blue" | "green" | "purple" | "orange" | "rose";

const MODES: { value: Mode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const ACCENTS: Accent[] = ["blue", "green", "purple", "orange", "rose"];

function getStoredMode(): Mode {
  return (localStorage.getItem("cf-theme-mode") as Mode) || "system";
}
function getStoredAccent(): Accent {
  return (localStorage.getItem("cf-theme-accent") as Accent) || "blue";
}

export function ThemeButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(getStoredMode);
  const [accent, setAccent] = useState<Accent>(getStoredAccent);

  useEffect(() => {
    if (mode === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("cf-theme-mode", mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("cf-theme-accent", accent);
  }, [accent]);

  return (
    <div className="theme-picker">
      <button className="link-button" onClick={() => setOpen((o) => !o)}>
        Theme
      </button>
      {open && (
        <div className="theme-picker__panel">
          <p className="theme-picker__title">Mode</p>
          <div className="theme-picker__modes">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={mode === m.value ? "theme-picker__mode-btn theme-picker__mode-btn--active" : "theme-picker__mode-btn"}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="theme-picker__title">Accent color</p>
          <div className="theme-picker__accents">
            {ACCENTS.map((a) => (
              <button
                key={a}
                className={
                  "theme-picker__swatch theme-picker__swatch--" + a + (accent === a ? " theme-picker__swatch--active" : "")
                }
                onClick={() => setAccent(a)}
                aria-label={a}
                title={a}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
