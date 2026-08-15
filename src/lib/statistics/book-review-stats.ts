import { loadBookReviews } from "@/lib/book-reviews/book-review-storage";
import { bucketByRange, isWithinRange } from "./stat-dates";
import type { DistributionSlice, SeriesPoint, TimeRange } from "./stat-types";

const RATING_COLORS: Record<number, string> = {
  5: "#4f9d5c",
  4: "#8fb86a",
  3: "#d9b93d",
  2: "#d97a3d",
  1: "#c0392b",
};

export interface BookReviewStats {
  hasAnyData: boolean;
  addedInRange: number;
  editedInRange: number;
  avgRating: number | null;
  series: SeriesPoint[];
  ratingsDistribution: DistributionSlice[];
}

export function computeBookReviewStats(range: TimeRange, today: Date): BookReviewStats {
  const reviews = Object.values(loadBookReviews());
  if (reviews.length === 0) {
    return { hasAnyData: false, addedInRange: 0, editedInRange: 0, avgRating: null, series: [], ratingsDistribution: [] };
  }

  const added = reviews.filter((b) => isWithinRange(new Date(b.createdAt), range, today));
  // Only counts as "edited" if the last save landed on a different calendar
  // day than creation — same-day polishing of a brand-new entry isn't a
  // meaningfully separate edit event.
  const edited = reviews.filter((b) => {
    if (!isWithinRange(new Date(b.updatedAt), range, today)) return false;
    return new Date(b.updatedAt).toDateString() !== new Date(b.createdAt).toDateString();
  });

  const rated = added.length ? added.filter((b) => b.rating > 0) : reviews.filter((b) => b.rating > 0);
  const avgRating = rated.length ? Math.round((rated.reduce((sum, b) => sum + b.rating, 0) / rated.length) * 10) / 10 : null;

  const ratingTally = new Map<number, number>();
  reviews.forEach((b) => {
    if (b.rating > 0) ratingTally.set(b.rating, (ratingTally.get(b.rating) ?? 0) + 1);
  });
  const totalRated = [...ratingTally.values()].reduce((a, b) => a + b, 0);
  const ratingsDistribution: DistributionSlice[] = [5, 4, 3, 2, 1]
    .filter((stars) => ratingTally.has(stars))
    .map((stars) => {
      const value = ratingTally.get(stars) ?? 0;
      return {
        key: String(stars),
        label: `${stars} star${stars === 1 ? "" : "s"}`,
        value,
        percent: totalRated ? Math.round((value / totalRated) * 100) : 0,
        color: RATING_COLORS[stars],
      };
    });

  return {
    hasAnyData: true,
    addedInRange: added.length,
    editedInRange: edited.length,
    avgRating,
    series: bucketByRange(
      reviews.map((b) => new Date(b.createdAt)).filter((d) => isWithinRange(d, range, today)),
      range,
      today,
    ),
    ratingsDistribution,
  };
}
