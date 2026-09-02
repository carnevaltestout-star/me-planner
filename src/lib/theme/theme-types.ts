export type ThemeMode = "light" | "dark" | "system";
export type IconPackKey = "classic" | "bunny" | "sparkle" | "snacks";

export interface ThemeColors {
  bg: string;
  sidenav: string;
  surface: string;
  text: string;
  accent: string;
  border: string;
}

// Each of these four contexts keeps its own colors, so customizing one
// (e.g. while Retro is on) never overwrites another (e.g. plain light mode)
// — switching contexts always restores that context's own colors.
export interface ThemePalettes {
  light: ThemeColors;
  dark: ThemeColors;
  retroLight: ThemeColors;
  retroDark: ThemeColors;
}

export type PaletteKey = keyof ThemePalettes;

export interface RetroGimmicks {
  starfield: boolean;
  pawDivider: boolean;
  bouncingBuddy: boolean;
}

// Keyed by NavItem.path (see routes/nav-items.ts). A path with no entry (or
// an entry that isn't literally `false`) counts as enabled — see
// isTabEnabled below — so DEFAULT_ENABLED_TABS can just be empty rather
// than needing to duplicate every known path with `true`, and any tab
// added to nav-items.ts later shows up enabled automatically instead of
// needing a matching entry added here too.
export type EnabledTabs = Record<string, boolean>;

export interface ThemeSettings {
  mode: ThemeMode;
  retro: boolean;
  // A separate "skin" from retro — Y2K/kawaii desktop-widget look. Mutually
  // exclusive with retro (enforced where both get toggled), fixed colors
  // rather than a customizable palette like light/dark/retro have.
  kawaii: boolean;
  // A third skin, mutually exclusive with both of the above — pastel
  // Windows-98-desktop/study-blog look (blue-to-pink window chrome, a
  // pastel grid backdrop, star/moon/cloud stickers). Fixed colors, same as
  // kawaii.
  tryout: boolean;
  palettes: ThemePalettes;
  iconPack: IconPackKey;
  gimmicks: RetroGimmicks;
  // Which tabs show up in the desktop sidebar and mobile bottom-nav
  // sub-menus — see the "Activated features" section in settings-panel.tsx.
  enabledTabs: EnabledTabs;
}

export const DEFAULT_GIMMICKS: RetroGimmicks = {
  starfield: false,
  pawDivider: false,
  bouncingBuddy: false,
};

export const DEFAULT_ENABLED_TABS: EnabledTabs = {};

export function isTabEnabled(enabledTabs: EnabledTabs, path: string): boolean {
  return enabledTabs[path] !== false;
}

export const DEFAULT_PALETTES: ThemePalettes = {
  light: { bg: "#fbf8f6", sidenav: "#fbf8f6", surface: "#ffffff", text: "#362e38", accent: "#8b6ba8", border: "#e4d9e3" },
  dark: { bg: "#211d24", sidenav: "#211d24", surface: "#2b2630", text: "#efe9f0", accent: "#b79fd1", border: "#453c4c" },
  retroLight: { bg: "#fdf3e7", sidenav: "#fdf3e7", surface: "#fffdf8", text: "#3b2a55", accent: "#ff6fa5", border: "#3b2a55" },
  retroDark: { bg: "#1c1330", sidenav: "#1c1330", surface: "#241a3d", text: "#fdf3e7", accent: "#ff8fc0", border: "#7fe0c8" },
};

export function paletteKeyFor(retro: boolean, dark: boolean): PaletteKey {
  if (retro) return dark ? "retroDark" : "retroLight";
  return dark ? "dark" : "light";
}

export const DEFAULT_THEME: ThemeSettings = {
  mode: "light",
  retro: false,
  kawaii: false,
  tryout: false,
  palettes: DEFAULT_PALETTES,
  iconPack: "classic",
  gimmicks: DEFAULT_GIMMICKS,
  enabledTabs: DEFAULT_ENABLED_TABS,
};
