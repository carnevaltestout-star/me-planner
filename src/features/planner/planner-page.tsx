import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { PlannerIcon } from "@/components/tab-icons/tab-icons";

export default function PlannerPage() {
  return (
    <EmptyTabPlaceholder
      icon={PlannerIcon}
      description="Full week, full day, extended hours. This is the default tab."
    />
  );
}
