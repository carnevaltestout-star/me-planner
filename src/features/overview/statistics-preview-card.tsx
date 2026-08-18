import { Link } from "react-router-dom";
import ActivityOverviewCard from "../statistics/activity-overview-card";
import JournalStatsCard from "../statistics/journal-stats-card";
import TrackerConsistencyCard from "../statistics/tracker-consistency-card";
import TrackerMoodCard from "../statistics/tracker-mood-card";
import TrackerFrequencyCard from "../statistics/tracker-frequency-card";
import BookReviewActivityCard from "../statistics/book-review-activity-card";
import BookReviewRatingsCard from "../statistics/book-review-ratings-card";
import GoalsTodosStatsCard from "../statistics/goals-todos-stats-card";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

// Every Statistics card, reused as-is, stacked vertically — same fixed card
// height as every other Overview tile, scrolling down through all eight
// instead of growing the card or spilling out sideways.
export default function StatisticsPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle, today }: OverviewPreviewCardProps) {
  const range = "week" as const;
  const chartType = "bar" as const;

  return (
    <Link
      to={path}
      className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme hover:brightness-95`}
    >
      <div className="flex flex-shrink-0 items-center gap-2">
        <Icon className={iconClassName} style={iconStyle} />
        <span className="text-sm font-semibold text-accent">{label}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        <ActivityOverviewCard range={range} chartType={chartType} today={today} />
        <JournalStatsCard range={range} chartType={chartType} today={today} />
        <TrackerConsistencyCard range={range} today={today} />
        <TrackerMoodCard range={range} chartType={chartType} today={today} />
        <TrackerFrequencyCard range={range} chartType={chartType} today={today} />
        <BookReviewActivityCard range={range} chartType={chartType} today={today} />
        <BookReviewRatingsCard range={range} chartType={chartType} today={today} />
        <GoalsTodosStatsCard range={range} chartType={chartType} today={today} />
      </div>
    </Link>
  );
}
