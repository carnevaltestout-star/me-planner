import { useEffect, type ReactNode } from "react";
import { applyTheme } from "@/lib/theme/apply-theme";
import { useSetting } from "@/lib/db/use-setting";
import { normalizeTheme, THEME_SETTINGS_KEY } from "@/lib/theme/theme-storage";
import { DEFAULT_THEME } from "@/lib/theme/theme-types";
import { ThemeContext, ThemeUpdateContext } from "./theme-context";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useSetting(THEME_SETTINGS_KEY, DEFAULT_THEME, normalizeTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
