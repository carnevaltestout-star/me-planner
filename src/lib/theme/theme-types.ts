export type ThemeMode = "light" | "dark" | "system";
export type IconPackKey = "classic" | "bunny" | "sparkle" | "snacks";

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  accent: string;
  border: string;
}

export interface RetroGimmicks {
  starfield: boolean;
  pawDivider: boolean;
  bouncingBuddy: boolean;
}

export interface ThemeSettings {
  mode: ThemeMode;
  retro: boolean;
  colors: ThemeColors;
  iconPack: IconPackKey;
  gimmicks: RetroGimmicks;
}

export const DEFAULT_GIMMICKS: RetroGimmicks = {
  starfield: false,
  pawDivider: false,
  bouncingBuddy: false,
};

export const DEFAULT_THEME: ThemeSettings = {
  mode: "light",
  retro: false,
  colors: {
    bg: "#fbf8f6",
    surface: "#ffffff",
    text: "#362e38",
    accent: "#8b6ba8",
    border: "#e4d9e3",
  },
  iconPack: "classic",
  gimmicks: DEFAULT_GIMMICKS,
};
