import { useRef, useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";
import { fromTimeInput, toTimeInput } from "@/lib/planner/planner-dates";
import { DEFAULT_TINT_PERCENT, EVENT_COLORS, PRIORITY_TINT_PERCENT, type EventPriority } from "@/lib/planner/planner-types";
import type { EventPreset } from "@/lib/planner/preset-types";

const PRIORITIES: { value: EventPriority; label: string }[] = [
  { value: 1, label: "1 · Highest" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4 · Lowest" },
];

interface PresetEditDialogProps {
  preset: EventPreset;
  onSave: (preset: EventPreset) => void;
  onClose: () => void;
}

// Same title/color/priority fields (including the custom color picker) as
// EventModal — minus notes/repeat, since a preset isn't a real calendar
// event yet. Start/end are optional: left blank, a dropped/quick-added
// instance defaults to a 1-hour block starting wherever it lands; filled
// in, only their *difference* carries over as the default duration (see
// preset-types.ts) — dropping still takes its start time from the grid
// slot, not from these.
export default function PresetEditDialog({ preset, onSave, onClose }: PresetEditDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onClose);
  const [title, setTitle] = useState(preset.title);
  const [color, setColor] = useState(preset.color || EVENT_COLORS[0]);
  const [start, setStart] = useState(preset.start !== undefined ? toTimeInput(preset.start) : "");
  const [end, setEnd] = useState(preset.end !== undefined ? toTimeInput(preset.end) : "");
  const [priority, setPriority] = useState<EventPriority | undefined>(preset.priority);
  const [error, setError] = useState("");
  const customColorInputRef = useRef<HTMLInputElement>(null);

  function handleStartChange(value: string) {
    setStart(value);
    if (value && end && fromTimeInput(value) >= fromTimeInput(end)) {
      setEnd(toTimeInput(Math.min(23.75, fromTimeInput(value) + 0.25)));
    }
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Give it a title.");
      return;
    }
    if (Boolean(start) !== Boolean(end)) {
      setError("Set both a start and an end, or leave both blank.");
      return;
    }
    if (!start && !end) {
      onSave({ ...preset, title: trimmed, color, start: undefined, end: undefined, priority });
      return;
    }
    const startHour = fromTimeInput(start);
    const endHour = fromTimeInput(end);
    if (!(endHour > startHour)) {
      setError("End has to be after start.");
      return;
    }
    onSave({ ...preset, title: trimmed, color, start: startHour, end: endHour, priority });
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="flex w-full max-w-[340px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme">
        <h2 className="m-0 text-base text-ink">Event preset</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Title</span>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Gym, Therapy, Date night…"
            className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Duration (optional — defaults to 1 hour)</span>
          <div className="flex gap-2.5">
            <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
              <span>Starts</span>
              <input
                type="time"
                step={900}
                value={start}
                onChange={(e) => handleStartChange(e.target.value)}
                className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
              <span>Ends</span>
              <input
                type="time"
                step={900}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
            </label>
          </div>
          <p className="m-0 text-[0.7rem] text-ink-muted">
            Dropping this preset always starts it at whichever time slot you drop it on — this only sets how long it lasts.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Color</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {EVENT_COLORS.map((c) => (
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
            <button
              type="button"
              onClick={() => customColorInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-theme-sm border border-dashed border-border px-2 py-1 text-xs text-ink-muted hover:border-accent hover:text-accent"
            >
              <span aria-hidden="true" className="h-[18px] w-[18px] flex-shrink-0 rounded-full border border-border" style={{ background: color }} />
              Custom color
            </button>
            <input
              ref={customColorInputRef}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Pick a custom preset color"
              className="sr-only"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Priority</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={priority === undefined}
              onClick={() => setPriority(undefined)}
              style={{ background: `color-mix(in srgb, ${color} ${DEFAULT_TINT_PERCENT}%, var(--color-surface))` }}
              className={`rounded-theme-sm border px-2.5 py-1.5 text-xs text-ink ${
                priority === undefined ? "border-ink font-semibold" : "border-border hover:brightness-95"
              }`}
            >
              None
            </button>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={priority === p.value}
                onClick={() => setPriority(p.value)}
                style={{ background: `color-mix(in srgb, ${color} ${PRIORITY_TINT_PERCENT[p.value]}%, var(--color-surface))` }}
                className={`rounded-theme-sm border px-2.5 py-1.5 text-xs text-ink ${
                  priority === p.value ? "border-ink font-semibold" : "border-border hover:brightness-95"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="m-0 text-xs text-[#c22a4d]">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
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
