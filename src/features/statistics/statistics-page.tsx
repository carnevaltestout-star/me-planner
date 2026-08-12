import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { StatisticsIcon } from "@/components/tab-icons/tab-icons";

export default function StatisticsPage() {
  return (
    <EmptyTabPlaceholder
      icon={StatisticsIcon}
      description="Cards showing mood, habits, and productivity over time, once the trackers exist."
      kawaiiIndex={8}
    />
  );
}
