import { createContext, useContext } from "react";
import { DEFAULT_THEME, type ThemeSettings } from "@/lib/theme/theme-types";

export const ThemeContext = createContext<ThemeSettings>(DEFAULT_THEME);

export function useTheme(): ThemeSettings {
  return useContext(ThemeContext);
}
