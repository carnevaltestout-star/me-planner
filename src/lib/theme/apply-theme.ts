import { DEFAULT_GIMMICKS, paletteKeyFor, type ThemeColors, type ThemeSettings } from "./theme-types";

export function resolvesToDark(mode: ThemeSettings["mode"]): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Kawaii's colors are fixed, not part of the customizable palette system —
// the background is a gradient (applied separately in index.css, since
// background-color can't render one) and this solid tone is just the
// fallback for anything using --color-canvas as a plain color.
const KAWAII_COLORS: ThemeColors = {
  bg: "#f2ddec",
  sidenav: "#f2ddec",
  surface: "#fffdfd",
  text: "#4a3b6b",
  accent: "#ff6fa5",
  border: "#ffffff",
};

// Tryout's colors are fixed too, same mechanism as kawaii — the background
// is a diagonal pastel grid (applied separately in index.css) and this
// solid tone is just the --color-canvas fallback.
const TRYOUT_COLORS: ThemeColors = {
  bg: "#c9d9f5",
  sidenav: "#c9d9f5",
  surface: "#ffffff",
  text: "#3a3568",
  accent: "#ff8fc0",
  border: "#8fa8e8",
};

// The colors actually in effect right now, given mode + retro. Each of the
// four contexts (light/dark/retroLight/retroDark) keeps its own colors, so
// this always returns that context's own values — never a leftover
// customization from a different context. Kawaii overrides all of that with
// its own fixed colors.
export function getActivePalette(theme: ThemeSettings): ThemeColors {
  if (theme.kawaii) return KAWAII_COLORS;
  if (theme.tryout) return TRYOUT_COLORS;
  const dark = resolvesToDark(theme.mode);
  return theme.palettes[paletteKeyFor(theme.retro, dark)];
}

export function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;
  const dark = resolvesToDark(theme.mode);
  const palette = getActivePalette(theme);

  root.style.setProperty("--color-canvas", palette.bg);
  root.style.setProperty("--color-sidenav", palette.sidenav);
  root.style.setProperty("--color-surface", palette.surface);
  root.style.setProperty("--color-ink", palette.text);
  root.style.setProperty("--color-accent", palette.accent);
  root.style.setProperty("--color-border", palette.border);

  // Kawaii, retro, and tryout are separate skins, not combinable — kawaii
  // wins over both, then retro, if more than one is somehow set (shouldn't
  // happen; the UI that sets these keeps them mutually exclusive before
  // saving).
  root.dataset.retro = theme.retro && !theme.kawaii && !theme.tryout ? "true" : "false";
  root.dataset.kawaii = theme.kawaii ? "true" : "false";
  root.dataset.tryout = theme.tryout && !theme.kawaii ? "true" : "false";
  root.dataset.mode = dark ? "dark" : "light";
  root.dataset.iconPack = theme.iconPack;

  // Gimmicks (starfield/paw divider/bunny buddy) are shared between all
  // three skins — available under any of them, reset when none is active.
  const gimmicksActive = theme.retro || theme.kawaii || theme.tryout ? theme.gimmicks : DEFAULT_GIMMICKS;
  root.dataset.gimmickStarfield = gimmicksActive.starfield ? "true" : "false";
  root.dataset.gimmickPawDivider = gimmicksActive.pawDivider ? "true" : "false";
  root.dataset.gimmickBuddy = gimmicksActive.bouncingBuddy ? "true" : "false";
}
