import { DEFAULT_GIMMICKS, DEFAULT_THEME, type ThemeSettings } from "./theme-types";

// Shared with public/mockups/theme-system.html's Save button — same key, same
// shape. Same-origin localStorage means saving there applies here too, live
// via the "storage" event if both are open, or on next load otherwise.
export const THEME_STORAGE_KEY = "me-planner:theme";

export function loadTheme(): ThemeSettings {
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!raw) return DEFAULT_THEME;
  try {
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode ?? DEFAULT_THEME.mode,
      retro: Boolean(parsed.retro),
      colors: { ...DEFAULT_THEME.colors, ...parsed.colors },
      iconPack: parsed.iconPack ?? DEFAULT_THEME.iconPack,
      gimmicks: { ...DEFAULT_GIMMICKS, ...parsed.gimmicks },
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: ThemeSettings) {
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}
