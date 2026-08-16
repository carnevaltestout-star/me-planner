import { useMemo } from "react";
import { computeJournalStats } from "@/lib/statistics/journal-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { JournalIcon } from "@/components/tab-icons/tab-icons";
import { ChartFrame, MiniStat, StatCardShell, StatEmpty, rangeNoun, resolveChartType, xAxisLabelFor } from "./stat-card-shell";
import { StatBarChart, StatLineChart } from "./stat-charts";

interface JournalStatsCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

export default function JournalStatsCard({ range, chartType, today }: JournalStatsCardProps) {
  const stats = useMemo(() => computeJournalStats(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["bar", "line"]);

  return (
    <StatCardShell icon={JournalIcon} iconPath="/journal" title="Journal Activity">
      {!stats.hasAnyData ? (
        <StatEmpty message="Statistics will appear as you start journaling." />
      ) : (
        <>
          <p className="m-0">
            <span className="text-2xl font-bold text-ink">{stats.totalInRange}</span>{" "}
            <span className="text-xs text-ink-muted">entries {rangeNoun(range)}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Current streak" value={`${stats.currentStreakDays}d`} />
            <MiniStat label="Longest streak" value={`${stats.longestStreakDays}d`} />
            <MiniStat label="Avg / week" value={stats.avgPerWeek} />
            <MiniStat label="Most active day" value={stats.mostActiveDay ?? "—"} />
          </div>
          <ChartFrame x={xAxisLabelFor(range)} y="Journal entries">
            {resolved === "line" ? <StatLineChart data={stats.series} /> : <StatBarChart data={stats.series} />}
          </ChartFrame>
        </>
      )}
    </StatCardShell>
  );
}
