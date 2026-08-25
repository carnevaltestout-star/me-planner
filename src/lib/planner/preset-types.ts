import type { EventPriority } from "./planner-types";

// An event preset is a small reusable template — same title/color every
// time — for something you do on no fixed schedule but want to drop onto
// wherever it actually happens ("gym", "therapy", "date night"). Distinct
// from a PlannerEvent's `repeat` field: a repeating event already occupies
// a day automatically, while a preset occupies none until you drag (or
// tap) it onto one.
//
// start/end are optional and only ever used for their *difference* (the
// duration) — dropping a preset takes its start time from whichever grid
// slot it's dropped on, not from these. Left unset, a dropped/quick-added
// instance defaults to a 1-hour block; setting both here just changes that
// default length, it doesn't pin the preset to a specific clock time.
export interface EventPreset {
  id: string;
  title: string;
  color: string;
  start?: number; // decimal hour
  end?: number;
  priority?: EventPriority;
}

export const DEFAULT_PRESET_DURATION_HOURS = 1;

export function presetDurationHours(preset: EventPreset): number {
  return preset.start !== undefined && preset.end !== undefined ? preset.end - preset.start : DEFAULT_PRESET_DURATION_HOURS;
}

export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function emptyPreset(id: string): EventPreset {
  return { id, title: "", color: "" };
}
