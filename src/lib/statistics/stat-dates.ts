import type { SeriesPoint, TimeRange } from "./stat-types";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  return start;
}

// Calendar-aligned period containing "today" — matches how Trackers/Journal
// already think in whole months, rather than a rolling N-day trailing
// window. "all" has no lower bound.
export function rangeStart(range: TimeRange, today: Date): Date | null {
  if (range === "week") return startOfWeek(today);
  if (range === "month") return new Date(today.getFullYear(), today.getMonth(), 1);
  if (range === "year") return new Date(today.getFullYear(), 0, 1);
  return null;
}

export function rangeEnd(range: TimeRange, today: Date): Date {
  if (range === "week") {
    const start = startOfWeek(today);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  }
  if (range === "month") return new Date(today.getFullYear(), today.getMonth() + 1, 0);
  if (range === "year") return new Date(today.getFullYear(), 11, 31);
  return today;
}

export function isWithinRange(d: Date, range: TimeRange, today: Date): boolean {
  const start = rangeStart(range, today);
  const end = rangeEnd(range, today);
  const t = d.getTime();
  return (!start || t >= start.getTime()) && t <= end.getTime();
}

export function daysInRange(range: TimeRange, today: Date): number {
  const start = rangeStart(range, today) ?? today;
  const end = rangeEnd(range, today);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

// Buckets a list of activity dates into ordered {label, value} points, using
// the granularity that makes sense for the selected range: days for a week,
// days-of-month for a month, months for a year, and months-since-earliest
// for all time.
export function bucketByRange(dates: Date[], range: TimeRange, today: Date): SeriesPoint[] {
  if (range === "week") {
    const start = startOfWeek(today);
    const buckets: SeriesPoint[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { label: WEEKDAY_SHORT[d.getDay()], value: 0 };
    });
    dates.forEach((d) => {
      const diff = Math.round((stripTime(d).getTime() - start.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) buckets[diff].value += 1;
    });
    return buckets;
  }

  if (range === "month") {
    const daysCount = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const buckets: SeriesPoint[] = Array.from({ length: daysCount }, (_, i) => ({ label: String(i + 1), value: 0 }));
    dates.forEach((d) => {
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()) {
        buckets[d.getDate() - 1].value += 1;
      }
    });
    return buckets;
  }

  if (range === "year") {
    const buckets: SeriesPoint[] = MONTH_SHORT.map((label) => ({ label, value: 0 }));
    dates.forEach((d) => {
      if (d.getFullYear() === today.getFullYear()) buckets[d.getMonth()].value += 1;
    });
    return buckets;
  }

  // all time: one bucket per month from the earliest date to this month
  if (dates.length === 0) return [];
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const first = sorted[0];
  const months: SeriesPoint[] = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth(), 1);
  const sameYear = first.getFullYear() === today.getFullYear();
  while (cursor.getTime() <= last.getTime()) {
    months.push({
      label: sameYear ? MONTH_SHORT[cursor.getMonth()] : `${MONTH_SHORT[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
      value: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  dates.forEach((d) => {
    const idx = (d.getFullYear() - first.getFullYear()) * 12 + (d.getMonth() - first.getMonth());
    if (idx >= 0 && idx < months.length) months[idx].value += 1;
  });
  return months;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface BucketDef {
  label: string;
  start: Date;
  end: Date;
}

// Same granularity rules as bucketByRange, but returns each bucket's actual
// date boundaries instead of a pre-aggregated count — needed for anything
// that computes its own per-bucket value (e.g. a completion rate) rather
// than just counting how many dates fall in each bucket. "all" needs an
// external earliest-date hint since this function has no data of its own.
export function bucketDefs(range: TimeRange, today: Date, earliestForAll?: Date): BucketDef[] {
  if (range === "week") {
    const start = startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { label: WEEKDAY_SHORT[d.getDay()], start: d, end: d };
    });
  }

  if (range === "month") {
    const daysCount = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      return { label: String(i + 1), start: d, end: d };
    });
  }

  if (range === "year") {
    return MONTH_SHORT.map((label, i) => ({
      label,
      start: new Date(today.getFullYear(), i, 1),
      end: new Date(today.getFullYear(), i + 1, 0),
    }));
  }

  if (!earliestForAll) return [];
  const first = new Date(earliestForAll.getFullYear(), earliestForAll.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth(), 1);
  const sameYear = first.getFullYear() === today.getFullYear();
  const defs: BucketDef[] = [];
  const cursor = new Date(first);
  while (cursor.getTime() <= last.getTime()) {
    defs.push({
      label: sameYear ? MONTH_SHORT[cursor.getMonth()] : `${MONTH_SHORT[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
      start: new Date(cursor.getFullYear(), cursor.getMonth(), 1),
      end: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return defs;
}

// Longest run of consecutive calendar days (up to and including "today" for
// "current") present in a set of dateKeys — used for journaling/activity
// streaks. Streaks are always computed against the full history, independent
// of whatever time range is currently selected in the UI.
export function currentStreak(keys: Set<string>, today: Date): number {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (keys.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(keys: Set<string>): number {
  if (keys.size === 0) return 0;
  const sorted = [...keys].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const cur = new Date(`${sorted[i]}T00:00:00`);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}
