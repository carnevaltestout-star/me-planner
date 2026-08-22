import { useCallback, useEffect, useState, type ReactNode } from "react";
import { applyTheme } from "@/lib/theme/apply-theme";
import { loadTheme, saveTheme, THEME_STORAGE_KEY } from "@/lib/theme/theme-storage";
import type { ThemeSettings } from "@/lib/theme/theme-types";
import { ThemeContext, ThemeUpdateContext } from "./theme-context";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // The Settings panel calls this directly (same window, no round-trip
  // through a "storage" event needed) — updates state and persists in one
  // shot, so every control there is autosave by construction.
  const updateTheme = useCallback((next: ThemeSettings) => {
    setTheme(next);
    saveTheme(next);
  }, []);

  useEffect(() => {
    // Picks up saves made from a second copy of the app open in another tab/window.
    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) setTheme(loadTheme());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (theme.mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeUpdateContext.Provider value={updateTheme}>{children}</ThemeUpdateContext.Provider>
    </ThemeContext.Provider>
  );
}
