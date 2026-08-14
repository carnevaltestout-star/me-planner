export type PlannerView = "week" | "day";
export type RepeatRule = "none" | "daily" | "weekly" | "monthly";
export type EventPriority = 1 | 2 | 3 | 4; // 1 = highest, 4 = lowest

export interface PlannerEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD — the series' own anchor date
  title: string;
  notes: string;
  start: number; // decimal hour, e.g. 9.5 = 9:30
  end: number;
  repeat: RepeatRule;
  color: string;
  priority?: EventPriority; // undefined = no priority set, cell keeps the default tint
  exceptions: string[]; // dateKeys excluded from an otherwise-repeating series
}

// Shared between PlannerGrid (the actual cell fill) and EventModal (the
// priority picker's live preview swatches) so they always show the same
// tint. No priority set keeps DEFAULT_TINT_PERCENT. Priority 1 (highest) is
// the most opaque, fading down to priority 4 (lowest) being the most
// translucent.
export const DEFAULT_TINT_PERCENT = 18;
export const PRIORITY_TINT_PERCENT: Record<EventPriority, number> = { 1: 95, 2: 75, 3: 55, 4: 35 };

export const EVENT_COLORS = [
  "#8b6ba8", // lavender (default, matches the app accent)
  "#e0567a", // rose
  "#d99a3d", // amber
  "#5b8a72", // sage
  "#3d9c9c", // teal
  "#4b8fc2", // sky
  "#9a4fa0", // plum
  "#6b7280", // slate
];

export type NewEventDraft = Pick<PlannerEvent, "dateKey" | "start" | "end"> & {
  occurrenceDate: string;
};
export type EditEventDraft = PlannerEvent & { occurrenceDate: string };
