import { useMemo, useState } from "react";
import { CHART_TYPES, TIME_RANGES, type ChartType, type TimeRange } from "@/lib/statistics/stat-types";
import { PrinciplesIcon, VocabularyIcon } from "@/components/tab-icons/tab-icons";
import { BarChartTypeIcon, HistogramTypeIcon, LineChartTypeIcon, PieChartTypeIcon } from "./chart-type-icons";
import ActivityOverviewCard from "./activity-overview-card";
import JournalStatsCard from "./journal-stats-card";
import TrackerConsistencyCard from "./tracker-consistency-card";
import TrackerMoodCard from "./tracker-mood-card";
import TrackerFrequencyCard from "./tracker-frequency-card";
import BookReviewActivityCard from "./book-review-activity-card";
import BookReviewRatingsCard from "./book-review-ratings-card";
import GoalsTodosStatsCard from "./goals-todos-stats-card";
import StubStatCard from "./stub-stat-card";

const CHART_TYPE_ICONS: Record<ChartType, typeof BarChartTypeIcon> = {
  bar: BarChartTypeIcon,
  line: LineChartTypeIcon,
  pie: PieChartTypeIcon,
  histogram: HistogramTypeIcon,
};

export default function StatisticsPage() {
  const [range, setRange] = useState<TimeRange>("month");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const today = useMemo(() => new Date(), []);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      <div className="flex flex-shrink-0 flex-col gap-2.5 rounded-theme border border-border bg-surface px-3 py-2.5 shadow-theme md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1">
          {CHART_TYPES.map(({ key, label }) => {
            const Icon = CHART_TYPE_ICONS[key];
            const active = chartType === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={active}
                title={label}
                onClick={() => setChartType(key)}
                className={`flex h-8 w-8 items-center justify-center rounded-theme-sm ${
                  active ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TIME_RANGES.map(({ key, label }) => {
            const active = range === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setRange(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? "bg-accent text-accent-contrast" : "bg-canvas text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ActivityOverviewCard range={range} chartType={chartType} today={today} />
        <JournalStatsCard range={range} chartType={chartType} today={today} />
        <TrackerConsistencyCard range={range} today={today} />
        <TrackerMoodCard range={range} chartType={chartType} today={today} />
        <TrackerFrequencyCard range={range} chartType={chartType} today={today} />
        <BookReviewActivityCard range={range} chartType={chartType} today={today} />
        <BookReviewRatingsCard range={range} chartType={chartType} today={today} />
        <GoalsTodosStatsCard range={range} chartType={chartType} today={today} />
        <StubStatCard
          icon={PrinciplesIcon}
          iconPath="/principles"
          title="Principles"
          message="Statistics will appear once you start using Principles."
        />
        <StubStatCard
          icon={VocabularyIcon}
          iconPath="/vocabulary"
          title="Vocabulary"
          message="Statistics will appear once you start using Vocabulary."
        />
      </div>
    </div>
  );
}
