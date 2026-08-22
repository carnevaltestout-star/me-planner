import { useEffect, useRef, useState } from "react";
import { keyToDate } from "@/lib/journal/journal-dates";
import { entrySearchText, type JournalEntry } from "@/lib/journal/journal-types";
import { CalendarIcon, ColumnsIcon, SaveIcon, SearchIcon, TrashIcon } from "./journal-icons";

interface SearchMatch {
  dateKey: string;
  date: Date;
  entry: JournalEntry;
}

interface JournalHeaderProps {
  current: Date;
  entries: Record<string, JournalEntry>;
  locked: boolean;
  hasEntry: boolean;
  justSaved: boolean;
  onToday: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenYearView: () => void;
  onOpenOverview: () => void;
  onJumpToDate: (d: Date) => void;
  onSave: () => void;
  onDeleteRequest: () => void;
}

export default function JournalHeader({
  current,
  entries,
  locked,
  hasEntry,
  justSaved,
  onToday,
  onPrevDay,
  onNextDay,
  onOpenYearView,
  onOpenOverview,
  onJumpToDate,
  onSave,
  onDeleteRequest,
}: JournalHeaderProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchMatch[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function runSearch() {
    const q = query.trim();
    if (!q) {
      setOpen(false);
      return;
    }
    const ddmm = q.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
    const yyyy = q.match(/^(\d{4})$/);
    const matches = Object.entries(entries)
      .map(([k, entry]) => ({ dateKey: k, date: keyToDate(k), entry }))
      .filter(({ date, entry }) => {
        if (ddmm) return date.getDate() === parseInt(ddmm[1], 10) && date.getMonth() + 1 === parseInt(ddmm[2], 10);
        if (yyyy) return date.getFullYear() === parseInt(yyyy[1], 10);
        return entrySearchText(entry).toLowerCase().includes(q.toLowerCase());
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    setResults(matches);
    setOpen(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-shrink-0 items-center gap-2 max-[480px]:w-full">
        <button
          type="button"
          onClick={onToday}
          className="flex-shrink-0 rounded-theme border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink hover:bg-surface-alt md:px-3 md:py-1.5 md:text-sm"
        >
          Today
        </button>
        <button
          type="button"
          onClick={onOpenOverview}
          aria-label="Overview — compare the last 3 days"
          className="flex flex-shrink-0 items-center gap-1 rounded-theme border border-border bg-surface px-2 py-1 text-xs text-ink hover:bg-surface-alt md:gap-1.5 md:px-3 md:py-1.5 md:text-sm"
        >
          <ColumnsIcon className="h-3.5 w-3.5 flex-shrink-0 text-ink-muted md:h-4 md:w-4" />
          <span className="hidden sm:inline">Overview</span>
        </button>
        <button
          type="button"
          onClick={onPrevDay}
          aria-label="Previous day"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme border border-border bg-surface text-xs text-ink hover:bg-surface-alt md:h-8 md:w-8 md:text-sm"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onOpenYearView}
          className="flex min-w-0 items-center gap-1 rounded-theme border border-border bg-surface px-2 py-1 text-xs text-ink hover:bg-surface-alt md:gap-1.5 md:px-3 md:py-1.5 md:text-sm"
        >
          <strong className="min-w-0 truncate font-semibold">
            {current.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </strong>
          <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0 text-ink-muted md:h-4 md:w-4" />
        </button>
        <button
          type="button"
          onClick={onNextDay}
          aria-label="Next day"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme border border-border bg-surface text-xs text-ink hover:bg-surface-alt md:h-8 md:w-8 md:text-sm"
        >
          ›
        </button>
      </div>

      <div className="contents max-[480px]:flex max-[480px]:w-full max-[480px]:flex-wrap max-[480px]:gap-2">
        <div ref={wrapRef} className="relative min-w-0 flex-1 max-[480px]:order-1">
          <div className="flex items-center gap-1 rounded-theme border border-border bg-surface pl-2.5 pr-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search by date (2026 or 20.05) or text…"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={runSearch}
              aria-label="Search entries"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-ink"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </div>
          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-y-auto rounded-theme border border-border bg-surface shadow-theme">
              {results.length === 0 ? (
                <div className="p-2.5 text-center text-sm text-ink-muted">No matching entries.</div>
              ) : (
                results.map((r) => (
                  <button
                    key={r.dateKey}
                    type="button"
                    onClick={() => {
                      onJumpToDate(r.date);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full flex-col gap-0.5 border-b border-border px-2.5 py-1.5 text-left last:border-b-0 hover:bg-surface-alt"
                  >
                    <span className="text-xs font-semibold text-ink">
                      {r.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="truncate text-xs text-ink-muted">{entrySearchText(r.entry).slice(0, 70) || "—"}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative flex-shrink-0 max-[480px]:order-2">
          <span
            aria-live="polite"
            className={`pointer-events-none absolute -top-4 right-0 whitespace-nowrap text-[10px] font-medium text-ink-muted transition-opacity duration-300 ${
              justSaved ? "opacity-100" : "opacity-0"
            }`}
          >
            Saved
          </span>
          <button
            type="button"
            onClick={onSave}
            disabled={locked}
            aria-label="Save entry"
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-theme border border-border bg-accent text-accent-contrast transition-transform disabled:cursor-default disabled:opacity-50 ${
              justSaved ? "scale-110" : ""
            }`}
          >
            <SaveIcon className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onDeleteRequest}
          disabled={!hasEntry || locked}
          aria-label="Delete entry"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-theme border border-border text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-muted max-[480px]:order-3"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
