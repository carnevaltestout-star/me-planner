import EmptyTabPlaceholder from "@/components/empty-tab-placeholder/empty-tab-placeholder";
import { BookReviewsIcon } from "@/components/tab-icons/tab-icons";

export default function BookReviewsPage() {
  return (
    <EmptyTabPlaceholder
      icon={BookReviewsIcon}
      description="Books, thoughts, covers — filterable and sortable."
      kawaiiIndex={7}
    />
  );
}
