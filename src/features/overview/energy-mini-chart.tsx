import {
  energyColor,
  ENERGY_HIGH_COLOR,
  ENERGY_LOW_COLOR,
  ENERGY_TIME_MAX,
  ENERGY_TIME_MIN,
  ENERGY_VALUE_MAX,
  type EnergyPoint,
} from "@/lib/trackers/energy-types";

interface EnergyMiniChartProps {
  points: EnergyPoint[];
}

const WIDTH = 280;
const HEIGHT = 56;
const PAD_Y = 5;
// Labels past midnight wrap back to 1-3 ("3am the next day") while the
// underlying hour stays on the continuous 5-27 scale used for the x-scale.
const HOUR_TICKS: { h: number; label: string }[] = [
  { h: 5, label: "5" },
  { h: 8, label: "8" },
  { h: 12, label: "12" },
  { h: 16, label: "16" },
  { h: 20, label: "20" },
  { h: 24, label: "24" },
  { h: 27, label: "3" },
];

// A compact, read-only rendering of the whole day's line, with the same
// hour-tick labels as the real chart so it reads as the complete picture
// rather than a bare squiggle — editing still happens via the quick
// Low/Medium/High buttons below it, so this doesn't need EnergyDayChart's
// full click/drag interaction (which is also sized for its own standalone
// full-width card, not a small fixed-height tile).
export default function EnergyMiniChart({ points }: EnergyMiniChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center text-[0.68rem] italic text-ink-muted">
        No entries yet today.
      </div>
    );
  }

  const sorted = [...points].sort((a, b) => a.time - b.time);
  const x = (time: number) => ((time - ENERGY_TIME_MIN) / (ENERGY_TIME_MAX - ENERGY_TIME_MIN)) * WIDTH;
  const y = (value: number) => PAD_Y + (1 - value / ENERGY_VALUE_MAX) * (HEIGHT - PAD_Y * 2);

  const linePoints = sorted.map((p) => `${x(p.time)},${y(p.value)}`).join(" ");
  const areaPoints = `${x(sorted[0].time)},${HEIGHT} ${linePoints} ${x(sorted[sorted.length - 1].time)},${HEIGHT}`;

  return (
    <div className="min-w-0 flex-1">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="overview-energy-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ENERGY_HIGH_COLOR} stopOpacity="0.35" />
            <stop offset="100%" stopColor={ENERGY_LOW_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#overview-energy-gradient)" />
        <polyline points={linePoints} fill="none" stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        {sorted.map((p, i) => (
          <circle key={i} cx={x(p.time)} cy={y(p.value)} r={2.4} fill={energyColor(p.value)} />
        ))}
      </svg>
      <div className="flex justify-between px-0.5 text-[0.55rem] text-ink-muted">
        {HOUR_TICKS.map(({ h, label }) => (
          <span key={h}>{label}</span>
        ))}
      </div>
    </div>
  );
}
