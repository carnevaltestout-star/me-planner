import { useMemo } from "react";
import { computeBookReviewStats } from "@/lib/statistics/book-review-stats";
import type { ChartType, TimeRange } from "@/lib/statistics/stat-types";
import { BookReviewsIcon } from "@/components/tab-icons/tab-icons";
import { StatCardShell, StatEmpty, resolveChartType } from "./stat-card-shell";
import { StatHistogram, StatPieChart } from "./stat-charts";

interface BookReviewRatingsCardProps {
  range: TimeRange;
  chartType: ChartType;
  today: Date;
}

// Ratings distribution is deliberately computed across the person's whole
// library rather than range-filtered — "how do I tend to rate books" isn't
// a time-based question the way reading activity is.
export default function BookReviewRatingsCard({ chartType, today }: BookReviewRatingsCardProps) {
  const stats = useMemo(() => computeBookReviewStats("all", today), [today]);
  const resolved = resolveChartType(chartType, ["histogram", "pie", "bar"]);

  return (
    <StatCardShell icon={BookReviewsIcon} iconPath="/book-reviews" title="Ratings Distribution">
      {stats.ratingsDistribution.length === 0 ? (
        <StatEmpty message="Rate a book to see your ratings distribution here." />
      ) : (
        <>
          <div className="h-36">
            {resolved === "pie" ? <StatPieChart data={stats.ratingsDistribution} /> : <StatHistogram data={stats.ratingsDistribution} />}
          </div>
          <ul className="m-0 flex flex-col gap-1.5 p-0 text-xs">
            {stats.ratingsDistribution.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span className="flex-1 text-ink">{s.label}</span>
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
