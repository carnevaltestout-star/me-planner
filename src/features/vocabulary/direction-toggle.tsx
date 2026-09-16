import type { Direction } from "@/lib/vocabulary/vocab-types";

interface DirectionToggleProps {
  value: Direction;
  onChange: (direction: Direction) => void;
  className?: string;
}

// Same segmented-control markup training-view.tsx's in-session toggle
// already used — shared here so the pre-session choice (this component)
// and the mid-session one look and behave identically.
export default function DirectionToggle({ value, onChange, className }: DirectionToggleProps) {
  return (
    <div className={`inline-flex overflow-hidden rounded-full border border-border ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => onChange("term-to-meaning")}
        aria-pressed={value === "term-to-meaning"}
        className={`px-3 py-1 text-xs ${value === "term-to-meaning" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
      >
        Words
      </button>
      <button
        type="button"
        onClick={() => onChange("meaning-to-term")}
        aria-pressed={value === "meaning-to-term"}
        className={`px-3 py-1 text-xs ${value === "meaning-to-term" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
      >
        Meanings
      </button>
    </div>
  );
}
