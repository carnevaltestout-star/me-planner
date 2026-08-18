export interface BookReview {
  id: string;
  title: string;
  author: string;
  genre: string;
  startDate: string;
  endDate: string;
  format: string;
  rating: number; // 0-5
  coverImage: string; // data URL of the uploaded cover, empty until set
  summary: string;
  quotes: string;
  review: string;
  tropes: string;
  createdAt: string;
  updatedAt: string;
  // Manual drag-and-drop position — seeded/migrated in rating-desc order so
  // the shelf starts highest-rated-first, then overridden per-card once the
  // user actually drags one.
  order: number;
}

export function emptyBookReview(id: string): BookReview {
  return {
    id,
    title: "",
    author: "",
    genre: "",
    startDate: "",
    endDate: "",
    format: "",
    rating: 0,
    coverImage: "",
    summary: "",
    quotes: "",
    review: "",
    tropes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    order: Date.now(),
  };
}

// Same "don't persist a blank record" reasoning as Journal's isEntryEmpty —
// a brand-new draft that never got a single field filled in shouldn't show
// up as an "Untitled" card in the list.
export function isBookReviewEmpty(b: BookReview): boolean {
  return (
    !b.title.trim() &&
    !b.author.trim() &&
    !b.genre.trim() &&
    !b.startDate &&
    !b.endDate &&
    !b.format.trim() &&
    b.rating === 0 &&
    !b.coverImage &&
    !b.summary.trim() &&
    !b.quotes.trim() &&
    !b.review.trim() &&
    !b.tropes.trim()
  );
}
