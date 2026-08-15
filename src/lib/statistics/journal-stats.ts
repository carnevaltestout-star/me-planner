import { loadEntries } from "@/lib/journal/journal-storage";
import { bucketByRange, currentStreak, daysInRange, isWithinRange, longestStreak } from "./stat-dates";
import type { SeriesPoint, TimeRange } from "./stat-types";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface JournalStats {
  hasAnyData: boolean;
  totalInRange: number;
  currentStreakDays: number;
  longestStreakDays: number;
  avgPerWeek: number;
  mostActiveDay: string | null;
  series: SeriesPoint[];
}

export function computeJournalStats(range: TimeRange, today: Date): JournalStats {
  const entries = loadEntries();
  const allKeys = Object.keys(entries);
  if (allKeys.length === 0) {
    return {
      hasAnyData: false,
      totalInRange: 0,
      currentStreakDays: 0,
      longestStreakDays: 0,
      avgPerWeek: 0,
      mostActiveDay: null,
      series: [],
    };
  }

  const allDates = allKeys.map((k) => new Date(`${k}T00:00:00`));
  const inRange = allDates.filter((d) => isWithinRange(d, range, today));

  const dayTally = new Map<string, number>();
  inRange.forEach((d) => {
    const name = WEEKDAY_NAMES[d.getDay()];
    dayTally.set(name, (dayTally.get(name) ?? 0) + 1);
  });
  let mostActiveDay: string | null = null;
  let mostActiveCount = 0;
  dayTally.forEach((count, name) => {
    if (count > mostActiveCount) {
      mostActiveCount = count;
      mostActiveDay = name;
    }
  });

  const spanDays =
    range === "all"
      ? Math.max(1, Math.round((today.getTime() - Math.min(...allDates.map((d) => d.getTime()))) / 86400000) + 1)
      : daysInRange(range, today);
  const avgPerWeek = Math.round((inRange.length / (spanDays / 7)) * 10) / 10;

  return {
    hasAnyData: true,
    totalInRange: inRange.length,
    currentStreakDays: currentStreak(new Set(allKeys), today),
    longestStreakDays: longestStreak(new Set(allKeys)),
    avgPerWeek,
    mostActiveDay,
    series: bucketByRange(inRange, range, today),
  };
}
