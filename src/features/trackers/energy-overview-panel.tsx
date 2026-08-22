import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { dateKey, isFuture, shiftDay } from "@/lib/trackers/tracker-dates";
import type { EnergyNoteState } from "@/lib/trackers/energy-note-types";
import type { EnergyPoint, EnergyState } from "@/lib/trackers/energy-types";
import EnergyDayChart from "./energy-day-chart";
import EnergyNotesField from "./energy-notes-field";

interface EnergyOverviewPanelProps {
  state: EnergyState;
  notes: EnergyNoteState;
  onChangeDay: (dateKeyValue: string, points: EnergyPoint[]) => void;
  onCommitNoteText: (dateKeyValue: string, text: string) => void;
  onToggleNotePrinciple: (dateKeyValue: string, value: boolean) => void;
  onClose: () => void;
}

const MIN_DAYS = 2;
const MAX_DAYS = 16;
const DEFAULT_DAYS = 4;
const WHEEL_ITEM_HEIGHT = 32;
const WHEEL_VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;
const WHEEL_PAD = (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;
const DAY_OPTIONS = Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => MIN_DAYS + i);

export interface DayCountWheelHandle {
  step: (delta: number) => void;
}

// iOS-style scroll-snap picker rather than a plain <select> — the ask was
// specifically for a scroll wheel. Reports the centered number after
// scrolling settles (debounced) instead of on every scroll tick. Exposes
// `step` via ref so the +/- buttons next to it (owned by the parent) can
// move the wheel the same way clicking an item does, instead of having
// their own separate un-synced notion of the current value.
const DayCountWheel = forwardRef<DayCountWheelHandle, { value: number; onChange: (n: number) => void }>(function DayCountWheel(
  { value, onChange },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const settleTimeoutRef = useRef<number>();
  const didInitRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (didInitRef.current || !scrollRef.current) return;
    didInitRef.current = true;
    scrollRef.current.scrollTop = (value - MIN_DAYS) * WHEEL_ITEM_HEIGHT;
    // Only ever runs once, to seed the wheel's scroll position from the
    // starting value — the wheel is the source of truth for `value` after
    // that (see handleScroll/selectValue below), not the other way round.
  }, []);

  function selectValue(n: number, smooth: boolean) {
    onChange(n);
    scrollRef.current?.scrollTo({ top: (n - MIN_DAYS) * WHEEL_ITEM_HEIGHT, behavior: smooth ? "smooth" : "auto" });
  }

  useImperativeHandle(ref, () => ({
    step: (delta: number) => selectValue(Math.min(MAX_DAYS, Math.max(MIN_DAYS, valueRef.current + delta)), true),
  }));

  function handleScroll() {
    window.clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = window.setTimeout(() => {
      if (!scrollRef.current) return;
      const idx = Math.round(scrollRef.current.scrollTop / WHEEL_ITEM_HEIGHT);
      const next = Math.min(MAX_DAYS, Math.max(MIN_DAYS, idx + MIN_DAYS));
      if (next !== value) onChange(next);
    }, 90);
  }

  return (
    <div className="relative" style={{ height: WHEEL_HEIGHT, width: 64 }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 rounded-theme-sm border-y-2 border-accent"
        style={{ top: WHEEL_PAD, height: WHEEL_ITEM_HEIGHT }}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="spinbutton"
        aria-label="Number of days to show"
        aria-valuemin={MIN_DAYS}
        aria-valuemax={MAX_DAYS}
        aria-valuenow={value}
        className="h-full overflow-y-auto rounded-theme-sm border border-border bg-canvas [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: WHEEL_PAD }} />
        {DAY_OPTIONS.map((n) => (
          <div
            key={n}
            onClick={() => selectValue(n, true)}
            className={`flex cursor-pointer items-center justify-center text-sm ${n === value ? "font-bold text-accent" : "text-ink-muted"}`}
            style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: "center" }}
          >
            {n}
          </div>
        ))}
        <div style={{ height: WHEEL_PAD }} />
      </div>
    </div>
  );
});

// Inline (not a dialog) — replaces the regular Day/Month view for as long
// as it's open, rather than sitting underneath it. Never persisted: dayCount
// and open/closed both reset to their defaults on every page load, by
// design (plain useState, no storage read/write).
export default function EnergyOverviewPanel({ state, notes, onChangeDay, onCommitNoteText, onToggleNotePrinciple, onClose }: EnergyOverviewPanelProps) {
  const [dayCount, setDayCount] = useState(DEFAULT_DAYS);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const wheelRef = useRef<DayCountWheelHandle>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Today first, then going backwards — matches reading order in the grid
  // below (today always lands top-left).
  const today = new Date();
  const days = Array.from({ length: dayCount }, (_, i) => shiftDay(today, -i));

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          title="Hide overview"
          className="rounded-full border border-accent bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent hover:brightness-95"
        >
          Days to show
        </button>
        <DayCountWheel ref={wheelRef} value={dayCount} onChange={setDayCount} />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            aria-label="Show one more day"
            disabled={dayCount >= MAX_DAYS}
            onClick={() => wheelRef.current?.step(1)}
            className="flex h-5 w-6 items-center justify-center rounded-theme-sm border border-border bg-canvas text-xs font-bold text-ink hover:bg-surface-alt disabled:opacity-30"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Show one fewer day"
            disabled={dayCount <= MIN_DAYS}
            onClick={() => wheelRef.current?.step(-1)}
            className="flex h-5 w-6 items-center justify-center rounded-theme-sm border border-border bg-canvas text-xs font-bold text-ink hover:bg-surface-alt disabled:opacity-30"
          >
            −
          </button>
        </div>
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(dayCount, 4)}, minmax(0, 1fr))` }}
      >
        {days.map((d) => {
          const key = dateKey(d);
          const isToday = key === dateKey(today);
          return (
            <div
              key={key}
              className={`flex flex-col gap-2 rounded-theme border bg-surface p-2.5 shadow-theme ${isToday ? "border-accent" : "border-border"}`}
            >
              <span className={`text-center text-xs font-semibold ${isToday ? "text-accent" : "text-ink"}`}>
                {isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </span>
              <EnergyDayChart points={state[key] ?? []} onChange={(points) => onChangeDay(key, points)} locked={isFuture(d)} />
              <EnergyNotesField
                key={`${key}-notes`}
                note={notes[key]}
                locked={isFuture(d)}
                onCommitText={(text) => onCommitNoteText(key, text)}
                onTogglePrinciple={(value) => onToggleNotePrinciple(key, value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
