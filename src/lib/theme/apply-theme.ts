import { DEFAULT_GIMMICKS, type ThemeSettings } from "./theme-types";

export function resolvesToDark(mode: ThemeSettings["mode"]): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;
  const dark = resolvesToDark(theme.mode);

  root.style.setProperty("--color-canvas", theme.colors.bg);
  root.style.setProperty("--color-surface", theme.colors.surface);
  root.style.setProperty("--color-ink", theme.colors.text);
  root.style.setProperty("--color-accent", theme.colors.accent);
  root.style.setProperty("--color-border", theme.colors.border);

  root.dataset.retro = theme.retro ? "true" : "false";
  root.dataset.mode = dark ? "dark" : "light";
  root.dataset.iconPack = theme.iconPack;

  const gimmicksActive = theme.retro ? theme.gimmicks : DEFAULT_GIMMICKS;
  root.dataset.gimmickStarfield = gimmicksActive.starfield ? "true" : "false";
  root.dataset.gimmickPawDivider = gimmicksActive.pawDivider ? "true" : "false";
  root.dataset.gimmickBuddy = gimmicksActive.bouncingBuddy ? "true" : "false";
}
