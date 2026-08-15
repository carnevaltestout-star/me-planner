import { dateKey } from "./tracker-dates";
import { DEFAULT_CYCLE_LENGTH_DAYS, DEFAULT_PERIOD_LENGTH_DAYS, type Tracker, type TrackerEntries } from "./tracker-types";

// Same localStorage-as-stand-in-for-SQLite pattern as planner-storage.ts /
// journal-storage.ts — swapping this for the real DB later shouldn't need
// to touch any component, just this file.
export const TRACKERS_STORAGE_KEY = "me-planner:mock-trackers";

export interface TrackersState {
  trackers: Tracker[];
  entries: TrackerEntries;
}

// Mood is always the first/default row — every fresh install starts with
// just this one tracker already in place, nothing else to configure.
function seedState(): TrackersState {
  return {
    trackers: [{ id: "mood", name: "Mood", color: "#8b6ba8", icon: "heart", kind: "mood", createdAt: dateKey(new Date()) }],
    entries: {},
  };
}

function normalizeTracker(raw: Partial<Tracker>): Tracker | null {
  if (!raw.id || !raw.kind) return null;
  const base = { id: raw.id, name: raw.name ?? "Untitled", color: raw.color ?? "#8b6ba8", icon: raw.icon ?? "heart", createdAt: raw.createdAt ?? dateKey(new Date()) };
  if (raw.kind === "period") {
    const p = raw as Partial<Extract<Tracker, { kind: "period" }>>;
    return {
      ...base,
      kind: "period",
      periodLengthDays: p.periodLengthDays ?? DEFAULT_PERIOD_LENGTH_DAYS,
      cycleLengthDays: p.cycleLengthDays ?? DEFAULT_CYCLE_LENGTH_DAYS,
      lastPeriodStart: p.lastPeriodStart ?? base.createdAt,
    };
  }
  if (raw.kind === "mood") return { ...base, kind: "mood" };
  if (raw.kind === "amount") return { ...base, kind: "amount" };
  return { ...base, kind: "boolean" };
}

export function loadTrackersState(): TrackersState {
  try {
    const raw = window.localStorage.getItem(TRACKERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const trackers = Array.isArray(parsed.trackers)
        ? parsed.trackers.map(normalizeTracker).filter((t: Tracker | null): t is Tracker => t !== null)
        : [];
      const entries = parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {};
      if (trackers.length === 0) return seedState();
      return { trackers, entries };
    }
  } catch {
    // fall through to seed data
  }
  return seedState();
}

export function saveTrackersState(state: TrackersState) {
  window.localStorage.setItem(TRACKERS_STORAGE_KEY, JSON.stringify(state));
}
