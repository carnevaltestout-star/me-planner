import { createContext, useContext } from "react";
import { DEFAULT_THEME, type ThemeSettings } from "@/lib/theme/theme-types";

export const ThemeContext = createContext<ThemeSettings>(DEFAULT_THEME);
// Separate from ThemeContext so every existing useTheme() call site (which
// only ever reads) is unaffected — only the Settings panel needs to write.
export const ThemeUpdateContext = createContext<(next: ThemeSettings) => void>(() => {});

export function useTheme(): ThemeSettings {
  return useContext(ThemeContext);
}

export function useSetTheme(): (next: ThemeSettings) => void {
  return useContext(ThemeUpdateContext);
}
