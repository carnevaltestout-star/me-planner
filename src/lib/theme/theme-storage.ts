import { DEFAULT_ENABLED_TABS, DEFAULT_GIMMICKS, DEFAULT_PALETTES, DEFAULT_THEME, type ThemeSettings } from "./theme-types";

// Shared with public/mockups/theme-system.html's Save button — same key, same
// shape. Same-origin localStorage means saving there applies here too, live
// via the "storage" event if both are open, or on next load otherwise.
export const THEME_STORAGE_KEY = "me-planner:theme";

export function loadTheme(): ThemeSettings {
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!raw) return DEFAULT_THEME;
  try {
    const parsed = JSON.parse(raw);
    const parsedPalettes = parsed.palettes ?? {};
    return {
      mode: parsed.mode ?? DEFAULT_THEME.mode,
      retro: Boolean(parsed.retro),
      kawaii: Boolean(parsed.kawaii),
      tryout: Boolean(parsed.tryout),
      palettes: {
        light: { ...DEFAULT_PALETTES.light, ...parsedPalettes.light },
        dark: { ...DEFAULT_PALETTES.dark, ...parsedPalettes.dark },
        retroLight: { ...DEFAULT_PALETTES.retroLight, ...parsedPalettes.retroLight },
        retroDark: { ...DEFAULT_PALETTES.retroDark, ...parsedPalettes.retroDark },
      },
      iconPack: parsed.iconPack ?? DEFAULT_THEME.iconPack,
      gimmicks: { ...DEFAULT_GIMMICKS, ...parsed.gimmicks },
      enabledTabs: { ...DEFAULT_ENABLED_TABS, ...parsed.enabledTabs },
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: ThemeSettings) {
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}
