import { Link } from "react-router-dom";
import { READING_STATUS_OPTIONS, type BookReview, type ReadingStatus } from "@/lib/book-reviews/book-review-types";
import { CoverGlyphIcon, TrashIcon } from "./book-review-icons";
import StarRating from "./star-rating";

interface BookReviewCardProps {
  book: BookReview;
  onDeleteRequest: () => void;
  onStatusChange: (status: ReadingStatus) => void;
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

export default function BookReviewCard({ book, onDeleteRequest, onStatusChange, suppressLink }: BookReviewCardProps) {
  const className =
    "group relative flex flex-col gap-2 rounded-theme border p-2 transition hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-theme";
  const style = { borderColor: "var(--color-accent)" };
  const status = READING_STATUS_OPTIONS.find((o) => o.key === book.status) ?? READING_STATUS_OPTIONS[0];

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
        style={{ background: book.coverImage ? undefined : "#ffffff" }}
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
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <StarRating value={book.rating} size="h-3 w-3" />
        {/* Native <select> styled as an oval pill, not a custom popover —
            same convention as principle-card.tsx's type tag. Click is
            stopped from bubbling since the whole card is a Link/drag
            surface (see suppressLink and dnd-kit's whole-card listeners
            elsewhere in this feature) that would otherwise swallow the tap
            before the dropdown gets a chance to open. */}
        <select
          value={status.key}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(e.target.value as ReadingStatus)}
          aria-label="Reading status"
          className="flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full border-none px-2 py-0.5 text-[0.6rem] font-bold"
          style={{ background: `color-mix(in srgb, ${status.color} 18%, var(--color-surface))`, color: status.color }}
        >
          {READING_STATUS_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
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
