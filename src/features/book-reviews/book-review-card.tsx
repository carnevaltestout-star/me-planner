import { Link } from "react-router-dom";
import type { BookReview } from "@/lib/book-reviews/book-review-types";
import { CoverGlyphIcon, TrashIcon } from "./book-review-icons";
import StarRating from "./star-rating";

interface BookReviewCardProps {
  book: BookReview;
  onDeleteRequest: () => void;
  // When true, renders as a plain (non-navigating) div instead of a Link —
  // used right after a drag so there's no anchor for the browser's native
  // click-after-drop to navigate through in the first place. Checking
  // isDragging/preventDefault at click time isn't reliable here: dnd-kit's
  // own click guard only calls stopPropagation(), which stops the event
  // before it ever reaches this component's own click handler (or React's
  // delegated one), so nothing downstream gets a chance to cancel the
  // anchor's native "follow the href" default action. Not rendering an
  // anchor at all sidesteps that entirely.
  suppressLink?: boolean;
}

export default function BookReviewCard({ book, onDeleteRequest, suppressLink }: BookReviewCardProps) {
  const className =
    "group relative flex flex-col gap-2 rounded-theme border p-2 transition hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-theme";
  const style = { borderColor: "var(--color-accent)" };

  const content = (
    <>
      <button
        type="button"
        aria-label={`Delete ${book.title || "this book review"}`}
        title="Delete"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDeleteRequest();
        }}
        className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-muted opacity-100 shadow-theme transition hover:text-[#c22a4d] md:opacity-0 md:group-hover:opacity-100"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
      <div
        className="flex aspect-[3/4.4] w-full items-center justify-center overflow-hidden rounded-theme-sm transition-transform duration-150 group-hover:scale-[1.03]"
        style={{ background: book.coverImage ? undefined : "var(--color-accent-soft)" }}
      >
        {book.coverImage ? (
          <img src={book.coverImage} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <CoverGlyphIcon className="h-10 w-10" style={{ color: "var(--color-accent)" }} />
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="m-0 truncate text-[0.68rem] font-semibold uppercase tracking-wide text-ink">{book.title || "Untitled"}</p>
        <p className="m-0 truncate text-[0.68rem] uppercase tracking-wide text-ink-muted">{book.author || "Unknown author"}</p>
      </div>
      <div className="px-0.5">
        <StarRating value={book.rating} size="h-3 w-3" />
      </div>
    </>
  );

  if (suppressLink) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <Link to={`/book-reviews/${book.id}`} draggable={false} className={className} style={style}>
      {content}
    </Link>
  );
}
