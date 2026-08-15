import { loadTrackersState } from "@/lib/trackers/tracker-storage";
import { MOOD_OPTIONS, type MoodKey, type Tracker } from "@/lib/trackers/tracker-types";
import { bucketByRange, bucketDefs, dateKey, isWithinRange, rangeEnd, rangeStart } from "./stat-dates";
import type { DistributionSlice, MultiSeriesPoint, SeriesMeta, SeriesPoint, TimeRange } from "./stat-types";

export interface HabitConsistency {
  tracker: Tracker;
  percent: number;
  completedDays: number;
  eligibleDays: number;
}

// The Trackers UI only locks *future* days — every past day, including ones
// before a tracker's own createdAt, stays freely toggleable so someone can
// backfill history for a habit they just added. So createdAt alone isn't a
// safe eligibility floor: if there's a real entry earlier than that, the
// floor has to stretch back to cover it, or that logged data just vanishes
// from its own stats.
function trackerFloor(tracker: Tracker, entries: Record<string, unknown>): Date {
  const createdAt = new Date(`${tracker.createdAt}T00:00:00`);
  let floor = createdAt;
  Object.keys(entries).forEach((key) => {
    const d = new Date(`${key}T00:00:00`);
    if (d.getTime() < floor.getTime()) floor = d;
  });
  return floor;
}

// Boolean/amount trackers only — Mood gets its own distribution card, and
// Period's marked days are derived math rather than something the person
// actually logged, so a "completion rate" wouldn't mean anything for it.
export function computeHabitConsistency(range: TimeRange, today: Date): HabitConsistency[] {
  const state = loadTrackersState();
  const start = rangeStart(range, today);
  const end = rangeEnd(range, today);
  const cappedEnd = end.getTime() < today.getTime() ? end : today;

  return state.trackers
    .filter((t): t is Extract<Tracker, { kind: "boolean" | "amount" }> => t.kind === "boolean" || t.kind === "amount")
    .map((tracker) => {
      const entries = state.entries[tracker.id] ?? {};
      const floor = trackerFloor(tracker, entries);
      const effectiveStart = start && start.getTime() > floor.getTime() ? start : floor;
      if (effectiveStart.getTime() > cappedEnd.getTime()) {
        return { tracker, percent: 0, completedDays: 0, eligibleDays: 0 };
      }
      const eligibleDays = Math.round((cappedEnd.getTime() - effectiveStart.getTime()) / 86400000) + 1;
      let completed = 0;
      Object.keys(entries).forEach((key) => {
        const d = new Date(`${key}T00:00:00`);
        if (d.getTime() >= effectiveStart.getTime() && d.getTime() <= cappedEnd.getTime()) completed += 1;
      });
      return { tracker, percent: eligibleDays > 0 ? Math.round((completed / eligibleDays) * 100) : 0, completedDays: completed, eligibleDays };
    });
}

export interface HabitActivitySeries {
  points: MultiSeriesPoint[];
  series: SeriesMeta[];
  overall: HabitConsistency[];
}

// Per-habit completion rate across each bucket of the selected range (a day
// for Week/Month, a whole month for Year/All Time), rather than a single
// number for the whole period — this is what actually shows the *pattern*
// of behavior over time (which was going well early on and tapered off,
// which is a steady daily habit, etc), not just an aggregate.
export function computeHabitActivitySeries(range: TimeRange, today: Date): HabitActivitySeries {
  const state = loadTrackersState();
  const trackers = state.trackers.filter(
    (t): t is Extract<Tracker, { kind: "boolean" | "amount" }> => t.kind === "boolean" || t.kind === "amount",
  );
  if (trackers.length === 0) return { points: [], series: [], overall: [] };

  const floors = trackers.map((t) => trackerFloor(t, state.entries[t.id] ?? {}));
  const earliest = floors.reduce<Date | null>((min, d) => (!min || d.getTime() < min.getTime() ? d : min), null);
  const buckets = bucketDefs(range, today, earliest ?? today);
  const points: MultiSeriesPoint[] = buckets.map((b) => ({ label: b.label }));
  const series: SeriesMeta[] = trackers.map((t) => ({ key: t.id, name: t.name, color: t.color }));

  trackers.forEach((tracker, ti) => {
    const entries = state.entries[tracker.id] ?? {};
    const entryKeys = new Set(Object.keys(entries));
    const floor = floors[ti];

    buckets.forEach((bucket, i) => {
      const start = bucket.start.getTime() > floor.getTime() ? bucket.start : floor;
      const end = bucket.end.getTime() < today.getTime() ? bucket.end : today;
      if (start.getTime() > end.getTime()) return; // bucket entirely before the earliest known activity or after today — leave gap

      const eligibleDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      let completed = 0;
      const cursor = new Date(start);
      while (cursor.getTime() <= end.getTime()) {
        if (entryKeys.has(dateKey(cursor))) completed += 1;
        cursor.setDate(cursor.getDate() + 1);
      }
      points[i][tracker.id] = Math.round((completed / eligibleDays) * 100);
    });
  });

  return { points, series, overall: computeHabitConsistency(range, today) };
}

export function computeMoodDistribution(range: TimeRange, today: Date): DistributionSlice[] | null {
  const state = loadTrackersState();
  const moodTracker = state.trackers.find((t) => t.kind === "mood");
  if (!moodTracker) return null;
  const entries = state.entries[moodTracker.id] ?? {};
  const tally = new Map<MoodKey, number>();
  let total = 0;
  Object.entries(entries).forEach(([key, value]) => {
    if (!isWithinRange(new Date(`${key}T00:00:00`), range, today)) return;
    const mood = value as MoodKey;
    tally.set(mood, (tally.get(mood) ?? 0) + 1);
    total += 1;
  });
  if (total === 0) return null;
  return MOOD_OPTIONS.filter((m) => tally.has(m.key)).map((m) => {
    const value = tally.get(m.key) ?? 0;
    return { key: m.key, label: m.label, value, percent: Math.round((value / total) * 100), color: m.color };
  });
}

// All logged entries across every tracker (any kind that actually stores
// entries — Period doesn't), bucketed by date, to show overall tracking
// activity rather than any one habit's rate.
export function computeTrackerFrequencySeries(range: TimeRange, today: Date): SeriesPoint[] {
  const state = loadTrackersState();
  const dates: Date[] = [];
  Object.values(state.entries).forEach((entries) => {
    Object.keys(entries).forEach((key) => dates.push(new Date(`${key}T00:00:00`)));
  });
  return bucketByRange(
    dates.filter((d) => isWithinRange(d, range, today)),
    range,
    today,
  );
}

export function hasAnyTrackerEntries(): boolean {
  const state = loadTrackersState();
  return Object.values(state.entries).some((e) => Object.keys(e).length > 0);
}
