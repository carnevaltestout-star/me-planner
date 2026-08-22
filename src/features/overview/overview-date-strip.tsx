import { useMemo } from "react";
import { dateKey } from "@/lib/trackers/tracker-dates";

interface OverviewDateStripProps {
  today: Date;
  selectedKey: string;
  onSelect: (key: string) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A rolling window centered on `today` (3 days back, 3 days ahead) rather
// than the fixed Sun-Sat calendar week — that keeps today parked in the
// middle slot always, instead of wherever its weekday happens to fall. No
// prev/next paging, this is a "what's today/nearby" glance, not a full
// calendar. Selecting a different day just re-filters the sections below to
// that date; it doesn't change what "today" means elsewhere.
export default function OverviewDateStrip({ today, selectedKey, onSelect }: OverviewDateStripProps) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3 + i)),
    [today],
  );

  return (
    <div className="flex flex-shrink-0 gap-1.5 rounded-theme bg-surface-alt p-1.5">
      {days.map((d) => {
        const key = dateKey(d);
        const selected = key === selectedKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={selected}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-theme-sm border px-1 py-1.5 text-center ${
              selected ? "border-accent bg-surface shadow-theme" : "border-transparent"
            }`}
          >
            <span className={`text-[0.6rem] font-semibold uppercase tracking-wide ${selected ? "text-accent" : "text-ink-muted"}`}>
              {DAY_LABELS[d.getDay()]}
            </span>
            <span className="text-sm font-bold text-ink">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
