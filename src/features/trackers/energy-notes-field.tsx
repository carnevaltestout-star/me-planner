import { useRef, useState } from "react";
import type { EnergyNote } from "@/lib/trackers/energy-note-types";

interface EnergyNotesFieldProps {
  note: EnergyNote | undefined;
  locked: boolean;
  onCommitText: (text: string) => void;
  onTogglePrinciple: (value: boolean) => void;
  // Only passed by the main single-day view — the Overview panel's per-day
  // mini cards don't get this button, since "all notes" wouldn't make sense
  // repeated on every card.
  showAllNotes?: { active: boolean; onToggle: () => void };
}

// Remounted with key={anchorKey} by the parent whenever the viewed day
// changes, so this field's local (blur-to-commit) draft state naturally
// resets — same reasoning as JournalPrompts's own per-date remount.
export default function EnergyNotesField({ note, locked, onCommitText, onTogglePrinciple, showAllNotes }: EnergyNotesFieldProps) {
  const [text, setText] = useState(note?.text ?? "");
  const [isPrinciple, setIsPrinciple] = useState(note?.isPrinciple ?? false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeoutRef = useRef<number>();

  function pulseSaved() {
    window.clearTimeout(savedTimeoutRef.current);
    setJustSaved(true);
    savedTimeoutRef.current = window.setTimeout(() => setJustSaved(false), 1600);
  }

  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-l-[3px] border-accent pl-2.5 text-sm font-semibold text-ink">
        <span className="text-base">📝</span>
        <span>Notes</span>
        <label className="relative flex flex-shrink-0 items-center gap-1.5">
          <input
            type="checkbox"
            checked={isPrinciple}
            disabled={locked}
            onChange={(e) => {
              setIsPrinciple(e.target.checked);
              onTogglePrinciple(e.target.checked);
              if (e.target.checked) pulseSaved();
            }}
            className="h-3.5 w-3.5 accent-accent"
          />
          Principle
          <span
            aria-live="polite"
            className={`pointer-events-none absolute -top-4 left-0 whitespace-nowrap text-[10px] font-medium text-ink-muted transition-opacity duration-300 ${
              justSaved ? "opacity-100" : "opacity-0"
            }`}
          >
            Saved
          </span>
        </label>
        {showAllNotes && (
          <button
            type="button"
            aria-pressed={showAllNotes.active}
            onClick={showAllNotes.onToggle}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold shadow-theme hover:bg-surface-alt ${
              showAllNotes.active ? "border-accent bg-accent-soft text-accent" : "border-border bg-sidenav text-ink"
            }`}
          >
            {showAllNotes.active ? "Hide all notes" : "Show all notes"}
          </button>
        )}
      </div>
      <textarea
        rows={4}
        value={text}
        disabled={locked}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => onCommitText(e.target.value)}
        placeholder="Any pattern you noticed?"
        className="min-h-[6em] resize-y rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:outline focus:outline-2 focus:outline-accent disabled:cursor-default"
      />
    </div>
  );
}
