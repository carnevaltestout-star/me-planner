import { useMemo } from "react";
import { computeMoodDistribution } from "@/lib/statistics/tracker-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import type { MoodKey } from "@/lib/trackers/tracker-types";
import { MoodIcon } from "@/features/trackers/tracker-icon";
import { TrackersIcon } from "@/components/tab-icons/tab-icons";
import { StatCardShell, StatEmpty, resolveChartType } from "./stat-card-shell";
import { StatHistogram, StatPieChart } from "./stat-charts";

interface TrackerMoodCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

// Deliberately reuses the Trackers tab's own MoodIcon + mood colors, per
// spec: this card should visually connect back to the original Tracker
// interface rather than inventing a parallel icon set.
export default function TrackerMoodCard({ range, chartType, today }: TrackerMoodCardProps) {
  const slices = useMemo(() => computeMoodDistribution(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["pie", "histogram", "bar"]);

  return (
    <StatCardShell icon={TrackersIcon} iconPath="/trackers" title="Mood Distribution">
      {!slices ? (
        <StatEmpty message="Log a mood to see your distribution here." />
      ) : (
        <>
          <div className="h-36">{resolved === "pie" ? <StatPieChart data={slices} /> : <StatHistogram data={slices} />}</div>
          <ul className="m-0 flex flex-col gap-1.5 p-0 text-xs">
            {slices.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <MoodIcon mood={s.key as MoodKey} className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate text-ink">{s.label}</span>
                <span className="flex-shrink-0 font-semibold" style={{ color: s.color }}>
                  {s.percent}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </StatCardShell>
  );
}
