import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadTrackersState, saveTrackersState } from "@/lib/trackers/tracker-storage";
import { loadEnergyState, saveEnergyState } from "@/lib/trackers/energy-storage";
import { dateKey, shiftDay } from "@/lib/trackers/tracker-dates";
import { isPeriodDay } from "@/lib/trackers/period-utils";
import { energyColor, ENERGY_TIME_MAX, ENERGY_TIME_MIN } from "@/lib/trackers/energy-types";
import type { Tracker } from "@/lib/trackers/tracker-types";
import TrackerIcon from "../trackers/tracker-icon";
import { BoltIcon } from "../trackers/energy-tracker-card";
import EnergyMiniChart from "./energy-mini-chart";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

const QUICK_ENERGY_LEVELS: { label: string; value: number }[] = [
  { label: "L", value: 15 },
  { label: "M", value: 50 },
  { label: "H", value: 85 },
];

export default function TrackersPreviewCard({ path, label, today }: OverviewPreviewCardProps) {
  const [state, setState] = useState(() => loadTrackersState());
  const [energyState, setEnergyState] = useState(() => loadEnergyState());
  // 0 = today, higher = further in the past — paged via the arrows flanking
  // the card's title instead of leaving Overview to see other days.
  const [dayOffset, setDayOffset] = useState(0);
  const viewedDate = useMemo(() => shiftDay(today, -dayOffset), [today, dayOffset]);
  const viewedKey = dateKey(viewedDate);
  const isToday = dayOffset === 0;
  const viewedPoints = energyState[viewedKey] ?? [];

  function goPrevDay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDayOffset((d) => d + 1);
  }

  function goNextDay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDayOffset((d) => Math.max(0, d - 1));
  }

  // Quick-set from Overview writes into the same per-day points array the
  // real Energy Tracker chart reads/draws — a point placed "now" here shows
  // up on that chart too, not a separate copy of the day's energy data.
  // Only available while viewing today (the buttons are disabled otherwise).
  function setQuickEnergy(value: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isToday) return;
    const now = new Date();
    const rawHour = now.getHours() + now.getMinutes() / 60;
    // Hours after midnight (0-3am) belong on the chart's post-midnight tail
    // (24-27), not clamped down to the 5am start of the tracked window.
    const wrappedHour = rawHour < 4 ? rawHour + 24 : rawHour;
    const time = Math.max(ENERGY_TIME_MIN, Math.min(ENERGY_TIME_MAX, wrappedHour));
    // Replaces a point already close to "now" instead of stacking duplicates
    // from repeated quick-edits here, same granularity the chart's own
    // click-to-add uses for telling two clicks apart from one drag.
    const withoutNearby = viewedPoints.filter((p) => Math.abs(p.time - time) > 0.25);
    const nextPoints = [...withoutNearby, { time, value }].sort((a, b) => a.time - b.time);
    const next = { ...energyState, [viewedKey]: nextPoints };
    setEnergyState(next);
    saveEnergyState(next);
  }

  function isChecked(tracker: Tracker) {
    if (tracker.kind === "period") return isPeriodDay(tracker, viewedDate);
    return Boolean(state.entries[tracker.id]?.[viewedKey]);
  }

  // Only Done trackers have a plain on/off state to toggle inline — Amount,
  // Mood, and Period all need their own modal (see TrackersPage) to record
  // a value, so their square here stays a read-only status dot instead of
  // pretending to be a working checkbox. Writes to viewedKey (not always
  // today) — paging back with the arrows and checking a habit here logs it
  // for that day, the same as toggling it from the real Trackers tab would.
  function toggleBoolean(tracker: Tracker, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trackerEntries = { ...(state.entries[tracker.id] ?? {}) };
    if (trackerEntries[viewedKey]) delete trackerEntries[viewedKey];
    else trackerEntries[viewedKey] = true;
    const next = { ...state, entries: { ...state.entries, [tracker.id]: trackerEntries } };
    setState(next);
    saveTrackersState(next);
  }

  return (
    <Link
      to={path}
      className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme hover:brightness-95`}
    >
      <div className="flex flex-shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Show previous day"
            onClick={goPrevDay}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs text-accent hover:brightness-95"
            style={{ background: "var(--color-accent-soft)" }}
          >
            ‹
          </button>
          <span className="truncate text-sm font-semibold text-accent">{label}</span>
          <button
            type="button"
            aria-label="Show next day"
            disabled={isToday}
            onClick={goNextDay}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs text-accent hover:brightness-95 disabled:opacity-30"
            style={{ background: "var(--color-accent-soft)" }}
          >
            ›
          </button>
          <span className="flex-shrink-0 text-[0.65rem] font-semibold text-ink-muted">
            {isToday ? "Today" : viewedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
        {state.trackers.length > 0 && (
          <span className="flex-shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide text-ink-muted">Done</span>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col gap-1.5 border-b border-border pb-2.5">
        <div className="flex items-center gap-1.5">
          <BoltIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
          <span className="truncate text-xs font-semibold text-ink">Energy Level</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <EnergyMiniChart points={viewedPoints} />
        </div>
        <div className="flex gap-1">
          {QUICK_ENERGY_LEVELS.map((lvl) => (
            <button
              key={lvl.label}
              type="button"
              aria-label={`Log ${lvl.label === "L" ? "Low" : lvl.label === "M" ? "Medium" : "High"} energy now`}
              disabled={!isToday}
              onClick={(e) => setQuickEnergy(lvl.value, e)}
              className="flex h-6 flex-1 items-center justify-center rounded-theme-sm border text-[0.68rem] font-bold hover:brightness-95 disabled:opacity-30 disabled:hover:brightness-100"
              style={{ borderColor: energyColor(lvl.value), color: energyColor(lvl.value) }}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {state.trackers.length === 0 ? (
          <p className="m-0 text-xs text-ink-muted">No trackers yet.</p>
        ) : (
          <ul className="m-0 flex flex-col gap-1.5">
            {state.trackers.map((tracker) => {
              const checked = isChecked(tracker);
              const toggleable = tracker.kind === "boolean";
              return (
                <li key={tracker.id} className="flex items-center gap-1.5 text-xs">
                  <TrackerIcon icon={tracker.icon} className="h-3.5 w-3.5 flex-shrink-0" style={{ color: tracker.color }} />
                  <span className="min-w-0 flex-1 truncate text-ink">{tracker.name}</span>
                  <button
                    type="button"
                    aria-label={`${tracker.name} ${checked ? "done" : "not done"} ${isToday ? "today" : viewedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                    aria-pressed={checked}
                    disabled={!toggleable}
                    onClick={toggleable ? (e) => toggleBoolean(tracker, e) : undefined}
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[3px] border hover:brightness-95 disabled:cursor-default"
                    style={{ borderColor: tracker.color, background: checked ? tracker.color : "#ffffff" }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Link>
  );
}
