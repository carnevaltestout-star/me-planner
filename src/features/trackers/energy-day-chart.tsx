import { useEffect, useRef, useState } from "react";
import {
  ENERGY_HIGH_COLOR,
  ENERGY_LOW_COLOR,
  ENERGY_TIME_MAX,
  ENERGY_TIME_MIN,
  ENERGY_VALUE_MAX,
  ENERGY_VALUE_MIN,
  energyColor,
  type EnergyPoint,
} from "@/lib/trackers/energy-types";

interface EnergyDayChartProps {
  points: EnergyPoint[];
  onChange: (points: EnergyPoint[]) => void;
  locked?: boolean;
}

// Taller on mobile — an actual coordinate-space change (not just a CSS
// stretch) so dots stay perfectly round and there's real vertical
// resolution for touch placement, since this chart is the thing you're
// meant to interact with on a phone, not just look at.
const HEIGHT_DESKTOP = 150;
const HEIGHT_MOBILE = 440;
const PAD_X = 10;
const PAD_Y = 10;
const Y_GUTTER = 16; // width reserved for the H/M/L column
const X_GUTTER = 16; // height reserved for the hour-label row

const X_TICKS: { time: number; label: string }[] = [
  { time: 8, label: "8" },
  { time: 12, label: "12" },
  { time: 16, label: "16" },
  { time: 20, label: "20" },
  { time: 24, label: "24" },
];

// A real drag (adjusting an existing dot's value) has to move the pointer
// at least this many pixels before it stops counting as "just a tap" —
// below that, releasing removes the dot instead of nudging it.
const DRAG_THRESHOLD = 4;

function timeToX(time: number, width: number) {
  const plotW = width - PAD_X * 2;
  return PAD_X + ((time - ENERGY_TIME_MIN) / (ENERGY_TIME_MAX - ENERGY_TIME_MIN)) * plotW;
}
function xToTime(x: number, width: number) {
  const plotW = width - PAD_X * 2;
  const t = ENERGY_TIME_MIN + ((x - PAD_X) / plotW) * (ENERGY_TIME_MAX - ENERGY_TIME_MIN);
  return Math.max(ENERGY_TIME_MIN, Math.min(ENERGY_TIME_MAX, t));
}
function valueToY(value: number, height: number) {
  const plotH = height - PAD_Y * 2;
  return PAD_Y + (1 - value / ENERGY_VALUE_MAX) * plotH;
}
function yToValue(y: number, height: number) {
  const plotH = height - PAD_Y * 2;
  const v = (1 - (y - PAD_Y) / plotH) * ENERGY_VALUE_MAX;
  return Math.max(ENERGY_VALUE_MIN, Math.min(ENERGY_VALUE_MAX, v));
}

interface DragState {
  time: number;
  startX: number;
  startY: number;
  moved: boolean;
}

