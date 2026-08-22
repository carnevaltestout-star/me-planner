import { loadEnergyState } from "@/lib/trackers/energy-storage";
import { energyColor, energyLabel, ENERGY_TIME_MAX, ENERGY_TIME_MIN, type EnergyPoint } from "@/lib/trackers/energy-types";
import { isWithinRange } from "./stat-dates";
import type { DistributionSlice, SeriesPoint, TimeRange } from "./stat-types";

export function hasAnyEnergyEntries(): boolean {
  return Object.values(loadEnergyState()).some((points) => points.length > 0);
}

function pointsWithinRange(range: TimeRange, today: Date): EnergyPoint[] {
  const state = loadEnergyState();
  const points: EnergyPoint[] = [];
  Object.entries(state).forEach(([key, dayPoints]) => {
    if (isWithinRange(new Date(`${key}T00:00:00`), range, today)) points.push(...dayPoints);
  });
  return points;
}

// Hours >24 (the post-midnight tail, up to 3am) wrap back to 1-3 for
// display, matching the day chart's own axis.
function hourLabel(hour: number): string {
  return String(hour > 24 ? hour - 24 : hour);
}

const HOUR_BUCKET_COUNT = ENERGY_TIME_MAX - ENERGY_TIME_MIN;

function bucketIndexFor(time: number): number {
  return Math.min(HOUR_BUCKET_COUNT - 1, Math.max(0, Math.floor(time - ENERGY_TIME_MIN)));
}

// Line mode: the true average level logged at each hour, across every
// logged point in the range — "the average during the day as a line from
// all collected data."
export function computeEnergyHourAverages(range: TimeRange, today: Date): SeriesPoint[] {
  const buckets = Array.from({ length: HOUR_BUCKET_COUNT }, () => ({ sum: 0, count: 0 }));
  pointsWithinRange(range, today).forEach((p) => {
    const b = buckets[bucketIndexFor(p.time)];
    b.sum += p.value;
    b.count += 1;
  });
  return buckets.map((b, i) => ({
    label: hourLabel(ENERGY_TIME_MIN + i),
    value: b.count > 0 ? Math.round(b.sum / b.count) : 0,
  }));
}

const LEVEL_HEIGHT: Record<"Low" | "Medium" | "High", number> = { Low: 15, Medium: 50, High: 85 };
const LEVELS = ["Low", "Medium", "High"] as const;

// Bar mode: whichever level (Low/Medium/High) was logged most often at each
// hour, across the whole range — "if on most days I checked high energy at
// 16, display a bar up to the height of H."
export function computeEnergyHourMode(range: TimeRange, today: Date): SeriesPoint[] {
  const buckets = Array.from({ length: HOUR_BUCKET_COUNT }, () => ({ Low: 0, Medium: 0, High: 0 }));
  pointsWithinRange(range, today).forEach((p) => {
    buckets[bucketIndexFor(p.time)][energyLabel(p.value) as (typeof LEVELS)[number]] += 1;
  });
  return buckets.map((counts, i) => {
    const total = counts.Low + counts.Medium + counts.High;
    const label = hourLabel(ENERGY_TIME_MIN + i);
    if (total === 0) return { label, value: 0 };
    const mode = LEVELS.reduce((a, b) => (counts[b] > counts[a] ? b : a));
    return { label, value: LEVEL_HEIGHT[mode] };
  });
}

// Pie/histogram mode: what share of every logged point (in range) was Low
// vs Medium vs High.
export function computeEnergyDistribution(range: TimeRange, today: Date): DistributionSlice[] | null {
  const points = pointsWithinRange(range, today);
  if (points.length === 0) return null;
  const tally: Record<(typeof LEVELS)[number], number> = { Low: 0, Medium: 0, High: 0 };
  points.forEach((p) => {
    tally[energyLabel(p.value) as (typeof LEVELS)[number]] += 1;
  });
  return LEVELS.map((key) => ({
    key,
    label: key,
    value: tally[key],
    percent: Math.round((tally[key] / points.length) * 100),
    color: energyColor(LEVEL_HEIGHT[key]),
  }));
}

export interface EnergySummary {
  loggedPoints: number;
  averageLevel: number | null;
}

export function computeEnergySummary(range: TimeRange, today: Date): EnergySummary {
  const points = pointsWithinRange(range, today);
  if (points.length === 0) return { loggedPoints: 0, averageLevel: null };
  const sum = points.reduce((total, p) => total + p.value, 0);
  return { loggedPoints: points.length, averageLevel: Math.round(sum / points.length) };
}
