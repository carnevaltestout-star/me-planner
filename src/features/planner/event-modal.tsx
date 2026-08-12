import { useState } from "react";
import { EVENT_COLORS, type RepeatRule } from "@/lib/planner/planner-types";

export interface EventModalInitial {
  title: string;
  notes: string;
  start: number;
  end: number;
  repeat: RepeatRule;
  color: string;
  occurrenceDate: string;
}

export interface EventModalSaveData {
  title: string;
  notes: string;
  start: number;
  end: number;
  repeat: RepeatRule;
  color: string;
}

interface EventModalProps {
  mode: "create" | "edit";
  initial: EventModalInitial;
  onSave: (data: EventModalSaveData) => void;
  onDelete: () => void;
  onClose: () => void;
}

function toTimeInput(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function fromTimeInput(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return h + m / 60;
}

export default function EventModal({ mode, initial, onSave, onDelete, onClose }: EventModalProps) {
  const [title, setTitle] = useState(initial.title);
  const [notes, setNotes] = useState(initial.notes);
  const [start, setStart] = useState(toTimeInput(initial.start));
  const [end, setEnd] = useState(toTimeInput(initial.end));
  const [repeat, setRepeat] = useState<RepeatRule>(initial.repeat);
  const [color, setColor] = useState(initial.color || EVENT_COLORS[0]);
  const [error, setError] = useState("");

  const dateLabel = new Date(`${initial.occurrenceDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
    onSave({ title: trimmedTitle, notes: notes.trim(), start: startHour, end: endHour, repeat, color });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[340px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme"
      >
        <h2 className="m-0 text-base text-ink">{mode === "edit" ? "Edit event" : "New event"}</h2>

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
              onChange={(e) => setStart(e.target.value)}
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
          <div className="flex flex-wrap gap-1.5">
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
          </div>
        </div>

        <p className="m-0 text-xs text-ink-muted">{dateLabel}</p>
        <p className="m-0 min-h-[1em] text-xs text-[#c22a4d]">{error}</p>

        <div className="mt-0.5 flex items-center justify-between gap-2">
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
  );
}
