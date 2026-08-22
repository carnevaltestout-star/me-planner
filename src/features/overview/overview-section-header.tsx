import type { ReactNode } from "react";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  count: number;
  extra?: ReactNode;
  open: boolean;
  onToggle: () => void;
}

// Shared compact header for every Overview section: small icon, title, an
// optional extra control (e.g. the To-Do/Goals switch), an item count, and
// a circular expand/collapse chevron — each section owns its own `open`
// state and count rather than this component managing either, since both
// depend on that section's own filtered data.
export default function SectionHeader({ icon, title, count, extra, open, onToggle }: SectionHeaderProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2 rounded-theme-sm bg-surface-alt px-3 py-2">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-ink-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate text-sm font-semibold text-ink">{title}</span>
      {extra}
      <div className="ml-auto flex flex-shrink-0 items-center gap-2">
        <span className="text-sm font-semibold text-ink-muted">{count}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-ink-muted hover:text-ink"
        >
          <span className={`inline-block text-[0.6rem] transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true">
            ▾
          </span>
        </button>
      </div>
    </div>
  );
}
