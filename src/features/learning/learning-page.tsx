import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { LearningIcon } from "@/components/tab-icons/tab-icons";

export default function LearningPage() {
  return (
    <EmptyTabPlaceholder
      icon={LearningIcon}
      description="Links, documents, and images you've been feeding your brain — searchable, sortable by topic. Built last, after every other tab."
      kawaiiIndex={10}
    />
  );
}
