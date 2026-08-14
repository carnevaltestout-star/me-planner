import { useEffect, useRef, useState } from "react";
import {
  dateKey,
  eventOccursOn,
  fmtHour,
  isSameDay,
  layoutOverlaps,
  startOfWeek,
} from "@/lib/planner/planner-dates";
import { DEFAULT_TINT_PERCENT, PRIORITY_TINT_PERCENT, type PlannerEvent, type PlannerView } from "@/lib/planner/planner-types";

const HOUR_HEIGHT = 56;
const DEFAULT_SCROLL_HOUR = 7;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MIN_DAY_COL_PX = 90;
// Narrower time-label column on mobile so more of the day columns are
// visible before horizontal scroll kicks in — matches the app's md: 768px
// breakpoint everywhere else.
const LABEL_COL_PX_DESKTOP = 64;
const LABEL_COL_PX_MOBILE = 44;

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
  const hScrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const [labelColPx, setLabelColPx] = useState(() =>
    window.innerWidth < 768 ? LABEL_COL_PX_MOBILE : LABEL_COL_PX_DESKTOP,
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setLabelColPx(mql.matches ? LABEL_COL_PX_DESKTOP : LABEL_COL_PX_MOBILE);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

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

  useEffect(() => {
    // Week view on a narrow screen doesn't fit all 7 days at a readable
    // width (see MIN_DAY_COL_PX) — it scrolls horizontally instead of
    // squeezing columns. Land on today's column when today is in the
    // visible week; otherwise reset to Monday. Without the reset branch,
    // paging to a week that doesn't include today left the scroll position
    // stuck whereever it last was (e.g. always parked mid-week), making
    // Next/Prev look like they weren't doing anything on mobile.
    if (view !== "week" || !hScrollRef.current) return;
    const todayIndex = days.findIndex((d) => isSameDay(d, today));
    hScrollRef.current.scrollLeft =
      todayIndex >= 0 ? Math.max(0, labelColPx + todayIndex * MIN_DAY_COL_PX - MIN_DAY_COL_PX) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, anchor, labelColPx]);

  const gridCols = `${labelColPx}px repeat(${days.length}, 1fr)`;
  const dayDividerClass = "border-r-2 border-[color-mix(in_srgb,var(--color-border)_55%,var(--color-ink)_45%)]";
  const gridMinWidth = view === "week" ? labelColPx + days.length * MIN_DAY_COL_PX : undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme">
      <div
        ref={hScrollRef}
        className="flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
      >

        <div className="flex h-full flex-col" style={{ minWidth: gridMinWidth }}>
          <div className="grid flex-shrink-0 border-b border-border" style={{ gridTemplateColumns: gridCols }}>
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

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
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
                      const tintPercent = ev.priority ? PRIORITY_TINT_PERCENT[ev.priority] : DEFAULT_TINT_PERCENT;
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
                            background: `color-mix(in srgb, ${color} ${tintPercent}%, var(--color-surface))`,
                            borderLeft: `3px solid ${color}`,
                          }}
                        >
                          <span className="min-w-0 truncate font-semibold leading-[1.15]">
                            {ev.title}
                            {ev.repeat !== "none" ? " ↻" : ""}
                          </span>
                          <span className="min-w-0 truncate leading-[1.15] text-ink-muted">
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
      </div>
    </div>
  );
}
