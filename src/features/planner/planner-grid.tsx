import { useEffect, useRef } from "react";
import {
  dateKey,
  eventOccursOn,
  fmtHour,
  isSameDay,
  layoutOverlaps,
  startOfWeek,
} from "@/lib/planner/planner-dates";
import type { PlannerEvent, PlannerView } from "@/lib/planner/planner-types";

const HOUR_HEIGHT = 56;
const DEFAULT_SCROLL_HOUR = 7;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function hourLabel(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function snapToHalfHour(hour: number, offsetY: number): number {
  return offsetY / HOUR_HEIGHT < 0.5 ? hour : hour + 0.5;
}

interface PlannerGridProps {
  view: PlannerView;
  anchor: Date;
  events: PlannerEvent[];
  onCellClick: (dateKey: string, hour: number) => void;
  onBlockClick: (event: PlannerEvent, occurrenceDate: string) => void;
}

export default function PlannerGrid({ view, anchor, events, onCellClick, onBlockClick }: PlannerGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const days =
    view === "day"
      ? [new Date(anchor)]
      : (() => {
          const monday = startOfWeek(anchor);
          return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
          });
        })();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_HEIGHT;
  }, [view]);

  const gridCols = `64px repeat(${days.length}, 1fr)`;
  const dayDividerClass = "border-r-2 border-[color-mix(in_srgb,var(--color-border)_55%,var(--color-ink)_45%)]";

  return (
    <div className="overflow-hidden rounded-theme border border-border bg-surface shadow-theme">
      <div className="grid border-b border-border" style={{ gridTemplateColumns: gridCols }}>
        <div className={dayDividerClass} />
        {days.map((d) => {
          const today_ = isSameDay(d, today);
          return (
            <div key={dateKey(d)} className={`${dayDividerClass} p-2.5 text-center last:border-r-0`}>
              <div className="text-[0.68rem] uppercase tracking-wide text-ink-muted">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div
                className={`mt-0.5 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full font-semibold ${
                  today_ ? "bg-accent text-accent-contrast" : "text-ink"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="max-h-[620px] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: gridCols, height: 24 * HOUR_HEIGHT }}>
          <div className={dayDividerClass}>
            {HOURS.map((h) => (
              <div key={h} className="relative -top-2 h-14 px-2 text-right text-[0.72rem] text-ink-muted">
                {hourLabel(h)}
              </div>
            ))}
          </div>
          {days.map((d) => {
            const key = dateKey(d);
            const isToday = isSameDay(d, today);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const dayEvents = events.filter((ev) => eventOccursOn(ev, d));
            const layout = layoutOverlaps(dayEvents);
            return (
              <div
                key={key}
                className={`relative last:border-r-0 ${dayDividerClass} ${
                  isToday ? "bg-[color-mix(in_srgb,var(--color-accent)_5%,transparent)]" : ""
                } ${isWeekend ? "bg-[color-mix(in_srgb,var(--color-ink)_3%,transparent)]" : ""}`}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className={`h-14 cursor-pointer border-b border-border hover:bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] ${
                      h % 3 === 0 ? "border-b-[color-mix(in_srgb,var(--color-border)_60%,var(--color-ink)_40%)]" : ""
                    }`}
                    onClick={(e) => onCellClick(key, snapToHalfHour(h, e.nativeEvent.offsetY))}
                  />
                ))}
                {dayEvents.map((ev) => {
                  const { col, cols } = layout.get(ev.id)!;
                  const widthPct = 100 / cols;
                  const leftPct = col * widthPct;
                  const color = ev.color || "var(--color-accent)";
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick(ev, key);
                      }}
                      className="absolute flex cursor-pointer flex-col justify-start overflow-hidden rounded-theme-sm pb-0 pl-[0.4rem] pr-[0.4rem] pt-[0.12rem] text-[0.7rem] text-ink"
                      style={{
                        top: ev.start * HOUR_HEIGHT,
                        height: (ev.end - ev.start) * HOUR_HEIGHT,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        background: `color-mix(in srgb, ${color} 18%, var(--color-surface))`,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <span className="font-semibold leading-[1.15]">
                        {ev.title}
                        {ev.repeat !== "none" ? " ↻" : ""}
                      </span>
                      <span className="leading-[1.15] text-ink-muted">
                        {fmtHour(ev.start)}–{fmtHour(ev.end)}
                      </span>
                    </div>
                  );
                })}
                {isToday && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-[5] h-0.5"
                    style={{
                      top: (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT,
                      background: "#e0217a",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
