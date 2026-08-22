export type ItemKind = "goal" | "todo";

export type TimeHorizon = "day" | "week" | "month" | "quarter" | "year";

// Same 1 (highest) - 4 (lowest) convention as Planner's EventPriority, and
// the same tint treatment in the edit form — kept as its own local type
// rather than importing Planner's, since the two features are otherwise
// unrelated and shouldn't need to depend on each other for this.
export type GoalPriority = 1 | 2 | 3 | 4;

export const PRIORITY_TINT_PERCENT: Record<GoalPriority, number> = { 1: 95, 2: 75, 3: 55, 4: 35 };

export const HORIZONS: { key: TimeHorizon; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
];

// Same palette as Planner's EVENT_COLORS / Trackers' TRACKER_COLORS, so the
// color picker here looks and feels like the ones already established
// elsewhere in the app.
export const ITEM_COLORS = [
  "#8b6ba8", // lavender (default, matches the app accent)
  "#e0567a", // rose
  "#d99a3d", // amber
  "#5b8a72", // sage
  "#3d9c9c", // teal
  "#4b8fc2", // sky
  "#9a4fa0", // plum
  "#6b7280", // slate
];

export interface ChecklistStep {
  id: string;
  text: string;
  done: boolean;
}

export interface GoalTodoItem {
  id: string;
  kind: ItemKind;
  title: string;
  category: string;
  color: string;
  deadline: string; // dateKey, "" if none set
  // A single canonical date (dateKey) rather than a fixed horizon+period —
  // this is what lets the same item show up in Day/Week/Month/Quarter/Year
  // views alike, for whichever of those currently contains this date,
  // instead of being siloed under just the one horizon it was created in.
  date: string;
  // Which horizon tab the item was created under — gates *how narrow* a
  // view it can show up in (see isVisibleInHorizon below), separately from
  // effectiveDate() above, which gates *which specific period*.
  horizon: TimeHorizon;
  steps: ChecklistStep[]; // goals only — if present, progress is derived from these
  manualPercent: number; // goals only — used when steps is empty
  priority?: GoalPriority; // undefined = no priority set
  done: boolean;
  doneAt: string; // ISO timestamp, "" if not done
  createdAt: string; // ISO timestamp
  // Manual drag-and-drop position. A global scalar, but only ever compared
  // against other items within the same filtered (kind + period) list, so
  // reordering one period's view never disturbs another's.
  order: number;
}

export function emptyItem(id: string, kind: ItemKind, date: string, horizon: TimeHorizon = "day"): GoalTodoItem {
  return {
    id,
    kind,
    title: "",
    category: "",
    color: ITEM_COLORS[0],
    deadline: "",
    date,
    horizon,
    steps: [],
    manualPercent: 0,
    done: false,
    doneAt: "",
    createdAt: new Date().toISOString(),
    // Negative and shrinking with every call — a brand-new item always
    // sorts ahead of anything created earlier (including other negative
    // orders from past new items, and any positive orders left over from
    // manual drag reordering), landing at the top of the list instead of
    // the bottom.
    order: -Date.now(),
  };
}

// An item is only ever visible in the horizon it was created under, or a
// broader one — Day < Week < Month < Quarter < Year. A goal filed under
// Quarter is too big-picture to clutter the granular Day/Week task views,
// but still needs to surface in Quarter/Year; a Day to-do, being the
// narrowest horizon, keeps showing up everywhere broader like before.
export function isVisibleInHorizon(item: GoalTodoItem, viewedHorizon: TimeHorizon): boolean {
  const itemIndex = HORIZONS.findIndex((h) => h.key === item.horizon);
  const viewedIndex = HORIZONS.findIndex((h) => h.key === viewedHorizon);
  return viewedIndex >= itemIndex;
}

// Which date an item is actually filed under for horizon/period filtering —
// a deadline is a stronger, more specific signal of "when this belongs"
// than the fallback creation-context date, so it wins whenever it's set.
// Live-derived rather than baked in at save time, so editing/clearing the
// deadline later immediately re-files the item without any migration.
export function effectiveDate(item: GoalTodoItem): string {
  return item.deadline || item.date;
}

export function isItemEmpty(item: GoalTodoItem): boolean {
  return !item.title.trim() && !item.category.trim() && !item.deadline && item.steps.length === 0 && item.manualPercent === 0;
}

// Todos are binary; goals derive from their checklist when they have one,
// otherwise fall back to a manually-set percentage.
export function progressPercent(item: GoalTodoItem): number {
  if (item.kind === "todo") return item.done ? 100 : 0;
  if (item.steps.length > 0) {
    const doneCount = item.steps.filter((s) => s.done).length;
    return Math.round((doneCount / item.steps.length) * 100);
  }
  return item.manualPercent;
}
