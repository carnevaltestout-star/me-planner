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
import { TrashIcon } from "@/features/goals/goal-todo-icons";
import { PRESET_DRAG_TYPE } from "./preset-bar";

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
// Exported so PlannerPage's own page-level drop zone can recognize "an
// event block was dropped somewhere that isn't a valid hour cell" (i.e.
// dragged out of the calendar entirely) and delete it, instead of only
// this file's own hour-cell drop targets understanding the payload.
export const EVENT_DRAG_TYPE = "application/x-me-planner-event-id";
export const EVENT_OCCURRENCE_DRAG_TYPE = "application/x-me-planner-event-occurrence-date";
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
  onPresetDrop?: (presetId: string, dateKey: string, hour: number) => void;
  onEventDrop?: (eventId: string, occurrenceDate: string, newDateKey: string, hour: number) => void;
  onDeleteRequest?: (event: PlannerEvent, occurrenceDate: string) => void;
}

export default function PlannerGrid({ view, anchor, events, onCellClick, onBlockClick, onPresetDrop, onEventDrop, onDeleteRequest }: PlannerGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hScrollRef = useRef<HTMLDivElement>(null);
  const [dragOverCell, setDragOverCell] = useState<{ key: string; hour: number } | null>(null);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
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

  // Centers the current time in the visible scroll area (instead of
  // pinning a fixed hour to the top) — same "where am I right now" framing
  // the now-line further down already gives the today column.
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const nowOffset = (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT;
    el.scrollTop = Math.max(0, nowOffset - el.clientHeight / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        } ${dragOverCell?.key === key && dragOverCell.hour === h ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)]" : ""}`}
                        onClick={(e) => onCellClick(key, snapToHalfHour(h, e.nativeEvent.offsetY))}
                        onDragOver={(e) => {
                          if (!onPresetDrop && !onEventDrop) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = e.dataTransfer.types.includes(EVENT_DRAG_TYPE) ? "move" : "copy";
                          const hour = snapToHalfHour(h, e.nativeEvent.offsetY);
                          if (dragOverCell?.key !== key || dragOverCell.hour !== hour) setDragOverCell({ key, hour });
                        }}
                        onDragLeave={(e) => {
                          const related = e.relatedTarget as Node | null;
                          if (related && e.currentTarget.contains(related)) return;
                          setDragOverCell((c) => (c?.key === key && c.hour === h ? null : c));
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          // Stopped so a drop a valid hour cell already
                          // handled doesn't also bubble up to PlannerPage's
                          // own page-level "dropped outside the grid ->
                          // delete" catch-all.
                          e.stopPropagation();
                          setDragOverCell(null);
                          const hour = snapToHalfHour(h, e.nativeEvent.offsetY);
                          const eventId = e.dataTransfer.getData(EVENT_DRAG_TYPE);
                          if (eventId && onEventDrop) {
                            // A successful drop usually moves the block to a
                            // different day-column's own .map() output — a
                            // genuinely new DOM node, not the same one
                            // reordered — so the original (now-detached)
                            // node's native "dragend" never fires and can't
                            // be relied on to clear this itself.
                            setDraggingEventId(null);
                            onEventDrop(eventId, e.dataTransfer.getData(EVENT_OCCURRENCE_DRAG_TYPE), key, hour);
                            return;
                          }
                          const presetId = e.dataTransfer.getData(PRESET_DRAG_TYPE);
                          if (presetId && onPresetDrop) onPresetDrop(presetId, key, hour);
                        }}
                      />
                    ))}
                    {dayEvents.map((ev) => {
                      const { col, cols } = layout.get(ev.id)!;
                      const widthPct = 100 / cols;
                      const leftPct = col * widthPct;
                      const color = ev.color || "var(--color-accent)";
                      const tintPercent = ev.priority ? PRIORITY_TINT_PERCENT[ev.priority] : DEFAULT_TINT_PERCENT;
                      // Only a lone event in its time slot gets to spill its
                      // full title past a too-short block's own height —
                      // with siblings sharing that slot there's nowhere for
                      // overflow text to go without covering them, so those
                      // stay clipped and rely on the title="" hover tooltip
                      // instead.
                      const overlapping = cols > 1;
                      return (
                        <div
                          key={ev.id}
                          draggable={Boolean(onEventDrop)}
                          onDragStart={(e) => {
                            if (!onEventDrop) return;
                            e.dataTransfer.setData(EVENT_DRAG_TYPE, ev.id);
                            e.dataTransfer.setData(EVENT_OCCURRENCE_DRAG_TYPE, key);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggingEventId(ev.id);
                          }}
                          onDragEnd={() => setDraggingEventId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlockClick(ev, key);
                          }}
                          title={overlapping ? ev.title : undefined}
                          className={`group isolate absolute flex flex-col justify-start rounded-theme-sm pb-0 pl-[0.4rem] pr-[0.4rem] pt-[0.12rem] text-[0.7rem] text-ink transition-opacity ${
                            onEventDrop ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                          } ${overlapping ? "z-[1] overflow-hidden" : "z-[2] overflow-visible"} ${
                            draggingEventId === ev.id ? "opacity-30" : ""
                          }`}
                          style={{
                            top: ev.start * HOUR_HEIGHT,
                            height: (ev.end - ev.start) * HOUR_HEIGHT,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                            background: `color-mix(in srgb, ${color} ${tintPercent}%, var(--color-surface))`,
                            borderLeft: `3px solid ${color}`,
                          }}
                        >
                          {onDeleteRequest && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRequest(ev, key);
                              }}
                              aria-label={`Delete ${ev.title || "event"}`}
                              className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-ink-muted opacity-0 shadow-theme hover:text-[#c22a4d] group-hover:opacity-100"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          )}
                          <span
                            className={`min-w-0 font-semibold leading-[1.15] ${overlapping ? "truncate" : "text-black"}`}
                          >
                            {ev.title}
                            {ev.repeat !== "none" ? " ↻" : ""}
                          </span>
                          {/* mix-blend-difference against the block's own
                              (isolate-scoped) tinted background instead of a
                              fixed muted color — stays readable no matter how
                              light or dark the event's own color/tint ends up. */}
                          <span className="min-w-0 truncate leading-[1.15] text-white mix-blend-difference">
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
