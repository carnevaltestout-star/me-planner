import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { isSameDay, monthGridDays } from "@/lib/planner/planner-dates";

interface YearViewProps {
  anchor: Date;
  onSelect: (date: Date) => void;
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
  onSelect: (date: Date) => void;
}) {
  const days = monthGridDays(month);
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  return (
    <div className={`rounded-theme border p-2.5 bg-surface ${isCurrentMonth ? "border-[#e0217a]" : "border-border"}`}>
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
          const isSelected = isSameDay(d, selected);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(d)}
              className={`m-auto flex h-5 w-5 items-center justify-center rounded-full text-[0.62rem] hover:bg-surface-alt ${
                muted ? "text-ink-muted opacity-40" : "text-ink"
              } ${isToday ? "font-bold text-[#e0217a]" : ""} ${
                isSelected ? "bg-accent font-semibold text-accent-contrast hover:bg-accent" : ""
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Apple Calendar-style year view: all 12 months at once, click any date to
// jump the main planner view there.
export default function YearView({ anchor, onSelect, onClose }: YearViewProps) {
  const bottomReserve = useMobileBottomReserve();
  const [year, setYear] = useState(anchor.getFullYear());
  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Year view"
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
            aria-label="Close year view"
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
