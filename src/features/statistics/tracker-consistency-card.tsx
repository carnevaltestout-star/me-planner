import { useMemo } from "react";
import { computeHabitActivitySeries } from "@/lib/statistics/tracker-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { TrackersIcon } from "@/components/tab-icons/tab-icons";
import { AxisCaption, StatCardShell, StatEmpty, resolveChartType, xAxisLabelFor } from "./stat-card-shell";
import { StatMultiBarChart, StatMultiLineChart } from "./stat-charts";

interface TrackerConsistencyCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

export default function TrackerConsistencyCard({ range, chartType, today }: TrackerConsistencyCardProps) {
  const activity = useMemo(() => computeHabitActivitySeries(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["line", "bar"]);

  return (
    <StatCardShell icon={TrackersIcon} iconPath="/trackers" title="Habit Consistency">
      {activity.series.length === 0 ? (
        <StatEmpty message="Add a Done or Amount tracker to see consistency here." />
      ) : (
        <>
          <div className="h-36">
            {resolved === "bar" ? (
              <StatMultiBarChart data={activity.points} series={activity.series} />
            ) : (
              <StatMultiLineChart data={activity.points} series={activity.series} />
            )}
          </div>
          <ul className="m-0 flex flex-col gap-1 p-0 text-xs">
            {activity.overall.map((i) => (
              <li key={i.tracker.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: i.tracker.color }} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{i.tracker.name}</span>
                <span className="flex-shrink-0 font-semibold text-ink">{i.percent}%</span>
              </li>
            ))}
          </ul>
          <AxisCaption x={xAxisLabelFor(range)} y="Completion rate (%)" />
        </>
      )}
    </StatCardShell>
  );
}
