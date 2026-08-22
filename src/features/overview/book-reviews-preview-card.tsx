import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadBookReviews } from "@/lib/book-reviews/book-review-storage";
import { CoverGlyphIcon } from "@/features/book-reviews/book-review-icons";
import StarRating from "@/features/book-reviews/star-rating";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

const PREVIEW_COUNT = 10;

// First 10 books in shelf order (same manual drag-order as the real Book
// Reviews tab), as a scrollable list of single-row cards — clicking one
// opens that exact book on its own detail page, which is always an
// editable form (no separate view/edit mode to route into).
export default function BookReviewsPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle }: OverviewPreviewCardProps) {
  const books = useMemo(() => {
    const reviews = loadBookReviews();
    return Object.values(reviews)
      .sort((a, b) => a.order - b.order)
      .slice(0, PREVIEW_COUNT);
  }, []);

  return (
    <div className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme`}>
      <Link to={path} className="flex flex-shrink-0 items-center gap-2 hover:brightness-95">
        <Icon className={iconClassName} style={iconStyle} />
        <span className="text-sm font-semibold text-accent">{label}</span>
      </Link>

      {books.length === 0 ? (
        <p className="m-0 flex flex-1 items-center justify-center text-center text-xs text-ink-muted">
          No books yet — add one to start your shelf.
        </p>
      ) : (
        <ul className="m-0 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-0 pr-1">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                to={`/book-reviews/${book.id}`}
                className="flex items-center gap-2 rounded-theme-sm border border-border p-1.5 hover:border-accent hover:bg-surface-alt"
              >
                <div
                  className="flex h-9 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-[3px]"
                  style={{ background: book.coverImage ? undefined : "var(--color-accent-soft)" }}
                >
                  {book.coverImage ? (
                    <img src={book.coverImage} alt="" draggable={false} className="h-full w-full object-cover" />
                  ) : (
                    <CoverGlyphIcon className="h-3.5 w-3.5" style={{ color: "var(--color-accent)" }} />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-xs font-semibold text-ink">{book.title || "Untitled"}</span>
                  <span className="truncate text-[0.65rem] text-ink-muted">{book.author || "Unknown author"}</span>
                </div>
                <StarRating value={book.rating} size="h-2.5 w-2.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
