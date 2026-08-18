import { useMemo, useState } from "react";
import type { SVGProps } from "react";
import { dateKey, isFuture, monthLabel, shiftDay } from "@/lib/trackers/tracker-dates";
import { loadEnergyState, saveEnergyState } from "@/lib/trackers/energy-storage";
import type { EnergyPoint } from "@/lib/trackers/energy-types";
import TrackerMonthPicker from "./tracker-month-picker";
import EnergyDayChart from "./energy-day-chart";
import EnergyMonthView from "./energy-month-view";

type EnergyView = "day" | "month";

function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M11 2 4.5 11.5h4L8 18l7.5-9.5h-4L12.5 2Z" />
    </svg>
  );
}

// A second, independently-navigable card above the main tracker grid — its
// own day/month anchor rather than sharing TrackersPage's, since it's a
// completely different kind of data (freeform points on a chart, not a
// day-column grid).
export default function EnergyTrackerCard() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState<EnergyView>("day");
  const [state, setState] = useState(() => loadEnergyState());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const anchorKey = dateKey(anchor);
  const locked = isFuture(anchor);

  function persist(next: typeof state) {
    setState(next);
    saveEnergyState(next);
  }

  function handleChangePoints(points: EnergyPoint[]) {
    persist({ ...state, [anchorKey]: points });
  }

  function shiftMonth(date: Date, delta: number) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
  }

  function goPrev() {
    setAnchor((a) => (view === "month" ? shiftMonth(a, -1) : shiftDay(a, -1)));
  }

  function goNext() {
    setAnchor((a) => (view === "month" ? shiftMonth(a, 1) : shiftDay(a, 1)));
  }

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 rounded-theme border border-border bg-surface p-3 shadow-theme">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded-full border border-border bg-sidenav px-2.5 py-1 text-xs font-semibold text-ink shadow-theme hover:bg-surface-alt"
          >
            Today
          </button>
          <button
            type="button"
            aria-label={view === "month" ? "Previous month" : "Previous day"}
            onClick={goPrev}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
          >
            ‹
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMonthPickerOpen(true)}
              className="rounded-full border px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-alt"
              style={{ borderColor: "var(--color-accent)" }}
            >
              {view === "month"
                ? monthLabel(anchor.getFullYear(), anchor.getMonth())
                : anchor.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </button>
            {monthPickerOpen && (
              <TrackerMonthPicker
                anchor={anchor}
                onSelect={(year, month) => {
                  setAnchor(new Date(year, month, 1));
                  setMonthPickerOpen(false);
                }}
                onClose={() => setMonthPickerOpen(false)}
              />
            )}
          </div>
          <button
            type="button"
            aria-label={view === "month" ? "Next month" : "Next day"}
            onClick={goNext}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
          >
            ›
          </button>
        </div>
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            aria-pressed={view === "day"}
            onClick={() => {
              // Switching from Month back to Day always lands on today,
              // rather than wherever the month grid happened to leave the
              // anchor (e.g. the 1st of some month you'd navigated to).
              if (view !== "day") setAnchor(new Date());
              setView("day");
            }}
            className={`px-3 py-1 text-xs ${view === "day" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
          >
            Day
          </button>
          <button
            type="button"
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
            className={`px-3 py-1 text-xs ${view === "month" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-accent-soft)" }}
        >
          <BoltIcon className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
        </span>
        <h3 className="m-0 text-sm font-semibold text-ink">Energy Tracker</h3>
      </div>

      {view === "day" ? (
        <EnergyDayChart points={state[anchorKey] ?? []} onChange={handleChangePoints} locked={locked} />
      ) : (
        <EnergyMonthView anchor={anchor} state={state} />
      )}
    </div>
  );
}