// Hand-rolled SVG rather than recharts — placing/editing a point at an
// arbitrary click position needs direct pixel-to-value math that recharts'
// data-driven API doesn't offer cleanly. The viewBox width is measured from
// the actual rendered box (not a fixed constant) so it always matches 1:1
// with real CSS pixels — otherwise the browser's default
// preserveAspectRatio scales-to-fit and letterboxes the chart inside its
// own box, which is what made the H/M/L labels (a separate, full-height
// flex column) end up outside the visibly-shrunk chart.
export default function EnergyDayChart({ points, onChange, locked }: EnergyDayChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [width, setWidth] = useState(580);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = isMobile ? HEIGHT_MOBILE : HEIGHT_DESKTOP;
  const sorted = [...points].sort((a, b) => a.time - b.time);

  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  // Empty-space click — always adds. Clicks that land on an existing dot
  // never reach here: the dot's own onClick stops propagation first.
  function handleChartClick(e: React.MouseEvent<SVGSVGElement>) {
    if (locked) return;
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    const next = [...sorted, { time: xToTime(x, width), value: yToValue(y, height) }].sort((a, b) => a.time - b.time);
    onChange(next);
  }

  function handleDotPointerDown(time: number, e: React.PointerEvent<SVGCircleElement>) {
    if (locked) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ time, startX: e.clientX, startY: e.clientY, moved: false });
  }

  // A tap (no real movement) removes the dot; an actual drag adjusts its
  // value instead — same gesture, distinguished only by distance moved.
  function handleDotPointerUp(e: React.PointerEvent<SVGCircleElement>) {
    e.stopPropagation();
    if (!drag) return;
    if (!drag.moved) {
      onChange(sorted.filter((p) => p.time !== drag.time));
    }
    setDrag(null);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    setHoverTime(xToTime(x, width));
    if (drag) {
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      const moved = drag.moved || dist > DRAG_THRESHOLD;
      if (moved) {
        onChange(sorted.map((p) => (p.time === drag.time ? { ...p, value: yToValue(y, height) } : p)));
      }
      if (moved !== drag.moved) setDrag({ ...drag, moved });
    }
  }

  function handlePointerUp() {
    // Only reached if the pointer never touched a dot (see handleDotPointerUp)
    // — e.g. pointer capture was on a dot but released elsewhere is still
    // routed there, so this is just a safety-net reset.
    setDrag(null);
  }

  const nearestHover =
    hoverTime !== null
      ? sorted.reduce<EnergyPoint | null>((closest, p) => {
          if (Math.abs(p.time - hoverTime) > 0.5) return closest;
          if (!closest || Math.abs(p.time - hoverTime) < Math.abs(closest.time - hoverTime)) return p;
          return closest;
        }, null)
      : null;

  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-[0.65rem] text-ink-muted">Y: Energy lvl.</p>
      <div className="flex gap-1.5">
        {/* Y-axis labels — positioned at the exact same pixel Y as each
            gridline (valueToY), instead of flex-distributed across a
            column that isn't guaranteed to line up with the chart's own
            internal padding. */}
        <div className="relative flex-shrink-0" style={{ width: Y_GUTTER, height }}>
          {[100, 50, 0].map((v) => (
            <span
              key={v}
              title={v === 100 ? "High" : v === 50 ? "Medium" : "Low"}
              className="absolute left-0 -translate-y-1/2 text-[0.65rem] font-semibold text-ink-muted"
              style={{ top: valueToY(v, height) }}
            >
              {v === 100 ? "H" : v === 50 ? "M" : "L"}
            </span>
          ))}
        </div>
        <div ref={chartAreaRef} className="relative min-w-0 flex-1" style={{ height: height + X_GUTTER }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className={locked ? "" : "cursor-crosshair"}
            style={{ width: "100%", height }}
            onClick={handleChartClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => setHoverTime(null)}
          >
            <defs>
              <linearGradient id="energyDayAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ENERGY_HIGH_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ENERGY_LOW_COLOR} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            {[0, 50, 100].map((v) => (
              <line
                key={v}
                x1={PAD_X}
                x2={width - PAD_X}
                y1={valueToY(v, height)}
                y2={valueToY(v, height)}
                stroke="var(--color-ink-muted)"
                strokeWidth={1}
                strokeDasharray={v === 50 ? "3 3" : undefined}
              />
            ))}
            {X_TICKS.map(({ time }) => (
              <line
                key={time}
                x1={timeToX(time, width)}
                x2={timeToX(time, width)}
                y1={PAD_Y}
                y2={height - PAD_Y}
                stroke="var(--color-ink-muted)"
                strokeWidth={1}
                opacity={0.4}
              />
            ))}
            {hoverTime !== null && !locked && (
              <line
                x1={timeToX(hoverTime, width)}
                x2={timeToX(hoverTime, width)}
                y1={PAD_Y}
                y2={height - PAD_Y}
                stroke="var(--color-accent)"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {sorted.length > 1 && (
              <>
                <polygon
                  points={[
                    `${timeToX(sorted[0].time, width)},${valueToY(ENERGY_VALUE_MIN, height)}`,
                    ...sorted.map((p) => `${timeToX(p.time, width)},${valueToY(p.value, height)}`),
                    `${timeToX(sorted[sorted.length - 1].time, width)},${valueToY(ENERGY_VALUE_MIN, height)}`,
                  ].join(" ")}
                  fill="url(#energyDayAreaGradient)"
                  stroke="none"
                />
                <polyline
                  points={sorted.map((p) => `${timeToX(p.time, width)},${valueToY(p.value, height)}`).join(" ")}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                />
              </>
            )}
            {sorted.map((p) => {
              const isHover = nearestHover?.time === p.time;
              return (
                <g key={p.time}>
                  {/* Larger invisible hit target — the visible dot stays
                      small, but tapping/dragging it shouldn't need
                      pixel-perfect precision. */}
                  <circle
                    cx={timeToX(p.time, width)}
                    cy={valueToY(p.value, height)}
                    r={14}
                    fill="transparent"
                    onPointerDown={(e) => handleDotPointerDown(p.time, e)}
                    onPointerUp={handleDotPointerUp}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: locked ? "default" : "grab" }}
                  />
                  <circle
                    cx={timeToX(p.time, width)}
                    cy={valueToY(p.value, height)}
                    r={isHover ? 7 : 5}
                    fill={energyColor(p.value)}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </svg>
          {/* X-axis hour labels — positioned at the exact same pixel X as
              each tick line, sitting right along the axis instead of a
              separate row nudged over with a guessed padding value. */}
          {X_TICKS.map(({ time, label }) => (
            <span
              key={time}
              className="absolute top-0 text-[0.62rem] text-ink-muted"
              style={{
                left: timeToX(time, width),
                top: height + 2,
                transform: time === ENERGY_TIME_MIN ? "translateX(0%)" : time === ENERGY_TIME_MAX ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="m-0 text-right text-[0.65rem] text-ink-muted">X: Time of day</p>
      {sorted.length === 0 && (
        <p className="m-0 text-center text-xs text-ink-muted">
          {locked ? "Nothing recorded." : "Click the chart to log your energy at a time."}
        </p>
      )}
    </div>
  );
}
