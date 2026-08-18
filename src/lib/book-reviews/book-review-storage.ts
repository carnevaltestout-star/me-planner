import { emptyBookReview, type BookReview } from "./book-review-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features —
// swapping this for the real DB later shouldn't need to touch any component,
// just this file.
export const BOOK_REVIEWS_STORAGE_KEY = "me-planner:mock-book-reviews";

function seedReviews(): Record<string, BookReview> {
  // Listed (and given their `order`) highest-rated to lowest, ties broken by
  // reading date — matches the shelf's default sort until a card gets
  // manually dragged.
  const seed: BookReview[] = [
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
      updatedAt: "2026-05-29T09:00:00.000Z",
      order: 0,
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
      updatedAt: "2026-06-15T09:00:00.000Z",
      order: 1,
    },
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
      updatedAt: "2026-04-12T09:00:00.000Z",
      order: 2,
    },
    {
      ...emptyBookReview("seed-london"),
      title: "The Road",
      author: "Jack London",
      genre: "Memoir / Travel",
      startDate: "2026-07-20",
      endDate: "2026-07-29",
      format: "Physical",
      rating: 4,
      summary: "London's own account of his teenage years riding the rails as a hobo across turn-of-the-century America — begging, dodging railroad police, and talking his way out of trouble.",
      quotes: "\"I became a tramp — well, because of the life that was in me, of the wanderlust in my blood that would not let me rest.\"",
      review: "Fast, funny, and occasionally brutal. The chapters on talking his way past the railroad bulls and in and out of jail are the highlight — equal parts adventure story and social document.",
      tropes: "The trickster hobo, the open road as freedom, prison as forge",
      createdAt: "2026-07-30T09:00:00.000Z",
      updatedAt: "2026-07-30T09:00:00.000Z",
      order: 3,
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
      updatedAt: "2026-07-01T09:00:00.000Z",
      order: 4,
    },
  ];
  return Object.fromEntries(seed.map((b) => [b.id, b]));
}

function normalize(id: string, raw: Partial<BookReview>): BookReview {
  const base = emptyBookReview(id);
  // Records saved before updatedAt existed fall back to their own
  // createdAt, not "now" — otherwise every pre-existing review would look
  // like it was just edited the moment this field was introduced.
  return { ...base, ...raw, id, updatedAt: raw.updatedAt ?? raw.createdAt ?? base.createdAt };
}

export function loadBookReviews(): Record<string, BookReview> {
  try {
    const raw = window.localStorage.getItem(BOOK_REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const entries = Object.entries(parsed) as [string, Partial<BookReview>][];
        const normalized = Object.fromEntries(entries.map(([k, v]) => [k, normalize(k, v)]));
        // Records saved before drag-and-drop ordering existed don't have a
        // real `order` yet — file those in rating-desc order (ties by
        // reading date) so they start highest-rated-first instead of a
        // jumbled legacy order, while anything already dragged keeps its
        // manual position untouched.
        const missingOrder = entries.filter(([, v]) => typeof v.order !== "number").map(([k]) => k);
        if (missingOrder.length > 0) {
          const ranked = [...missingOrder].sort((a, b) => {
            const ratingDiff = normalized[b].rating - normalized[a].rating;
            return ratingDiff !== 0 ? ratingDiff : normalized[a].createdAt.localeCompare(normalized[b].createdAt);
          });
          ranked.forEach((rid, index) => {
            normalized[rid] = { ...normalized[rid], order: index };
          });
        }
        return normalized;
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
