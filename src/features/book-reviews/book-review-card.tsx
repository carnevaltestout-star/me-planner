import { Link } from "react-router-dom";
import type { BookReview } from "@/lib/book-reviews/book-review-types";
import { CoverGlyphIcon, TrashIcon } from "./book-review-icons";
import StarRating from "./star-rating";

interface BookReviewCardProps {
  book: BookReview;
  onDeleteRequest: () => void;
}

export default function BookReviewCard({ book, onDeleteRequest }: BookReviewCardProps) {
  return (
    <Link
      to={`/book-reviews/${book.id}`}
      className="group relative flex flex-col gap-2 rounded-theme border p-2 transition hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-theme"
      style={{ borderColor: "var(--color-accent)" }}
    >
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
          <img src={book.coverImage} alt="" className="h-full w-full object-cover" />
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
    </Link>
  );
}
