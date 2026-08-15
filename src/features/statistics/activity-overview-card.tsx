import { useMemo } from "react";
import { computeActivityStats } from "@/lib/statistics/activity-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { StatisticsIcon } from "@/components/tab-icons/tab-icons";
import { AxisCaption, MiniStat, StatCardShell, StatEmpty, resolveChartType, xAxisLabelFor } from "./stat-card-shell";
import { StatBarChart, StatLineChart } from "./stat-charts";

interface ActivityOverviewCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

export default function ActivityOverviewCard({ range, chartType, today }: ActivityOverviewCardProps) {
  const stats = useMemo(() => computeActivityStats(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["bar", "line"]);

  return (
    <StatCardShell icon={StatisticsIcon} iconPath="/statistics" title="Activity Overview" wide>
      {!stats.hasAnyData ? (
        <StatEmpty message="Statistics will appear as you use the app." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="Total activities" value={stats.totalActivities} />
            <MiniStat label="Active days" value={stats.activeDays} />
            <MiniStat label="Most active" value={stats.mostActiveSection ?? "—"} />
            <MiniStat label="Current streak" value={`${stats.currentStreakDays}d`} />
          </div>
          <div className="h-40">
            {resolved === "line" ? <StatLineChart data={stats.series} /> : <StatBarChart data={stats.series} />}
          </div>
          <AxisCaption x={xAxisLabelFor(range)} y="Activities" />
        </>
      )}
    </StatCardShell>
  );
}
