import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BookReview, ReadingStatus } from "@/lib/book-reviews/book-review-types";
import BookReviewCard from "./book-review-card";

interface SortableBookReviewCardProps {
  book: BookReview;
  onDeleteRequest: () => void;
  onStatusChange: (status: ReadingStatus) => void;
  suppressLink: boolean;
}

// Same whole-card-is-the-drag-surface approach as Goals/To-Dos' sortable
// card — the sensors' activation constraints (see book-reviews-page.tsx)
// are what keep a plain tap/click on the card (opening the detail page)
// from being mistaken for a drag.
//
// touchAction must stay "manipulation", not "none": the TouchSensor's
// `delay` activation constraint only calls preventDefault() on touchmove
// once a press has been held past the delay without exceeding the
// tolerance (see AbstractPointerSensor.handleMove upstream) — during that
// pending window it does nothing and defers entirely to the browser's own
// touch-action handling. touch-action is fixed by the browser at
// touchstart, before any of that JS runs, so "none" would block native
// vertical scrolling on every card from the very first touch (this is
// most of the screen on mobile), regardless of whether the gesture turns
// out to be a scroll or a drag. "manipulation" still allows panning (only
// double-tap/pinch zoom are suppressed), so a quick swipe scrolls
// normally and only a press held past the delay turns into a drag, at
// which point dnd-kit takes over via its own preventDefault calls.
export default function SortableBookReviewCard({ book, onDeleteRequest, onStatusChange, suppressLink }: SortableBookReviewCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: book.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        touchAction: "manipulation",
      }}
      {...attributes}
      {...listeners}
    >
      <BookReviewCard book={book} onDeleteRequest={onDeleteRequest} onStatusChange={onStatusChange} suppressLink={suppressLink} />
    </div>
  );
}
