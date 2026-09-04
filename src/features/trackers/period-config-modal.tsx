import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";
import { dateKey } from "@/lib/trackers/tracker-dates";
import { DEFAULT_CYCLE_LENGTH_DAYS, DEFAULT_PERIOD_LENGTH_DAYS, TRACKER_COLORS, type Tracker } from "@/lib/trackers/tracker-types";
import TrackerIcon from "./tracker-icon";

interface PeriodConfigModalProps {
  onClose: () => void;
  onCreate: (tracker: Tracker) => void;
}

const DEFAULT_PERIOD_COLOR = "#c0392b";

function toDateInput(d: Date): string {
  return dateKey(d);
}

export default function PeriodConfigModal({ onClose, onCreate }: PeriodConfigModalProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onClose);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH_DAYS);
  const [cycleLength, setCycleLength] = useState(DEFAULT_CYCLE_LENGTH_DAYS);
  const [startDate, setStartDate] = useState(() => toDateInput(new Date()));
  const [color, setColor] = useState(DEFAULT_PERIOD_COLOR);

  const nextPeriodPreview = (() => {
    const start = new Date(`${startDate}T00:00:00`);
    start.setDate(start.getDate() + cycleLength);
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  })();

  function handleSave() {
    onCreate({
      id: crypto.randomUUID(),
      name: "Period",
      color,
      icon: "drop",
      kind: "period",
      createdAt: dateKey(new Date()),
      periodLengthDays: Math.max(1, periodLength),
      cycleLengthDays: Math.max(1, cycleLength),
      lastPeriodStart: startDate,
    });
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[340px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
      >
        <div className="flex items-center gap-2">
          <TrackerIcon icon="drop" className="h-5 w-5" style={{ color }} />
          <h2 className="m-0 text-base text-ink">Period tracker</h2>
        </div>
        <p className="m-0 text-xs text-ink-muted">
          This is a first pass — a simple, repeating estimate. It's structured so it can grow into
          real cycle tracking later.
        </p>

        <label className="flex flex-col gap-1.5 text-xs text-ink-muted">
          <span>Last period started</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
        </label>

        <div className="flex gap-2.5">
          <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
            <span>Estimated length (days)</span>
            <input
              type="number"
              min={1}
              max={14}
              value={periodLength}
              onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
            <span>Cycle length (days)</span>
            <input
              type="number"
              min={14}
              max={60}
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
            />
          </label>
        </div>

        <p className="m-0 text-xs text-ink-muted">
          Next period estimated around <strong className="text-ink">{nextPeriodPreview}</strong> (~
          {Math.round(cycleLength / 7)} weeks from the start date).
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Color</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {TRACKER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={c === color}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`h-[26px] w-[26px] rounded-full border-2 ${c === color ? "border-ink" : "border-transparent"}`}
              />
            ))}
            <span className="relative h-[26px] w-[26px]">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Custom color"
                title="Custom color"
                className="h-[26px] w-[26px] cursor-pointer rounded-full border border-border bg-transparent p-0"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference"
              >
                +
              </span>
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
