import { useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { useEscapeKey } from "@/lib/use-escape-key";
import { dateKey, shiftDay } from "@/lib/journal/journal-dates";
import { STATIC_QUESTIONS, type JournalEntry } from "@/lib/journal/journal-types";

interface JournalOverviewProps {
  entries: Record<string, JournalEntry>;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

// Compares against the real today rather than trusting a fixed offset, since
// the 3-day window itself can now shift to an older set — offset 0 within
// that window isn't necessarily "today" anymore.
function dayLabel(date: Date, today: Date) {
  if (dateKey(date) === dateKey(today)) return "Today";
  if (dateKey(date) === dateKey(shiftDay(today, -1))) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

// Read-only — this is a side-by-side comparison, not another place to edit
// from. Jumping to a day (via its header) and editing there stays the one
// path for changes, so autosave/lock logic never has to be duplicated here.
export default function JournalOverview({ entries, onSelect, onClose }: JournalOverviewProps) {
  const bottomReserve = useMobileBottomReserve();
  useEscapeKey(onClose);
  const today = new Date();
  // The 3-day window's own end date — starts on today, shifts a full
  // window (3 days) at a time via the arrows below so "older"/"newer"
  // moves between whole sets rather than one day at a time.
  const [anchor, setAnchor] = useState(() => new Date());
  const isAtPresent = dateKey(anchor) === dateKey(today);
  const days = [0, -1, -2].map((offset) => {
    const date = shiftDay(anchor, offset);
    const key = dateKey(date);
    return { offset, date, key, entry: entries[key] };
  });

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
        aria-label="Journal overview"
        className="flex max-h-[90vh] w-full max-w-[900px] flex-col gap-3.5 overflow-hidden rounded-theme border border-border bg-canvas p-4 shadow-theme"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="m-0 flex-shrink-0 font-theme text-lg font-semibold text-ink">Overview</h2>
            <div className="inline-flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setAnchor((a) => shiftDay(a, -3))}
                aria-label="Older set"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
              >
                ‹
              </button>
              {!isAtPresent && (
                <button
                  type="button"
                  onClick={() => setAnchor(new Date())}
                  className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-semibold text-ink-muted hover:bg-surface-alt"
                >
                  Today
                </button>
              )}
              <button
                type="button"
                onClick={() => setAnchor((a) => shiftDay(a, 3))}
                aria-label="Newer set"
                disabled={isAtPresent}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt disabled:opacity-30 disabled:hover:bg-transparent"
              >
                ›
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close overview"
            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-3">
          {days.map(({ date, key, entry }) => (
            <div key={key} className="flex flex-col gap-2.5 rounded-theme border border-border bg-surface p-3 shadow-theme">
              <button
                type="button"
                onClick={() => onSelect(date)}
                className="flex flex-col items-start gap-0.5 rounded-theme-sm px-1 py-0.5 text-left hover:bg-surface-alt"
              >
                <span className="text-sm font-bold text-ink">{dayLabel(date, today)}</span>
                <span className="text-xs text-ink-muted">
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </button>

              {!entry ? (
                <p className="m-0 px-1 text-xs italic text-ink-muted">No entry.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {STATIC_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex flex-col gap-0.5 border-l-[3px] border-accent pl-2">
                      <span className="flex items-center gap-1 text-[0.68rem] font-semibold text-ink-muted">
                        <span>{q.emoji}</span>
                        <span>{q.label}</span>
                      </span>
                      <span className="whitespace-pre-wrap text-xs text-ink">{entry[q.key] || "—"}</span>
                    </div>
                  ))}
                  {entry.q5Text.trim() && (
                    <div className="flex flex-col gap-0.5 border-l-[3px] border-accent pl-2">
                      <span className="text-[0.68rem] font-semibold text-ink-muted">{entry.q5Label || "Custom question"}</span>
                      <span className="whitespace-pre-wrap text-xs text-ink">{entry.q5Text}</span>
                    </div>
                  )}
                  {entry.notes.trim() && (
                    <div className="flex flex-col gap-0.5 border-l-[3px] border-accent pl-2">
                      <span className="text-[0.68rem] font-semibold text-ink-muted">📝 Notes</span>
                      <span className="whitespace-pre-wrap text-xs text-ink">{entry.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
