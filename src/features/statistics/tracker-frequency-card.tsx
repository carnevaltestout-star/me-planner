import { useMemo } from "react";
import { computeTrackerFrequencySeries, hasAnyTrackerEntries } from "@/lib/statistics/tracker-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { TrackersIcon } from "@/components/tab-icons/tab-icons";
import { ChartFrame, StatCardShell, StatEmpty, resolveChartType, xAxisLabelFor } from "./stat-card-shell";
import { StatBarChart, StatLineChart } from "./stat-charts";

interface TrackerFrequencyCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

export default function TrackerFrequencyCard({ range, chartType, today }: TrackerFrequencyCardProps) {
  const hasData = useMemo(() => hasAnyTrackerEntries(), []);
  const series = useMemo(() => computeTrackerFrequencySeries(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["bar", "line"]);

  return (
    <StatCardShell icon={TrackersIcon} iconPath="/trackers" title="Tracker Frequency">
      {!hasData ? (
        <StatEmpty message="Log a tracker entry to see frequency here." />
      ) : (
        <>
          <ChartFrame x={xAxisLabelFor(range)} y="Tracker entries">
            {resolved === "line" ? <StatLineChart data={series} /> : <StatBarChart data={series} />}
          </ChartFrame>
        </>
      )}
    </StatCardShell>
  );
}
