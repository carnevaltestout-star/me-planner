import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadBookReviews, saveBookReviews } from "@/lib/book-reviews/book-review-storage";
import type { BookReview } from "@/lib/book-reviews/book-review-types";
import BookReviewCard from "./book-review-card";
import BookReviewDeleteConfirm from "./book-review-delete-confirm";
import { SearchIcon } from "./book-review-icons";

export default function BookReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(() => loadBookReviews());
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<BookReview | null>(null);

  function handleDelete(book: BookReview) {
    const updated = { ...reviews };
    delete updated[book.id];
    setReviews(updated);
    saveBookReviews(updated);
    setPendingDelete(null);
  }

  const books = useMemo(
    () => Object.values(reviews).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const haystack = [b.title, b.author, b.summary, b.review, b.quotes, b.tropes].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [books, query]);

  return (
    <div className="book-reviews-page-bg flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      <div className="flex flex-shrink-0 flex-col gap-2 rounded-theme border border-border bg-surface px-3 py-2.5 shadow-theme">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, author, or text…"
            className="w-full rounded-theme-sm border border-border bg-canvas py-2 pl-8 pr-2.5 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate("/book-reviews/new")}
          className="flex items-center gap-1.5 self-start rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-contrast shadow-theme hover:brightness-105"
        >
          <span className="text-base leading-none">+</span>
          Add book review
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="pt-6 text-center text-sm text-ink-muted">
          {books.length === 0 ? "No book reviews yet — tap + to add one." : "No book reviews match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((book) => (
            <BookReviewCard key={book.id} book={book} onDeleteRequest={() => setPendingDelete(book)} />
          ))}
        </div>
      )}

      {pendingDelete && (
        <BookReviewDeleteConfirm
          title={pendingDelete.title}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => handleDelete(pendingDelete)}
        />
      )}
    </div>
  );
}
