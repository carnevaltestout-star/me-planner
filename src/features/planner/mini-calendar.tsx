import { useState } from "react";
import { isSameDay } from "@/lib/planner/planner-dates";

interface MiniCalendarProps {
  anchor: Date;
  onSelect: (date: Date) => void;
}

export default function MiniCalendar({ anchor, onSelect }: MiniCalendarProps) {
  const [month, setMonth] = useState(() => new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const today = new Date();

  const firstOfMonth = new Date(month);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startOffset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  return (
    <div
      className="absolute left-0 top-[calc(100%+6px)] z-20 w-[230px] rounded-theme border border-border bg-surface p-3 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="h-[22px] w-[22px] rounded-md text-sm text-ink-muted hover:bg-surface-alt"
          aria-label="Previous month"
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <span className="text-sm font-semibold">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          className="h-[22px] w-[22px] rounded-md text-sm text-ink-muted hover:bg-surface-alt"
          aria-label="Next month"
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="pb-0.5 text-center text-[0.6rem] text-ink-muted">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const muted = d.getMonth() !== month.getMonth();
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, anchor);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(d)}
              className={`h-6 rounded-md text-xs hover:bg-surface-alt ${muted ? "text-ink-muted opacity-50" : "text-ink"} ${
                isToday ? "font-bold text-accent" : ""
              } ${isSelected ? "bg-accent font-semibold text-accent-contrast hover:bg-accent" : ""}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
