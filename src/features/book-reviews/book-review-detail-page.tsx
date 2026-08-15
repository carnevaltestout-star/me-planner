import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadBookReviews, saveBookReviews } from "@/lib/book-reviews/book-review-storage";
import { readAndResizeImage } from "@/lib/book-reviews/book-review-image";
import { emptyBookReview, isBookReviewEmpty, type BookReview } from "@/lib/book-reviews/book-review-types";
import BookReviewDeleteConfirm from "./book-review-delete-confirm";
import { CoverGlyphIcon, TrashIcon } from "./book-review-icons";
import StarRating from "./star-rating";

const inputClass =
  "w-full rounded-theme-sm border border-border bg-canvas px-2 py-1.5 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent";
const labelClass = "text-[0.68rem] uppercase tracking-wide text-ink-muted";
const textareaClass =
  "h-full min-h-[220px] w-full flex-1 resize-none rounded-theme-sm border border-border bg-canvas p-2.5 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent";

export default function BookReviewDetailPage() {
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();
  const isNew = bookId === "new" || !bookId;
  // A fresh id for a brand-new draft, stable across re-renders of this
  // mount — nothing is persisted under it until a field actually gets
  // filled in (same "don't save empty records" reasoning as Journal).
  const newId = useMemo(() => crypto.randomUUID(), []);
  const id = isNew ? newId : bookId!;

  const [reviews, setReviews] = useState(() => loadBookReviews());
  const [book, setBook] = useState<BookReview>(() => reviews[id] ?? emptyBookReview(id));
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const savedTimeoutRef = useRef<number>();
  const coverInputRef = useRef<HTMLInputElement>(null);

  function pulseSaved() {
    window.clearTimeout(savedTimeoutRef.current);
    setJustSaved(true);
    savedTimeoutRef.current = window.setTimeout(() => setJustSaved(false), 1600);
  }

  function persist(next: BookReview) {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    const updated = { ...reviews };
    if (isBookReviewEmpty(stamped)) {
      delete updated[id];
    } else {
      updated[id] = stamped;
    }
    setBook(stamped);
    setReviews(updated);
    saveBookReviews(updated);
  }

  function updateField<K extends keyof BookReview>(field: K, value: BookReview[K]) {
    setBook((b) => ({ ...b, [field]: value }));
  }

  function commit() {
    persist(book);
    pulseSaved();
  }

  function handleRating(rating: number) {
    const next = { ...book, rating };
    setBook(next);
    persist(next);
    pulseSaved();
  }

  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await readAndResizeImage(file);
    const next = { ...book, coverImage: dataUrl };
    setBook(next);
    persist(next);
    pulseSaved();
  }

  function handleCoverRemove() {
    const next = { ...book, coverImage: "" };
    setBook(next);
    persist(next);
    pulseSaved();
  }

  function handleSaveClick() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    persist(book);
    pulseSaved();
  }

  function handleDelete() {
    const updated = { ...reviews };
    delete updated[id];
    setReviews(updated);
    saveBookReviews(updated);
    navigate("/book-reviews");
  }

  return (
    <div className="book-reviews-page-bg flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      <div className="flex flex-shrink-0 items-center justify-between rounded-theme border border-border bg-surface px-3 py-2.5 shadow-theme">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back to book reviews"
            onClick={() => navigate("/book-reviews")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-sidenav text-ink shadow-theme hover:bg-surface-alt"
          >
            ‹
          </button>
          <h2 className="m-0 font-theme text-base font-semibold text-ink">Book review</h2>
        </div>
        <div className="flex items-center gap-2">
          {justSaved && <span className="text-xs text-ink-muted">Saved</span>}
          <button
            type="button"
            aria-label="Delete book review"
            title="Delete book review"
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            Save
          </button>
        </div>
      </div>

      {confirmDelete && (
        <BookReviewDeleteConfirm
          title={book.title}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      <div className="flex flex-col gap-4 rounded-theme border border-border bg-surface p-3 shadow-theme md:p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-shrink-0 flex-col gap-2">
            <div className="relative" style={{ width: 113, height: 164 }}>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                aria-label={book.coverImage ? "Replace cover image" : "Upload cover image"}
                title={book.coverImage ? "Replace cover image" : "Upload cover image"}
                className="group flex h-full w-full items-center justify-center overflow-hidden rounded-theme-sm border border-dashed border-accent hover:brightness-95"
                style={{ background: book.coverImage ? undefined : "var(--color-accent-soft)" }}
              >
                {book.coverImage ? (
                  <img src={book.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 px-2 text-center">
                    <CoverGlyphIcon className="h-10 w-10" style={{ color: "var(--color-accent)" }} />
                    <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-accent">
                      Upload cover
                    </span>
                  </span>
                )}
              </button>
              {book.coverImage && (
                <button
                  type="button"
                  onClick={handleCoverRemove}
                  aria-label="Remove cover image"
                  title="Remove cover image"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-xs font-bold text-ink shadow-theme hover:brightness-95"
                >
                  ×
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </div>
            <StarRating value={book.rating} onChange={handleRating} size="h-4 w-4" />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-2">
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>Title</span>
              <input
                type="text"
                value={book.title}
                onChange={(e) => updateField("title", e.target.value)}
                onBlur={commit}
                placeholder="Book title"
                className={inputClass}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>Author</span>
              <input
                type="text"
                value={book.author}
                onChange={(e) => updateField("author", e.target.value)}
                onBlur={commit}
                placeholder="Author"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Genre</span>
              <input
                type="text"
                value={book.genre}
                onChange={(e) => updateField("genre", e.target.value)}
                onBlur={commit}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Format</span>
              <input
                type="text"
                value={book.format}
                onChange={(e) => updateField("format", e.target.value)}
                onBlur={commit}
                placeholder="Physical, ebook…"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Start date</span>
              <input
                type="date"
                value={book.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                onBlur={commit}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>End date</span>
              <input
                type="date"
                value={book.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                onBlur={commit}
                className={inputClass}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-3">
            <div className="flex min-h-[240px] flex-col gap-1.5">
              <span className={labelClass}>Summary</span>
              <textarea
                value={book.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                onBlur={commit}
                placeholder="What's this book about?"
                className={textareaClass}
              />
            </div>
            <div className="flex min-h-[240px] flex-col gap-1.5">
              <span className={labelClass}>Quotes</span>
              <textarea
                value={book.quotes}
                onChange={(e) => updateField("quotes", e.target.value)}
                onBlur={commit}
                placeholder="Lines worth keeping"
                className={textareaClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex min-h-[240px] flex-col gap-1.5">
              <span className={labelClass}>Review</span>
              <textarea
                value={book.review}
                onChange={(e) => updateField("review", e.target.value)}
                onBlur={commit}
                placeholder="Your take"
                className={textareaClass}
              />
            </div>
            <div className="flex min-h-[240px] flex-col gap-1.5">
              <span className={labelClass}>Tropes</span>
              <textarea
                value={book.tropes}
                onChange={(e) => updateField("tropes", e.target.value)}
                onBlur={commit}
                placeholder="Recurring themes or tropes"
                className={textareaClass}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
