import { keyToDate } from "./tracker-dates";
import type { PeriodTracker } from "./tracker-types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function stripTime(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Period trackers don't store per-day entries — every marked day is derived
// from lastPeriodStart + cycleLengthDays, repeating infinitely in both
// directions (so past AND future occurrences both resolve correctly,
// regardless of which month is on screen). Keeping this as a single pure
// function is what makes it easy to later swap in smarter cycle prediction
// (e.g. averaging past cycle lengths) without touching any UI code — only
// this function's internals would need to change.
export function isPeriodDay(tracker: PeriodTracker, d: Date): boolean {
  const start = stripTime(keyToDate(tracker.lastPeriodStart));
  const day = stripTime(d);
  const diffDays = Math.round((day.getTime() - start.getTime()) / MS_PER_DAY);
  const mod = ((diffDays % tracker.cycleLengthDays) + tracker.cycleLengthDays) % tracker.cycleLengthDays;
  return mod < tracker.periodLengthDays;
}

export function nextPeriodStart(tracker: PeriodTracker, from: Date = new Date()): Date {
  const start = stripTime(keyToDate(tracker.lastPeriodStart));
  const today = stripTime(from);
  const diffDays = Math.round((today.getTime() - start.getTime()) / MS_PER_DAY);
  const cyclesElapsed = Math.floor(diffDays / tracker.cycleLengthDays);
  const next = new Date(start);
  next.setDate(next.getDate() + (cyclesElapsed + 1) * tracker.cycleLengthDays);
  return next;
}
