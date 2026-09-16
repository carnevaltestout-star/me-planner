import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { loadBookReviews, saveBookReviews } from "@/lib/book-reviews/book-review-storage";
import type { BookReview, ReadingStatus } from "@/lib/book-reviews/book-review-types";
import { matchesDateQuery } from "@/lib/search/date-search";
import BookReviewCard from "./book-review-card";
import SortableBookReviewCard from "./sortable-book-review-card";
import BookReviewDeleteConfirm from "./book-review-delete-confirm";
import { SearchIcon } from "./book-review-icons";

export default function BookReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(() => loadBookReviews());
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<BookReview | null>(null);

  function persist(next: Record<string, BookReview>) {
    setReviews(next);
    saveBookReviews(next);
  }

  function handleDelete(book: BookReview) {
    const updated = { ...reviews };
    delete updated[book.id];
    persist(updated);
    setPendingDelete(null);
  }

  function handleStatusChange(id: string, status: ReadingStatus) {
    persist({ ...reviews, [id]: { ...reviews[id], status, updatedAt: new Date().toISOString() } });
  }

  // Manual drag order — seeded/migrated highest-rated-first, then whatever
  // the user has dragged since (see book-review-storage.ts).
  const books = useMemo(() => Object.values(reviews).sort((a, b) => a.order - b.order), [reviews]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // Without a DragOverlay, the card being dragged is the same DOM node the
  // mouse/finger came down on and lifts off on, so the browser still fires
  // a native click on whatever anchor is under the cursor at drop time
  // (the dragged card's own node, or the one it landed on — dnd-kit
  // doesn't raise z-index for us, so it's whichever one is on top).
  // dnd-kit's own click guard only calls stopPropagation() on that click,
  // which stops it from ever reaching this component's onClick (or
  // React's own delegated handler) at all — so nothing downstream gets a
  // chance to call preventDefault(), and the anchor's native "follow the
  // href" action goes through anyway. Not rendering an anchor at all
  // during/right after a drag sidesteps that entirely: this needs real
  // state (not a ref) so the swap from Link to a plain div actually
  // re-renders before the click fires.
  const [suppressLink, setSuppressLink] = useState(false);

  function handleDragStart() {
    setSuppressLink(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    // Cleared a beat after the drop, not immediately — "click" fires as
    // its own event right after "mouseup" is fully handled, so the div
    // needs to still be in place (not yet reverted to a Link) at that
    // point.
    window.setTimeout(() => setSuppressLink(false), 300);
    if (!over || active.id === over.id) return;
    const oldIndex = books.findIndex((b) => b.id === active.id);
    const newIndex = books.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(books, oldIndex, newIndex);
    const updated = { ...reviews };
    reordered.forEach((book, index) => {
      updated[book.id] = { ...updated[book.id], order: index };
    });
    persist(updated);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const haystack = [b.title, b.author, b.summary, b.review, b.quotes, b.tropes].join(" ").toLowerCase();
      return haystack.includes(q) || matchesDateQuery(new Date(b.createdAt), q);
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
      ) : query.trim() ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((book) => (
            <BookReviewCard
              key={book.id}
              book={book}
              onDeleteRequest={() => setPendingDelete(book)}
              onStatusChange={(status) => handleStatusChange(book.id, status)}
            />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((b) => b.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((book) => (
                <SortableBookReviewCard
                  key={book.id}
                  book={book}
                  onDeleteRequest={() => setPendingDelete(book)}
                  onStatusChange={(status) => handleStatusChange(book.id, status)}
                  suppressLink={suppressLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
