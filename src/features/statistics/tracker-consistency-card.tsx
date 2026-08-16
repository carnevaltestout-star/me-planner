import { useMemo } from "react";
import { computeHabitActivitySeries } from "@/lib/statistics/tracker-stats";
import type { TimeRange } from "@/lib/statistics/stat-types";
import { TrackersIcon } from "@/components/tab-icons/tab-icons";
import { StatCardShell, StatEmpty, xAxisLabelFor } from "./stat-card-shell";
import HabitHeatmap from "./habit-heatmap";

interface TrackerConsistencyCardProps {
  range: TimeRange;
  today: Date;
}

// A grid (habit × time bucket) rather than overlapping lines/bars — reads
// clearly even with several habits or a month's worth of days, and mirrors
// the Trackers tab's own grid-of-cells visual language.
export default function TrackerConsistencyCard({ range, today }: TrackerConsistencyCardProps) {
  const activity = useMemo(() => computeHabitActivitySeries(range, today), [range, today]);

  return (
    <StatCardShell icon={TrackersIcon} iconPath="/trackers" title="Habit Consistency">
      {activity.series.length === 0 ? (
        <StatEmpty message="Add a Done or Amount tracker to see consistency here." />
      ) : (
        <>
          <p className="m-0 text-[0.65rem] text-ink-muted">Y: Habit</p>
          <HabitHeatmap points={activity.points} series={activity.series} />
          <p className="m-0 text-right text-[0.65rem] text-ink-muted">X: {xAxisLabelFor(range)}</p>
          <ul className="m-0 flex flex-col gap-1 p-0 text-xs">
            {activity.overall.map((i) => (
              <li key={i.tracker.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: i.tracker.color }} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{i.tracker.name}</span>
                <span className="flex-shrink-0 font-semibold text-ink">{i.percent}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </StatCardShell>
  );
}
