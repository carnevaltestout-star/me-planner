import { useRef, useState } from "react";
import { fromTimeInput, toTimeInput } from "@/lib/planner/planner-dates";
import {
  DEFAULT_TINT_PERCENT,
  EVENT_COLORS,
  PRIORITY_TINT_PERCENT,
  type EventPriority,
  type RepeatRule,
} from "@/lib/planner/planner-types";

const PRIORITIES: { value: EventPriority; label: string }[] = [
  { value: 1, label: "1 · Highest" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4 · Lowest" },
];

export interface EventModalInitial {
  title: string;
  notes: string;
  start: number;
  end: number;
  repeat: RepeatRule;
  color: string;
  priority?: EventPriority;
  occurrenceDate: string;
}

export interface EventModalSaveData {
  title: string;
  notes: string;
  start: number;
  end: number;
  repeat: RepeatRule;
  color: string;
  priority?: EventPriority;
}

interface EventModalProps {
  mode: "create" | "edit";
  initial: EventModalInitial;
  onSave: (data: EventModalSaveData) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function EventModal({ mode, initial, onSave, onDelete, onClose }: EventModalProps) {
  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes);
  const [start, setStart] = useState(toTimeInput(initial.start));
  const [end, setEnd] = useState(toTimeInput(initial.end));
  const [repeat, setRepeat] = useState<RepeatRule>(initial.repeat);
  const [color, setColor] = useState(initial.color || EVENT_COLORS[0]);
  const [priority, setPriority] = useState<EventPriority | undefined>(initial.priority);
  const [error, setError] = useState("");
  const customColorInputRef = useRef<HTMLInputElement>(null);

  const dateLabel = new Date(`${initial.occurrenceDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Moving start past (or onto) the current end would otherwise just sit
  // there until Save surfaces "End has to be after start." — pulling end
  // along with start as soon as it happens is more useful than making the
  // person notice and fix it themselves. Bumped to start+15min (the time
  // input's own step) rather than set exactly equal to start, since an
  // equal start/end is a zero-length event that would immediately re-fail
  // that same validation on save.
  function handleStartChange(value: string) {
    setStart(value);
    const startHour = fromTimeInput(value);
    // Capped at 23:45 (not 24:00) since that's the latest value the <input
    // type="time"> picker itself can actually display.
    if (startHour >= fromTimeInput(end)) setEnd(toTimeInput(Math.min(23.75, startHour + 0.25)));
  }

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give it a title.");
      return;
    }
    const startHour = fromTimeInput(start);
    const endHour = fromTimeInput(end);
    if (!(endHour > startHour)) {
      setError("End has to be after start.");
      return;
    }
    onSave({ title: trimmedTitle, notes: notes.trim(), start: startHour, end: endHour, repeat, color, priority });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Badge lives on this outer, non-clipping wrapper — the dialog below
          needs its own overflow-hidden for the rounded corners/scroll area,
          which would otherwise clip the badge where it hangs over the edge. */}
      <div className="relative w-full max-w-[340px]">
        {priority !== undefined && (
          <span
            aria-hidden="true"
            style={{ background: color }}
            className="absolute -left-2.5 -top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-xs font-bold text-white shadow-theme"
          >
            P{priority}
          </span>
        )}

        <div
          role="dialog"
          aria-modal="true"
          style={priority !== undefined ? { borderColor: color, borderWidth: 3 } : undefined}
          className={`relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-theme border bg-surface shadow-theme ${
            priority === undefined ? "border-border" : ""
          }`}
        >
          {/* Header stays put while the fields below scroll — the title never
              gets lost off-screen on short/landscape mobile viewports. */}
          <div className="flex-shrink-0 border-b border-border px-[1.1rem] py-3">
            <h2 className="m-0 text-base text-ink">{mode === "edit" ? "Edit event" : "New event"}</h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-[1.1rem] py-3.5">
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
              <span>Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's happening?"
                className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
            </label>

            <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
              <span>Notes</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Location, agenda, anything else"
                className="resize-y rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              />
            </label>

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

            <label className="flex flex-1 flex-col gap-1.5 text-xs text-ink-muted">
              <span>Repeats</span>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as RepeatRule)}
                className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-[0.88rem] text-ink focus:outline focus:outline-2 focus:outline-accent"
              >
                <option value="none">Doesn&apos;t repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly, same weekday</option>
                <option value="monthly">Monthly, same date</option>
              </select>
            </label>

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
                  <span
                    aria-hidden="true"
                    className="h-[18px] w-[18px] flex-shrink-0 rounded-full border border-border"
                    style={{ background: color }}
                  />
                  Custom color
                </button>
                <input
                  ref={customColorInputRef}
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label="Pick a custom event color"
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

            <p className="m-0 text-xs text-ink-muted">{dateLabel}</p>
            {error && <p className="m-0 text-xs text-[#c22a4d]">{error}</p>}
          </div>
        </div>

        {/* Footer stays put too — Save/Cancel are always reachable without
            hunting through the scrollable fields above. */}
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-border px-[1.1rem] py-3">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-theme-sm border border-[color-mix(in_srgb,#c22a4d_40%,var(--color-border))] px-3.5 py-2 text-sm text-[#c22a4d] hover:bg-[color-mix(in_srgb,#c22a4d_10%,transparent)]"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
      </div>
    </div>
  );
}
