import { loadEntries } from "@/lib/journal/journal-storage";
import { loadBookReviews } from "@/lib/book-reviews/book-review-storage";
import { loadTrackersState } from "@/lib/trackers/tracker-storage";
import { bucketByRange, currentStreak, dateKey, isWithinRange } from "./stat-dates";
import type { SeriesPoint, TimeRange } from "./stat-types";

export interface ActivitySection {
  label: string;
  count: number;
}

export interface ActivityStats {
  hasAnyData: boolean;
  totalActivities: number;
  activeDays: number;
  mostActiveSection: string | null;
  currentStreakDays: number;
  series: SeriesPoint[];
}

// Journal + Trackers + Book Reviews all carry accurate "this happened on
// this real day" signals (a journal dateKey, a tracker entry date, a review
// created/edited timestamp). Planner is deliberately excluded — an event's
// dateKey is when it's *scheduled*, not when the person did something in
// the app, so folding it in here would misrepresent activity.
export function computeActivityStats(range: TimeRange, today: Date): ActivityStats {
  const journalDates = Object.keys(loadEntries()).map((k) => new Date(`${k}T00:00:00`));

  const trackerState = loadTrackersState();
  const trackerDates: Date[] = [];
  Object.values(trackerState.entries).forEach((entries) => {
    Object.keys(entries).forEach((key) => trackerDates.push(new Date(`${key}T00:00:00`)));
  });

  const reviews = Object.values(loadBookReviews());
  const bookDates: Date[] = [];
  reviews.forEach((b) => {
    bookDates.push(new Date(b.createdAt));
    if (new Date(b.updatedAt).toDateString() !== new Date(b.createdAt).toDateString()) {
      bookDates.push(new Date(b.updatedAt));
    }
  });

  const allDates = [...journalDates, ...trackerDates, ...bookDates];
  if (allDates.length === 0) {
    return { hasAnyData: false, totalActivities: 0, activeDays: 0, mostActiveSection: null, currentStreakDays: 0, series: [] };
  }

  const inRange = allDates.filter((d) => isWithinRange(d, range, today));
  const journalInRange = journalDates.filter((d) => isWithinRange(d, range, today)).length;
  const trackerInRange = trackerDates.filter((d) => isWithinRange(d, range, today)).length;
  const bookInRange = bookDates.filter((d) => isWithinRange(d, range, today)).length;

  const sections: ActivitySection[] = [
    { label: "Journal", count: journalInRange },
    { label: "Energy & Habit Tracker", count: trackerInRange },
    { label: "Book Reviews", count: bookInRange },
  ];
  const topSection = sections.reduce((max, s) => (s.count > max.count ? s : max), sections[0]);

  const activeDayKeys = new Set(allDates.map((d) => dateKey(d)));
  const activeDaysInRange = new Set(inRange.map((d) => dateKey(d))).size;

  return {
    hasAnyData: true,
    totalActivities: inRange.length,
    activeDays: activeDaysInRange,
    mostActiveSection: topSection.count > 0 ? topSection.label : null,
    currentStreakDays: currentStreak(activeDayKeys, today),
    series: bucketByRange(inRange, range, today),
  };
}
