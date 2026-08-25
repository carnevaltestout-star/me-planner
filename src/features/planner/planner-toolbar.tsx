import { useEffect, useRef, useState } from "react";
import type { PlannerView } from "@/lib/planner/planner-types";
import MiniCalendar from "./mini-calendar";
import YearView from "./year-view";

interface PlannerToolbarProps {
  view: PlannerView;
  onViewChange: (view: PlannerView) => void;
  anchor: Date;
  rangeLabel: string;
  onToday: () => void;
  onJumpToDate: (date: Date) => void;
  onNewEvent: () => void;
  routinesOpen: boolean;
  onToggleRoutines: () => void;
}

export default function PlannerToolbar({
  view,
  onViewChange,
  anchor,
  rangeLabel,
  onToday,
  onJumpToDate,
  onNewEvent,
  routinesOpen,
  onToggleRoutines,
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
    <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5">
        <button
          type="button"
          onClick={onNewEvent}
          className="rounded-theme border border-accent bg-accent px-2.5 py-1 text-xs font-semibold text-accent-contrast hover:brightness-105 md:px-3.5 md:py-1.5 md:text-sm"
        >
          + New event
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-ink hover:bg-surface-alt md:px-3.5 md:py-1.5 md:text-sm"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setYearViewOpen(true)}
          className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-ink hover:bg-surface-alt md:px-3.5 md:py-1.5 md:text-sm"
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
        {/* Redundant on mobile — the grid's own day headers already show the
            exact dates, and Month/Year already opens the year view to jump
            around. Kept on desktop where there's room for it. */}
        <div className="relative hidden md:block" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setCalendarOpen((v) => !v)}
            className="whitespace-nowrap rounded-theme px-2 py-1.5 font-theme text-sm font-semibold text-ink hover:bg-surface-alt"
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
        <button
          type="button"
          onClick={onToggleRoutines}
          aria-pressed={routinesOpen}
          className={`rounded-full border px-2.5 py-1 text-xs hover:bg-surface-alt md:px-3.5 md:py-1.5 md:text-sm ${
            routinesOpen ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface text-ink"
          }`}
        >
          Display routines
        </button>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2.5">
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            onClick={() => onViewChange("week")}
            aria-pressed={view === "week"}
            className={`px-2.5 py-1 text-xs md:px-4 md:py-1.5 md:text-sm ${
              view === "week" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => onViewChange("day")}
            aria-pressed={view === "day"}
            className={`px-2.5 py-1 text-xs md:px-4 md:py-1.5 md:text-sm ${
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
