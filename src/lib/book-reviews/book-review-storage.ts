import { emptyBookReview, type BookReview } from "./book-review-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features —
// swapping this for the real DB later shouldn't need to touch any component,
// just this file.
export const BOOK_REVIEWS_STORAGE_KEY = "me-planner:mock-book-reviews";

function seedReviews(): Record<string, BookReview> {
  const seed: BookReview[] = [
    {
      ...emptyBookReview("seed-freud"),
      title: "The Interpretation of Dreams",
      author: "Sigmund Freud",
      genre: "Psychology",
      startDate: "2026-03-02",
      endDate: "2026-04-11",
      format: "Physical",
      rating: 4,
      summary: "Freud's foundational case for dreams as disguised wish-fulfillment, built up through his own dreams and those of his patients.",
      quotes: "\"The interpretation of dreams is the royal road to a knowledge of the unconscious.\"",
      review: "Dense and repetitive in places, but the core argument still holds up as the opening move of an entire field. Worth reading slowly.",
      tropes: "Unreliable narrator (himself), the symbolic object, the talking cure",
      createdAt: "2026-04-12T09:00:00.000Z",
    },
    {
      ...emptyBookReview("seed-jung"),
      title: "Man and His Symbols",
      author: "Carl Jung",
      genre: "Psychology",
      startDate: "2026-05-06",
      endDate: "2026-05-28",
      format: "Physical",
      rating: 5,
      summary: "Jung's last work, written for a general audience — archetypes, the collective unconscious, and symbols across dreams, art, and myth.",
      quotes: "\"Until you make the unconscious conscious, it will direct your life and you will call it fate.\"",
      review: "The most accessible entry point into Jung. The illustrated case studies from his collaborators make the abstract ideas click.",
      tropes: "The shadow, the wise old man, the hero's descent",
      createdAt: "2026-05-29T09:00:00.000Z",
    },
    {
      ...emptyBookReview("seed-frankl"),
      title: "Man's Search for Meaning",
      author: "Viktor Frankl",
      genre: "Memoir / Psychology",
      startDate: "2026-06-10",
      endDate: "2026-06-14",
      format: "Ebook",
      rating: 5,
      summary: "A psychiatrist's account of survival in Nazi concentration camps, and the logotherapy it led him to develop afterward.",
      quotes: "\"When we are no longer able to change a situation, we are challenged to change ourselves.\"",
      review: "Short, devastating, and somehow not bleak. Read it in a few sittings and thought about it for weeks after.",
      tropes: "Meaning as the antidote to suffering, the found purpose",
      createdAt: "2026-06-15T09:00:00.000Z",
    },
    {
      ...emptyBookReview("seed-adler"),
      title: "Understanding Human Nature",
      author: "Alfred Adler",
      genre: "Psychology",
      startDate: "2026-07-01",
      endDate: "",
      format: "Audiobook",
      rating: 3,
      summary: "Adler's individual psychology — inferiority feelings, social interest, and how early childhood shapes a person's style of life.",
      quotes: "\"It is easier to fight for one's principles than to live up to them.\"",
      review: "Still working through this one on audio during commutes. Solid so far, if a bit lecture-y in tone.",
      tropes: "The overcompensating underdog, birth order as destiny",
      createdAt: "2026-07-01T09:00:00.000Z",
    },
  ];
  return Object.fromEntries(seed.map((b) => [b.id, b]));
}

function normalize(id: string, raw: Partial<BookReview>): BookReview {
  return { ...emptyBookReview(id), ...raw, id };
}

export function loadBookReviews(): Record<string, BookReview> {
  try {
    const raw = window.localStorage.getItem(BOOK_REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, normalize(k, v as Partial<BookReview>)]));
      }
    }
  } catch {
    // fall through to seed data
  }
  return seedReviews();
}

export function saveBookReviews(reviews: Record<string, BookReview>) {
  window.localStorage.setItem(BOOK_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}
