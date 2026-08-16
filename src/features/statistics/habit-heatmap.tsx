import { Fragment } from "react";
import type { MultiSeriesPoint, SeriesMeta } from "@/lib/statistics/stat-types";

interface HabitHeatmapProps {
  points: MultiSeriesPoint[];
  series: SeriesMeta[];
}

// One row per habit, one column per time bucket — same "grid of colored
// cells" language as the Trackers tab's own calendar, just condensed to a
// completion-rate intensity per cell instead of a single done/not-done
// mark. Far more scannable than overlapping lines or grouped bars once
// there's more than a couple of habits or a month's worth of buckets.
export default function HabitHeatmap({ points, series }: HabitHeatmapProps) {
  const showEvery = points.length <= 12 ? 1 : Math.ceil(points.length / 8);

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid w-full gap-[3px]"
        style={{ gridTemplateColumns: `minmax(58px,auto) repeat(${points.length}, minmax(9px, 1fr))` }}
      >
        <div />
        {points.map((p, i) => (
          <div key={`h-${i}`} className="text-center text-[0.55rem] leading-tight text-ink-muted">
            {i % showEvery === 0 || i === points.length - 1 ? p.label : ""}
          </div>
        ))}

        {series.map((s) => (
          <Fragment key={s.key}>
            <div className="flex items-center truncate pr-1.5 text-[0.68rem] font-medium" style={{ color: s.color }}>
              {s.name}
            </div>
            {points.map((p, i) => {
              const raw = p[s.key];
              const value = typeof raw === "number" ? raw : null;
              return (
                <div
                  key={`${s.key}-${i}`}
                  title={`${p.label} — ${s.name}: ${value === null ? "no data" : `${value}%`}`}
                  className="aspect-square rounded-[2px]"
                  style={{
                    background:
                      value === null ? "transparent" : `color-mix(in srgb, ${s.color} ${Math.max(value, 8)}%, var(--color-surface))`,
                    border: value === null ? "1px dashed var(--color-border)" : "none",
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
