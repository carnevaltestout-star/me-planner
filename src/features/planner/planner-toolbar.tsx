import { useEffect, useRef, useState } from "react";
import type { PlannerView } from "@/lib/planner/planner-types";
import MiniCalendar from "./mini-calendar";
import YearView from "./year-view";

interface PlannerToolbarProps {
  view: PlannerView;
  onViewChange: (view: PlannerView) => void;
  anchor: Date;
  rangeLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpToDate: (date: Date) => void;
  onNewEvent: () => void;
}

export default function PlannerToolbar({
  view,
  onViewChange,
  anchor,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  onJumpToDate,
  onNewEvent,
}: PlannerToolbarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [yearViewOpen, setYearViewOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    function onDocClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setCalendarOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [calendarOpen]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-ink hover:bg-surface-alt"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setYearViewOpen(true)}
          className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-ink hover:bg-surface-alt"
        >
          <span className="font-semibold">{anchor.toLocaleDateString(undefined, { month: "long" })}</span>{" "}
          <span className="text-ink-muted">{anchor.getFullYear()}</span>
        </button>
        {yearViewOpen && (
          <YearView
            anchor={anchor}
            onSelect={(d) => {
              onJumpToDate(d);
              setYearViewOpen(false);
            }}
            onClose={() => setYearViewOpen(false)}
          />
        )}
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            aria-label="Previous"
            onClick={onPrev}
            className="flex h-[30px] w-[30px] items-center justify-center border-r border-border bg-surface text-ink hover:bg-surface-alt"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={onNext}
            className="flex h-[30px] w-[30px] items-center justify-center bg-surface text-ink hover:bg-surface-alt"
          >
            ›
          </button>
        </div>
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setCalendarOpen((v) => !v)}
            className="rounded-theme px-2 py-1.5 font-theme text-sm font-semibold text-ink hover:bg-surface-alt"
          >
            {rangeLabel}
          </button>
          {calendarOpen && (
            <MiniCalendar
              anchor={anchor}
              onSelect={(d) => {
                onJumpToDate(d);
                setCalendarOpen(false);
              }}
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onNewEvent}
          className="rounded-theme border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          + New event
        </button>
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            onClick={() => onViewChange("week")}
            aria-pressed={view === "week"}
            className={`px-4 py-1.5 text-sm ${
              view === "week" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => onViewChange("day")}
            aria-pressed={view === "day"}
            className={`px-4 py-1.5 text-sm ${
              view === "day" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"
            }`}
          >
            Day
          </button>
        </div>
      </div>
    </div>
  );
}
