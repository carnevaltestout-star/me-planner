interface LevelPickerProps {
  level: number;
  min?: number;
  max?: number;
  onChange: (level: number) => void;
}

// Same round "‹ value ›" stepper convention used by Goals/To-Dos' period
// nav — every level picker across all 5 games looks and behaves the same.
export default function LevelPicker({ level, min = 1, max = 30, onChange }: LevelPickerProps) {
  return (
    <div className="inline-flex flex-shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Lower level"
        disabled={level <= min}
        onClick={() => onChange(Math.max(min, level - 1))}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt disabled:cursor-default disabled:opacity-40"
      >
        ‹
      </button>
      <span className="min-w-[4.5rem] text-center text-xs font-semibold text-ink">Level {level}</span>
      <button
        type="button"
        aria-label="Raise level"
        disabled={level >= max}
        onClick={() => onChange(Math.min(max, level + 1))}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt disabled:cursor-default disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}
