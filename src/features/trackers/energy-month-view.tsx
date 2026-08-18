import { daysInMonth, dateKey, isToday } from "@/lib/trackers/tracker-dates";
import {
  ENERGY_HIGH_COLOR,
  ENERGY_LOW_COLOR,
  ENERGY_VALUE_MAX,
  ENERGY_VALUE_MIN,
  energyColor,
  medianForDay,
  type EnergyState,
} from "@/lib/trackers/energy-types";

interface EnergyMonthViewProps {
  anchor: Date;
  state: EnergyState;
}

const HEIGHT = 150;
const PAD_X = 14;
const PAD_Y = 10;
const COL_W = 26; // per-day horizontal spacing — width grows with the day count

function valueToY(value: number) {
  return PAD_Y + (1 - value / ENERGY_VALUE_MAX) * (HEIGHT - PAD_Y * 2);
}

// Same line-chart language as the Day view (dots colored low->high,
// gradient area fill, Low/Medium/High axis) but one point per day instead
// of per logged time, and consecutive days with no data break the line
// into separate runs instead of bridging across the gap.
export default function EnergyMonthView({ anchor, state }: EnergyMonthViewProps) {
  const days = daysInMonth(anchor.getFullYear(), anchor.getMonth());
  const width = PAD_X * 2 + (days.length - 1) * COL_W;

  const dayValues = days.map((d) => medianForDay(state[dateKey(d)]));

  const runs: { x: number; y: number; value: number; day: number }[][] = [];
  let current: { x: number; y: number; value: number; day: number }[] = [];
  dayValues.forEach((value, i) => {
    if (value === null) {
      if (current.length) runs.push(current);
      current = [];
      return;
    }
    current.push({ x: PAD_X + i * COL_W, y: valueToY(value), value, day: i + 1 });
  });
  if (current.length) runs.push(current);

  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-[0.65rem] text-ink-muted">Y: Energy lvl.</p>
      <div className="flex gap-2">
        <div className="flex h-[150px] flex-shrink-0 flex-col justify-between py-0.5 text-[0.65rem] font-semibold text-ink-muted">
          <span title="High">H</span>
          <span title="Medium">M</span>
          <span title="Low">L</span>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${HEIGHT}`} style={{ width, height: HEIGHT }}>
            <defs>
              <linearGradient id="energyMonthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ENERGY_HIGH_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ENERGY_LOW_COLOR} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            {[0, 50, 100].map((v) => (
              <line
                key={v}
                x1={PAD_X}
                x2={width - PAD_X}
                y1={valueToY(v)}
                y2={valueToY(v)}
                stroke="var(--color-ink-muted)"
                strokeWidth={1}
                strokeDasharray={v === 50 ? "3 3" : undefined}
              />
            ))}
            {days.map((d, i) =>
              isToday(d) ? (
                <line
                  key={dateKey(d)}
                  x1={PAD_X + i * COL_W}
                  x2={PAD_X + i * COL_W}
                  y1={PAD_Y}
                  y2={HEIGHT - PAD_Y}
                  stroke="var(--color-accent)"
                  strokeWidth={1}
                  opacity={0.35}
                />
              ) : null,
            )}
            {runs.map((run, i) => (
              <g key={i}>
                {run.length > 1 && (
                  <>
                    <polygon
                      points={[
                        `${run[0].x},${valueToY(ENERGY_VALUE_MIN)}`,
                        ...run.map((p) => `${p.x},${p.y}`),
                        `${run[run.length - 1].x},${valueToY(ENERGY_VALUE_MIN)}`,
                      ].join(" ")}
                      fill="url(#energyMonthAreaGradient)"
                      stroke="none"
                    />
                    <polyline points={run.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
                  </>
                )}
                {run.map((p) => (
                  <circle key={p.day} cx={p.x} cy={p.y} r={4.5} fill={energyColor(p.value)} stroke="#ffffff" strokeWidth={1.2} />
                ))}
              </g>
            ))}
          </svg>
          <div className="flex text-[0.55rem] text-ink-muted" style={{ width }}>
            {days.map((d) => (
              <span key={dateKey(d)} className={`text-center ${isToday(d) ? "font-bold text-accent" : ""}`} style={{ width: COL_W }}>
                {String(d.getDate()).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="m-0 text-center text-xs font-semibold text-ink-muted">
        {anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </p>
      {runs.length === 0 && <p className="m-0 text-center text-xs text-ink-muted">No energy logged this month yet.</p>}
    </div>
  );
}
