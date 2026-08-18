export type TrackerKind = "boolean" | "amount" | "mood" | "period";

export type TrackerIconKey =
  | "water"
  | "pillow"
  | "strawberry"
  | "brain"
  | "heart"
  | "book"
  | "notepad"
  | "running"
  | "plane"
  | "toothbrush"
  | "sun"
  | "money"
  | "chat"
  | "moonSleep"
  | "bottle"
  | "console"
  | "speechBubble"
  | "utensils"
  | "palette"
  | "drop";

export const TRACKER_ICON_KEYS: TrackerIconKey[] = [
  "water",
  "pillow",
  "strawberry",
  "brain",
  "heart",
  "book",
  "notepad",
  "running",
  "plane",
  "toothbrush",
  "sun",
  "money",
  "chat",
  "moonSleep",
  "bottle",
  "console",
  "speechBubble",
  "utensils",
  "palette",
  "drop",
];

// Same palette as Planner's EVENT_COLORS, so a tracker's color picker looks
// and feels like the one you already know from the Planner event modal.
export const TRACKER_COLORS = [
  "#8b6ba8", // lavender (default, matches the app accent)
  "#e0567a", // rose
  "#d99a3d", // amber
  "#5b8a72", // sage
  "#3d9c9c", // teal
  "#4b8fc2", // sky
  "#9a4fa0", // plum
  "#6b7280", // slate
];

export type MoodKey = "awful" | "low" | "okay" | "good" | "great";

export interface MoodOption {
  key: MoodKey;
  label: string;
  emoji: string;
  color: string;
}

// Sorted unhappy -> happy; color scales red -> green across the same axis.
export const MOOD_OPTIONS: MoodOption[] = [
  { key: "awful", label: "Awful", emoji: "😢", color: "#c0392b" },
  { key: "low", label: "Low", emoji: "🙁", color: "#d97a3d" },
  { key: "okay", label: "Okay", emoji: "😐", color: "#d9b93d" },
  { key: "good", label: "Good", emoji: "🙂", color: "#8fb86a" },
  { key: "great", label: "Great", emoji: "😄", color: "#4f9d5c" },
];

interface BaseTracker {
  id: string;
  name: string;
  color: string;
  icon: TrackerIconKey;
  createdAt: string; // dateKey — also anchors "past vs future" for brand-new trackers
}

export interface BooleanTracker extends BaseTracker {
  kind: "boolean";
}

// Free-form value per day — "320", "500ml", "2 cups", whatever the person
// types. No unit is enforced; it's stored and shown exactly as entered.
export interface AmountTracker extends BaseTracker {
  kind: "amount";
}

export interface MoodTracker extends BaseTracker {
  kind: "mood";
}

export interface PeriodTracker extends BaseTracker {
  kind: "period";
  periodLengthDays: number; // how many days the period itself lasts
  cycleLengthDays: number; // days between period start dates
  lastPeriodStart: string; // dateKey — anchors the recurring cycle math
}

export type Tracker = BooleanTracker | AmountTracker | MoodTracker | PeriodTracker;

// Boolean trackers store `true` for a completed day (absent/false days just
// aren't in the map — same "only store what's meaningfully set" pattern as
// Journal's entries). Amount trackers store the typed string ("320",
// "500ml", ...). Mood trackers store the selected MoodKey per day. Period
// trackers store nothing here — their marked days are always derived from
// the tracker's own cycle config, computed on the fly.
export type TrackerEntryValue = true | MoodKey | string;
export type TrackerEntries = Record<string, Record<string, TrackerEntryValue>>;

export const DEFAULT_CYCLE_LENGTH_DAYS = 28;
export const DEFAULT_PERIOD_LENGTH_DAYS = 5;
