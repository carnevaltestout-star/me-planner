import { useEffect, useState, type ReactNode } from "react";
import { applyTheme } from "@/lib/theme/apply-theme";
import { loadTheme, THEME_STORAGE_KEY } from "@/lib/theme/theme-storage";
import { ThemeContext } from "./theme-context";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Picks up saves made from public/mockups/theme-system.html in another tab.
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

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
