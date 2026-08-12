import { DEFAULT_GIMMICKS, paletteKeyFor, type ThemeColors, type ThemeSettings } from "./theme-types";

export function resolvesToDark(mode: ThemeSettings["mode"]): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// The colors actually in effect right now, given mode + retro. Each of the
// four contexts (light/dark/retroLight/retroDark) keeps its own colors, so
// this always returns that context's own values — never a leftover
// customization from a different context.
export function getActivePalette(theme: ThemeSettings): ThemeColors {
  const dark = resolvesToDark(theme.mode);
  return theme.palettes[paletteKeyFor(theme.retro, dark)];
}

export function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;
  const dark = resolvesToDark(theme.mode);
  const palette = getActivePalette(theme);

  root.style.setProperty("--color-canvas", palette.bg);
  root.style.setProperty("--color-surface", palette.surface);
  root.style.setProperty("--color-ink", palette.text);
  root.style.setProperty("--color-accent", palette.accent);
  root.style.setProperty("--color-border", palette.border);

  root.dataset.retro = theme.retro ? "true" : "false";
  root.dataset.mode = dark ? "dark" : "light";
  root.dataset.iconPack = theme.iconPack;

  const gimmicksActive = theme.retro ? theme.gimmicks : DEFAULT_GIMMICKS;
  root.dataset.gimmickStarfield = gimmicksActive.starfield ? "true" : "false";
  root.dataset.gimmickPawDivider = gimmicksActive.pawDivider ? "true" : "false";
  root.dataset.gimmickBuddy = gimmicksActive.bouncingBuddy ? "true" : "false";
}
