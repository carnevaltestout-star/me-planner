import { DEFAULT_ENABLED_TABS, DEFAULT_GIMMICKS, DEFAULT_PALETTES, DEFAULT_THEME, type ThemeSettings } from "./theme-types";

// Key into the app_settings table (see src/lib/db). Kept distinct from the
// old "me-planner:theme" localStorage key on purpose — this is a fresh row
// in a fresh table, not a migration target for that key's exact contents.
export const THEME_SETTINGS_KEY = "theme";

// Fills in defaults for whatever a stored value predates or got wrong —
// same defensive shape-merging loadTheme() used to do reading straight out
// of localStorage, now applied to whatever useSetting's JSON.parse hands
// back (untyped, so this also protects against a malformed/partial row).
export function normalizeTheme(raw: unknown): ThemeSettings {
  const parsed = (raw ?? {}) as Partial<Omit<ThemeSettings, "palettes">> & { palettes?: Partial<ThemeSettings["palettes"]> };
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
}
