import { useMemo, useState } from "react";
import type { SVGProps } from "react";
import { dateKey, isFuture, monthLabel, shiftDay } from "@/lib/trackers/tracker-dates";
import { loadEnergyState, saveEnergyState } from "@/lib/trackers/energy-storage";
import { loadEnergyNotes, saveEnergyNotes } from "@/lib/trackers/energy-note-storage";
import type { EnergyPoint } from "@/lib/trackers/energy-types";
import TrackerMonthPicker from "./tracker-month-picker";
import EnergyDayChart from "./energy-day-chart";
import EnergyMonthView from "./energy-month-view";
import EnergyNotesField from "./energy-notes-field";
import EnergyOverviewPanel from "./energy-overview-panel";

type EnergyView = "day" | "month";

export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M11 2 4.5 11.5h4L8 18l7.5-9.5h-4L12.5 2Z" />
    </svg>
  );
}

// A second, independently-navigable card above the main tracker grid — its
// own day/month anchor rather than sharing TrackersPage's, since it's a
// completely different kind of data (freeform points on a chart, not a
// day-column grid).
export default function EnergyTrackerCard() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState<EnergyView>("day");
  const [state, setState] = useState(() => loadEnergyState());
  const [notes, setNotes] = useState(() => loadEnergyNotes());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  // Never persisted — always starts closed on a fresh page load, by design.
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [showAllNotesOpen, setShowAllNotesOpen] = useState(false);

  const anchorKey = dateKey(anchor);
  const locked = isFuture(anchor);

  const allNonEmptyNotes = useMemo(
    () => Object.entries(notes).filter(([, n]) => n.text.trim()).sort(([a], [b]) => (a < b ? 1 : -1)),
    [notes],
  );

  function persist(next: typeof state) {
    setState(next);
    saveEnergyState(next);
  }

  function persistNotes(next: typeof notes) {
    setNotes(next);
    saveEnergyNotes(next);
  }

  function handleChangePoints(points: EnergyPoint[]) {
    persist({ ...state, [anchorKey]: points });
  }

  function handleChangeDayPoints(key: string, points: EnergyPoint[]) {
    persist({ ...state, [key]: points });
  }

  function handleCommitNoteText(key: string, text: string) {
    const existing = notes[key];
    if (!text.trim() && !existing?.isPrinciple) {
      const next = { ...notes };
      delete next[key];
      persistNotes(next);
      return;
    }
    persistNotes({ ...notes, [key]: { text, isPrinciple: existing?.isPrinciple ?? false, updatedAt: existing?.updatedAt ?? "" } });
  }

  function handleToggleNotePrinciple(key: string, value: boolean) {
    const existing = notes[key];
    if (!value && !existing?.text.trim()) {
      const next = { ...notes };
      delete next[key];
      persistNotes(next);
      return;
    }
    persistNotes({ ...notes, [key]: { text: existing?.text ?? "", isPrinciple: value, updatedAt: existing?.updatedAt ?? "" } });
  }

  function shiftMonth(date: Date, delta: number) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
  }

  function goPrev() {
    setAnchor((a) => (view === "month" ? shiftMonth(a, -1) : shiftDay(a, -1)));
  }

  function goNext() {
    setAnchor((a) => (view === "month" ? shiftMonth(a, 1) : shiftDay(a, 1)));
  }

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 rounded-theme border border-border bg-surface p-3 shadow-theme">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded-full border border-border bg-sidenav px-2.5 py-1 text-xs font-semibold text-ink shadow-theme hover:bg-surface-alt"
          >
            Today
          </button>
          <button
            type="button"
            aria-label={view === "month" ? "Previous month" : "Previous day"}
            onClick={goPrev}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
          >
            ‹
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMonthPickerOpen(true)}
              className="rounded-full border px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-alt"
              style={{ borderColor: "var(--color-accent)" }}
            >
              {view === "month"
                ? monthLabel(anchor.getFullYear(), anchor.getMonth())
                : anchor.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </button>
            {monthPickerOpen && (
              <TrackerMonthPicker
                anchor={anchor}
                onSelect={(year, month) => {
                  setAnchor(new Date(year, month, 1));
                  setMonthPickerOpen(false);
                }}
                onClose={() => setMonthPickerOpen(false)}
              />
            )}
          </div>
          <button
            type="button"
            aria-label={view === "month" ? "Next month" : "Next day"}
            onClick={goNext}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
          >
            ›
          </button>
          <button
            type="button"
            aria-pressed={overviewOpen}
            onClick={() => setOverviewOpen((o) => !o)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold shadow-theme hover:bg-surface-alt ${
              overviewOpen ? "border-accent bg-accent-soft text-accent" : "border-border bg-sidenav text-ink"
            }`}
          >
            Overview
          </button>
        </div>
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            aria-pressed={view === "day"}
            onClick={() => {
              // Switching from Month back to Day always lands on today,
              // rather than wherever the month grid happened to leave the
              // anchor (e.g. the 1st of some month you'd navigated to).
              if (view !== "day") setAnchor(new Date());
              setView("day");
            }}
            className={`px-3 py-1 text-xs ${view === "day" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
          >
            Day
          </button>
          <button
            type="button"
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
            className={`px-3 py-1 text-xs ${view === "month" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-accent-soft)" }}
        >
          <BoltIcon className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
        </span>
        <h3 className="m-0 text-sm font-semibold text-ink">Energy Tracker</h3>
      </div>

      {overviewOpen ? (
        <EnergyOverviewPanel
          state={state}
          notes={notes}
          onChangeDay={handleChangeDayPoints}
          onCommitNoteText={handleCommitNoteText}
          onToggleNotePrinciple={handleToggleNotePrinciple}
          onClose={() => setOverviewOpen(false)}
        />
      ) : view === "day" ? (
        <>
          <EnergyDayChart points={state[anchorKey] ?? []} onChange={handleChangePoints} locked={locked} />
          <EnergyNotesField
            key={anchorKey}
            note={notes[anchorKey]}
            locked={locked}
            onCommitText={(text) => handleCommitNoteText(anchorKey, text)}
            onTogglePrinciple={(value) => handleToggleNotePrinciple(anchorKey, value)}
            showAllNotes={{ active: showAllNotesOpen, onToggle: () => setShowAllNotesOpen((o) => !o) }}
          />
          {showAllNotesOpen && (
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-theme-sm border border-border bg-canvas p-2.5">
              {allNonEmptyNotes.length === 0 ? (
                <p className="m-0 text-xs text-ink-muted">No notes yet.</p>
              ) : (
                allNonEmptyNotes.map(([key, n]) => (
                  <div key={key} className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-ink">
                        {new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {n.isPrinciple && (
                        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[0.6rem] font-semibold text-accent">Principle</span>
                      )}
                    </div>
                    <p className="m-0 whitespace-pre-wrap text-xs text-ink-muted">{n.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <EnergyMonthView anchor={anchor} state={state} />
      )}
    </div>
  );
}
