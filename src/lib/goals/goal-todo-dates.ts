import type { TimeHorizon } from "./goal-todo-types";

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}

function quarterOf(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

export function periodLabel(horizon: TimeHorizon, d: Date): string {
  if (horizon === "day") return d.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  if (horizon === "week") {
    const start = startOfWeek(d);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString(undefined, sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
    return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
  }
  if (horizon === "month") return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (horizon === "quarter") return `Q${quarterOf(d)} ${d.getFullYear()}`;
  return String(d.getFullYear());
}

// Short form used inline next to summary-card titles ("Today's To-Dos —
// Aug 16" / "This Month's Goals — August 2026").
export function periodShortLabel(horizon: TimeHorizon, d: Date): string {
  if (horizon === "day") return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (horizon === "week") return periodLabel(horizon, d);
  if (horizon === "month") return d.toLocaleDateString(undefined, { month: "long" });
  if (horizon === "quarter") return `Q${quarterOf(d)}`;
  return String(d.getFullYear());
}

export function shiftPeriod(horizon: TimeHorizon, d: Date, dir: 1 | -1): Date {
  const next = new Date(d);
  if (horizon === "day") next.setDate(next.getDate() + dir);
  else if (horizon === "week") next.setDate(next.getDate() + 7 * dir);
  else if (horizon === "month") next.setMonth(next.getMonth() + dir);
  else if (horizon === "quarter") next.setMonth(next.getMonth() + 3 * dir);
  else next.setFullYear(next.getFullYear() + dir);
  return next;
}

export function isOverdue(deadlineKey: string, today: Date): boolean {
  if (!deadlineKey) return false;
  return deadlineKey < dateKey(today);
}

// The actual [start, end] date span a given horizon+anchor covers — e.g.
// Month/August 2026 covers Aug 1 through Aug 31. Used to test whether a
// single-date item falls inside *any* horizon's currently-viewed period,
// rather than an item only ever living under the one horizon it happened
// to be created under.
export function periodRange(horizon: TimeHorizon, d: Date): { start: Date; end: Date } {
  if (horizon === "day") {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return { start: day, end: day };
  }
  if (horizon === "week") {
    const start = startOfWeek(d);
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6) };
  }
  if (horizon === "month") {
    return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  }
  if (horizon === "quarter") {
    const startMonth = (quarterOf(d) - 1) * 3;
    return { start: new Date(d.getFullYear(), startMonth, 1), end: new Date(d.getFullYear(), startMonth + 3, 0) };
  }
  return { start: new Date(d.getFullYear(), 0, 1), end: new Date(d.getFullYear(), 11, 31) };
}

export function isDateWithinPeriod(itemDateKey: string, horizon: TimeHorizon, anchor: Date): boolean {
  const { start, end } = periodRange(horizon, anchor);
  const t = new Date(`${itemDateKey}T00:00:00`).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

// The date a brand-new item should carry so it shows up correctly across
// every horizon that contains it: today's exact date when the viewed
// period includes today (the common case — "add this for right now"),
// otherwise the start of whatever period is currently being viewed (so
// "add this for a future/past month" still files it somewhere sensible
// inside that month, visible from Month/Quarter/Year but not misfiled into
// today's Day/Week).
export function representativeDate(horizon: TimeHorizon, anchor: Date, today: Date): string {
  if (isDateWithinPeriod(dateKey(today), horizon, anchor)) return dateKey(today);
  return dateKey(periodRange(horizon, anchor).start);
}
