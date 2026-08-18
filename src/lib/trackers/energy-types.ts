// A day's recorded energy points — freeform (time, value) pairs rather than
// fixed slots, so the chart can place a point anywhere along a continuous
// scale instead of snapping to preset times.
export interface EnergyPoint {
  time: number; // decimal hour, 8 (8am) – 24 (midnight)
  value: number; // 0 (Low) – 100 (High)
}

export type EnergyState = Record<string, EnergyPoint[]>; // dateKey -> points, sorted by time

export const ENERGY_TIME_MIN = 8;
export const ENERGY_TIME_MAX = 24;
export const ENERGY_VALUE_MIN = 0;
export const ENERGY_VALUE_MAX = 100;

// Reuses two colors already in the app's own tracker/event palette (amber
// and rose) rather than inventing new ones, per the "orange -> pink" ask.
export const ENERGY_LOW_COLOR = "#d99a3d";
export const ENERGY_HIGH_COLOR = "#e0567a";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")}`;
}

// Linear interpolation across the whole 0-100 scale — "Medium" is just the
// midpoint of this gradient, not its own named color-stop.
export function energyColor(value: number): string {
  const t = Math.max(0, Math.min(1, value / ENERGY_VALUE_MAX));
  const low = hexToRgb(ENERGY_LOW_COLOR);
  const high = hexToRgb(ENERGY_HIGH_COLOR);
  return rgbToHex([low[0] + (high[0] - low[0]) * t, low[1] + (high[1] - low[1]) * t, low[2] + (high[2] - low[2]) * t]);
}

export function energyLabel(value: number): string {
  if (value < 33) return "Low";
  if (value < 67) return "Medium";
  return "High";
}

// Median rather than mean — a couple of extreme readings (a very low dip or
// a very high spike) shouldn't drag the whole day's summary toward them the
// way an average would.
export function medianForDay(points: EnergyPoint[] | undefined): number | null {
  if (!points || points.length === 0) return null;
  const values = [...points.map((p) => p.value)].sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}
