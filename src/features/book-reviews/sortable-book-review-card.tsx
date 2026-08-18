import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BookReview } from "@/lib/book-reviews/book-review-types";
import BookReviewCard from "./book-review-card";

interface SortableBookReviewCardProps {
  book: BookReview;
  onDeleteRequest: () => void;
  suppressLink: boolean;
}

// Same whole-card-is-the-drag-surface approach as Goals/To-Dos' sortable
// card — the sensors' activation constraints (see book-reviews-page.tsx)
// are what keep a plain tap/click on the card (opening the detail page)
// from being mistaken for a drag.
export default function SortableBookReviewCard({ book, onDeleteRequest, suppressLink }: SortableBookReviewCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: book.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <BookReviewCard book={book} onDeleteRequest={onDeleteRequest} suppressLink={suppressLink} />
    </div>
  );
}
