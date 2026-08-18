import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadEvents } from "@/lib/planner/planner-storage";
import { eventOccursOn, fmtHour } from "@/lib/planner/planner-dates";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

// Today's appointments only, sorted by start time — a miniature of the
// Planner day view rather than the full grid, since the grid's hour-offset
// positioning doesn't shrink down cleanly into a small card.
export default function PlannerPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle, today }: OverviewPreviewCardProps) {
  const events = useMemo(() => loadEvents().filter((ev) => eventOccursOn(ev, today)).sort((a, b) => a.start - b.start), [today]);

  return (
    <Link
      to={path}
      className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme hover:brightness-95`}
    >
      <div className="flex flex-shrink-0 items-center gap-2">
        <Icon className={iconClassName} style={iconStyle} />
        <span className="text-sm font-semibold text-accent">{label}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="m-0 text-xs text-ink-muted">No events today.</p>
        ) : (
          <ul className="m-0 flex flex-col gap-1.5">
            {events.map((ev) => (
              <li key={ev.id} className="flex items-start gap-1.5 text-xs">
                <span aria-hidden="true" className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ev.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{ev.title || "Untitled"}</span>
                  <span className="block text-ink-muted">
                    {fmtHour(ev.start)} – {fmtHour(ev.end)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
