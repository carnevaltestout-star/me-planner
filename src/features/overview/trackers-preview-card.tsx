import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadTrackersState, saveTrackersState } from "@/lib/trackers/tracker-storage";
import { dateKey } from "@/lib/trackers/tracker-dates";
import { isPeriodDay } from "@/lib/trackers/period-utils";
import type { Tracker } from "@/lib/trackers/tracker-types";
import TrackerIcon from "../trackers/tracker-icon";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

export default function TrackersPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle, today }: OverviewPreviewCardProps) {
  const [state, setState] = useState(() => loadTrackersState());
  const todayKey = useMemo(() => dateKey(today), [today]);

  function isChecked(tracker: Tracker) {
    if (tracker.kind === "period") return isPeriodDay(tracker, today);
    return Boolean(state.entries[tracker.id]?.[todayKey]);
  }

  // Only Done trackers have a plain on/off state to toggle inline — Amount,
  // Mood, and Period all need their own modal (see TrackersPage) to record
  // a value, so their square here stays a read-only status dot instead of
  // pretending to be a working checkbox.
  function toggleBoolean(tracker: Tracker, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trackerEntries = { ...(state.entries[tracker.id] ?? {}) };
    if (trackerEntries[todayKey]) delete trackerEntries[todayKey];
    else trackerEntries[todayKey] = true;
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
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={iconClassName} style={iconStyle} />
          <span className="truncate text-sm font-semibold text-accent">{label}</span>
          <span className="flex-shrink-0 text-[0.65rem] font-semibold text-ink-muted">
            {today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
        {state.trackers.length > 0 && (
          <span className="flex-shrink-0 text-[0.6rem] font-semibold uppercase tracking-wide text-ink-muted">Done</span>
        )}
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
                    aria-label={`${tracker.name} ${checked ? "done" : "not done"} today`}
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
