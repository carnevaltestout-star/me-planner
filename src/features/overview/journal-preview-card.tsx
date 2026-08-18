import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadEntries } from "@/lib/journal/journal-storage";
import { dateKey } from "@/lib/journal/journal-dates";
import { emptyEntry, STATIC_QUESTIONS } from "@/lib/journal/journal-types";
import { OVERVIEW_CARD_HEIGHT_CLASS, type OverviewPreviewCardProps } from "./overview-preview-card-props";

// Today's filled-in prompts only — same "don't show empty" reasoning as the
// full Journal page, just condensed to the four static questions (the fifth,
// rotating question isn't included since its label varies entry to entry).
export default function JournalPreviewCard({ path, label, icon: Icon, iconClassName, iconStyle, today }: OverviewPreviewCardProps) {
  const entry = useMemo(() => {
    const key = dateKey(today);
    return loadEntries()[key] ?? emptyEntry(key);
  }, [today]);

  const answered = STATIC_QUESTIONS.filter((q) => entry[q.key].trim());

  return (
    <Link
      to={path}
      className={`flex ${OVERVIEW_CARD_HEIGHT_CLASS} flex-col gap-2.5 rounded-theme border border-accent bg-surface p-3.5 shadow-theme hover:brightness-95`}
    >
      <div className="flex flex-shrink-0 items-center gap-2">
        <Icon className={iconClassName} style={iconStyle} />
        <span className="text-sm font-semibold text-accent">{label}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {answered.length === 0 ? (
          <p className="m-0 text-xs text-ink-muted">No entry yet today.</p>
        ) : (
          <ul className="m-0 flex flex-col gap-1.5">
            {answered.map((q) => (
              <li key={q.key} className="text-xs text-ink-muted">
                <span className="mr-1" aria-hidden="true">
                  {q.emoji}
                </span>
                {entry[q.key]}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
