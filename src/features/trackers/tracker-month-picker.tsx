import { useState } from "react";
import { isSameDay, monthGridDays } from "@/lib/trackers/tracker-dates";

interface TrackerMonthPickerProps {
  anchor: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

function MonthCard({
  month,
  today,
  selected,
  onSelect,
}: {
  month: Date;
  today: Date;
  selected: Date;
  onSelect: (year: number, month: number) => void;
}) {
  const days = monthGridDays(month);
  const isSelected = month.getFullYear() === selected.getFullYear() && month.getMonth() === selected.getMonth();
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  return (
    <button
      type="button"
      onClick={() => onSelect(month.getFullYear(), month.getMonth())}
      className={`rounded-theme border p-2.5 text-left ${
        isSelected
          ? "border-accent bg-accent-soft"
          : isCurrentMonth
            ? "border-[#e0217a] bg-surface"
            : "border-border bg-surface hover:border-accent"
      }`}
    >
      <div className="mb-1.5 text-center text-sm font-semibold text-ink">
        {month.toLocaleDateString(undefined, { month: "long" })}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[0.55rem] text-ink-muted">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const muted = d.getMonth() !== month.getMonth();
          const isToday = isSameDay(d, today);
          return (
            <span
              key={d.toISOString()}
              className={`m-auto flex h-5 w-5 items-center justify-center rounded-full text-[0.62rem] ${
                muted ? "text-ink-muted opacity-40" : "text-ink"
              } ${isToday ? "font-bold text-[#e0217a]" : ""}`}
            >
              {d.getDate()}
            </span>
          );
        })}
      </div>
    </button>
  );
}

// Apple Calendar-style year view, same layout as Planner's YearView — a
// grid of white rounded month cards, each with its own mini day-grid.
// Trackers only navigates by whole month, so clicking anywhere on a card
// (not a specific day) selects that month.
export default function TrackerMonthPicker({ anchor, onSelect, onClose }: TrackerMonthPickerProps) {
  const [year, setYear] = useState(anchor.getFullYear());
  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Month and year picker"
        className="flex max-h-[90vh] w-full max-w-[900px] flex-col gap-3.5 overflow-hidden rounded-theme border border-border bg-canvas p-4 shadow-theme"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setYear((y) => y - 1)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-alt"
            >
              ‹
            </button>
            <span className="font-theme text-lg font-semibold text-ink">{year}</span>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setYear((y) => y + 1)}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-alt"
            >
              ›
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close month picker"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {months.map((m) => (
            <MonthCard key={m.getMonth()} month={m} today={today} selected={anchor} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
