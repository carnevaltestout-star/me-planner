import type { PlannerEvent } from "./planner-types";

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Shared by EventModal and the event-preset editor — both edit a decimal
// hour (e.g. 13.5) through a plain <input type="time">.
export function toTimeInput(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function fromTimeInput(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return h + m / 60;
}

export function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Monday-first 6-week (42-day) grid for a given month, including the
// leading/trailing days from neighboring months needed to fill the grid.
// Shared by MiniCalendar and YearView so both render identical month grids.
export function monthGridDays(month: Date): Date[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function fmtRange(days: Date[]): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (days.length === 1) {
    return days[0].toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const first = days[0];
  const last = days[days.length - 1];
  const sameMonth = first.getMonth() === last.getMonth();
  return sameMonth
    ? `${first.toLocaleDateString(undefined, opts)} – ${last.getDate()}, ${last.getFullYear()}`
    : `${first.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, opts)}, ${last.getFullYear()}`;
}

export function fmtHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return min ? `${display}:${String(min).padStart(2, "0")} ${suffix}` : `${display} ${suffix}`;
}

// Open-ended recurrence: repeats forever forward from its own date, no
// "until" date yet. `exceptions` holds dateKeys deleted as "just this
// event" — excluded even though they'd otherwise match the pattern.
export function eventOccursOn(ev: PlannerEvent, d: Date): boolean {
  const key = dateKey(d);
  if (ev.exceptions?.includes(key)) return false;
  if (ev.dateKey === key) return true;
  if (ev.repeat === "none") return false;
  const start = new Date(`${ev.dateKey}T00:00:00`);
  if (d < start) return false;
  if (ev.repeat === "daily") return true;
  if (ev.repeat === "weekly") return d.getDay() === start.getDay();
  if (ev.repeat === "monthly") return d.getDate() === start.getDate();
  return false;
}

// Side-by-side layout for overlapping events on the same day, Apple
// Calendar-style: group into clusters of transitively-overlapping events,
// then greedily pack each cluster into as few columns as possible.
export function layoutOverlaps(dayEvents: PlannerEvent[]): Map<string, { col: number; cols: number }> {
  const sorted = [...dayEvents].sort((a, b) => a.start - b.start || a.end - b.end);
  const clusters: PlannerEvent[][] = [];
  let current: PlannerEvent[] = [];
  let currentEnd = -Infinity;
  sorted.forEach((ev) => {
    if (current.length && ev.start >= currentEnd) {
      clusters.push(current);
      current = [];
      currentEnd = -Infinity;
    }
    current.push(ev);
    currentEnd = Math.max(currentEnd, ev.end);
  });
  if (current.length) clusters.push(current);

  const result = new Map<string, { col: number; cols: number }>();
  clusters.forEach((cluster) => {
    const columnEnds: number[] = [];
    cluster.forEach((ev) => {
      let col = columnEnds.findIndex((end) => end <= ev.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(ev.end);
      } else {
        columnEnds[col] = ev.end;
      }
      result.set(ev.id, { col, cols: 0 });
    });
    cluster.forEach((ev) => {
      result.get(ev.id)!.cols = columnEnds.length;
    });
  });
  return result;
}
