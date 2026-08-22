interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

// Same pill-group convention used for the To-Dos/Goals switch elsewhere in
// the app — reused here for every game's mode/variant toggle (Sequence
// Memory's visual/word, Reverse Recall's content mode + reverse/sort).
export default function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex flex-wrap overflow-hidden rounded-full border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-2.5 py-1 text-xs font-semibold ${
            value === o.value ? "bg-accent text-accent-contrast" : "bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
