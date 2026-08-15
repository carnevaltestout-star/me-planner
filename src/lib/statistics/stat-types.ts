export type TimeRange = "week" | "month" | "year" | "all";

export const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "all", label: "All Time" },
  { key: "year", label: "Year" },
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
];

export type ChartType = "bar" | "pie" | "histogram" | "line";

export const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "bar", label: "Bar chart" },
  { key: "line", label: "Line graph" },
  { key: "pie", label: "Pie chart" },
  { key: "histogram", label: "Histogram" },
];

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DistributionSlice {
  key: string;
  label: string;
  value: number;
  percent: number;
  color: string;
}

// Wide-format point for a multi-series chart — one numeric field per
// series key, alongside the shared bucket label.
export type MultiSeriesPoint = { label: string } & Record<string, number | string>;

export interface SeriesMeta {
  key: string;
  name: string;
  color: string;
}
