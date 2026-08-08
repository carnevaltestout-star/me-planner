import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { TrackersIcon } from "@/components/tab-icons/tab-icons";

export default function TrackersPage() {
  return (
    <EmptyTabPlaceholder
      icon={TrackersIcon}
      description="Period, mood, and contentment check-ins over time."
    />
  );
}
