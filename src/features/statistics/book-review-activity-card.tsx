import { useMemo } from "react";
import { computeBookReviewStats } from "@/lib/statistics/book-review-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { BookReviewsIcon } from "@/components/tab-icons/tab-icons";
import { AxisCaption, MiniStat, StatCardShell, StatEmpty, rangeNoun, resolveChartType, xAxisLabelFor } from "./stat-card-shell";
import { StatBarChart, StatLineChart } from "./stat-charts";

interface BookReviewActivityCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

export default function BookReviewActivityCard({ range, chartType, today }: BookReviewActivityCardProps) {
  const stats = useMemo(() => computeBookReviewStats(range, today), [range, today]);
  const resolved = resolveChartType(chartType, ["bar", "line"]);

  return (
    <StatCardShell icon={BookReviewsIcon} iconPath="/book-reviews" title="Reading Activity">
      {!stats.hasAnyData ? (
        <StatEmpty message="Add a book review to see activity here." />
      ) : (
        <>
          <p className="m-0">
            <span className="text-2xl font-bold text-ink">{stats.addedInRange}</span>{" "}
            <span className="text-xs text-ink-muted">books added {rangeNoun(range)}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Edited" value={stats.editedInRange} />
            <MiniStat label="Avg rating" value={stats.avgRating !== null ? `${stats.avgRating}★` : "—"} />
          </div>
          <div className="h-32">
            {resolved === "line" ? <StatLineChart data={stats.series} /> : <StatBarChart data={stats.series} />}
          </div>
          <AxisCaption x={xAxisLabelFor(range)} y="Books added" />
        </>
      )}
    </StatCardShell>
  );
}
