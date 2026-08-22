import { useMemo } from "react";
import {
  computeEnergyDistribution,
  computeEnergyHourAverages,
  computeEnergyHourMode,
  computeEnergySummary,
  hasAnyEnergyEntries,
} from "@/lib/statistics/energy-stats";
import { energyColor, energyLabel } from "@/lib/trackers/energy-types";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { TrackersIcon } from "@/components/tab-icons/tab-icons";
import { ChartFrame, MiniStat, StatCardShell, StatEmpty, resolveChartType } from "./stat-card-shell";
import { StatBarChart, StatHistogram, StatLineChart, StatPieChart } from "./stat-charts";

interface EnergyLevelCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

// Chart type changes what this card actually shows, not just how the same
// numbers are drawn: bar/line plot energy against hour-of-day (the pattern
// across a day), while pie/histogram plot the Low/Medium/High split across
// every logged point — two genuinely different questions ("when am I at my
// best?" vs "how much of my day reads high vs low overall?").
export default function EnergyLevelCard({ range, chartType, today }: EnergyLevelCardProps) {
  const hasData = useMemo(() => hasAnyEnergyEntries(), []);
  const resolved = resolveChartType(chartType, ["bar", "line", "pie", "histogram"]);
  const isDistribution = resolved === "pie" || resolved === "histogram";

  const hourSeries = useMemo(
    () => (isDistribution ? [] : resolved === "line" ? computeEnergyHourAverages(range, today) : computeEnergyHourMode(range, today)),
    [isDistribution, resolved, range, today],
  );
  const distribution = useMemo(() => (isDistribution ? computeEnergyDistribution(range, today) : null), [isDistribution, range, today]);
  const summary = useMemo(() => computeEnergySummary(range, today), [range, today]);

  const isEmpty = isDistribution ? !distribution : hourSeries.every((p) => p.value === 0);

  return (
    <StatCardShell icon={TrackersIcon} iconPath="/trackers" title="Energy Level">
      {!hasData || isEmpty ? (
        <StatEmpty message="Log your energy level to see stats here." />
      ) : (
        <>
          {isDistribution ? (
            <>
              <div className="h-36">{resolved === "pie" ? <StatPieChart data={distribution!} /> : <StatHistogram data={distribution!} />}</div>
              <ul className="m-0 flex flex-col gap-1.5 p-0 text-xs">
                {distribution!.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 truncate text-ink">{s.label}</span>
                    <span className="flex-shrink-0 font-semibold" style={{ color: s.color }}>
                      {s.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ChartFrame x="Hour of day" y={resolved === "line" ? "Avg. energy lvl." : "Most common lvl."}>
              {resolved === "line" ? <StatLineChart data={hourSeries} /> : <StatBarChart data={hourSeries} />}
            </ChartFrame>
          )}
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Points logged" value={summary.loggedPoints} />
            <MiniStat
              label="Average level"
              value={
                summary.averageLevel === null ? (
                  "—"
                ) : (
                  <span style={{ color: energyColor(summary.averageLevel) }}>{energyLabel(summary.averageLevel)}</span>
                )
              }
            />
          </div>
        </>
      )}
    </StatCardShell>
  );
}
