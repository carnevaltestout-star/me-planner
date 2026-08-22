import { useEffect, useMemo, useRef, useState } from "react";
import { daysInMonth, dateKey, isFuture, monthLabel } from "@/lib/trackers/tracker-dates";
import { isPeriodDay } from "@/lib/trackers/period-utils";
import { loadTrackersState, saveTrackersState, type TrackersState } from "@/lib/trackers/tracker-storage";
import { MOOD_OPTIONS, type MoodKey, type Tracker } from "@/lib/trackers/tracker-types";
import TrackerIcon, { MoodIcon } from "./tracker-icon";
import { DropIcon } from "./tracker-line-icons";
import AddTrackerFlow from "./add-tracker-flow";
import MoodPickerModal from "./mood-picker-modal";
import AmountEntryModal from "./amount-entry-modal";
import EditTrackerModal from "./edit-tracker-modal";
import TrackerMonthPicker from "./tracker-month-picker";
import EnergyTrackerCard from "./energy-tracker-card";

const DAY_COL_PX = 34;
const LABEL_COL_PX = 176;
// Matches MobileNav's collapsed icon-rail width (w-11) in app-shell.tsx, so
// the pinned label column reads as "the same kind of strip" as the sidenav.
const LABEL_COL_PX_COLLAPSED = 44;

export default function TrackersPage() {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const days = useMemo(() => daysInMonth(anchor.getFullYear(), anchor.getMonth()), [anchor]);

  const [state, setState] = useState<TrackersState>(() => loadTrackersState());
  const [addFlowOpen, setAddFlowOpen] = useState(false);
  const [moodPicker, setMoodPicker] = useState<{ trackerId: string; dateKey: string } | null>(null);
  const [amountEntry, setAmountEntry] = useState<{ trackerId: string; dateKey: string } | null>(null);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [pinned, setPinned] = useState(false);
  const hScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsMobile(!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Lands scrolled to today's column, centered in the visible day area,
  // instead of day 1 at the far left — on both mobile and desktop. On
  // mobile specifically, once the person has scrolled away from the very
  // start, this also pins a compact icon-only label column so it's still
  // clear which row is which; scrolling all the way back to the start
  // reverts to the normal full label (desktop always shows the full label
  // regardless of pinned, see labelColPx below).
  useEffect(() => {
    if (!hScrollRef.current) return;
    const el = hScrollRef.current;
    const todayIndex = days.findIndex((d) => dateKey(d) === todayKey);
    if (todayIndex >= 0) {
      // The sticky label column always overlays the first LABEL_COL_PX of
      // the viewport once scrolled, so "centered" means centered within
      // what's left after that, not the container's full width.
      const todayCenter = LABEL_COL_PX + todayIndex * DAY_COL_PX + DAY_COL_PX / 2;
      const visibleDayAreaCenter = LABEL_COL_PX / 2 + el.clientWidth / 2;
      el.scrollLeft = Math.max(0, todayCenter - visibleDayAreaCenter);
    } else {
      el.scrollLeft = 0;
    }
    setPinned(el.scrollLeft > 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, anchor]);

  function handleGridScroll() {
    if (!hScrollRef.current) return;
    setPinned(hScrollRef.current.scrollLeft > 4);
  }

  function persist(next: TrackersState) {
    setState(next);
    saveTrackersState(next);
  }

  function addTracker(tracker: Tracker) {
    persist({ ...state, trackers: [...state.trackers, tracker] });
    setAddFlowOpen(false);
  }

  function updateTracker(updated: Tracker) {
    persist({ ...state, trackers: state.trackers.map((t) => (t.id === updated.id ? updated : t)) });
    setEditingTracker(null);
  }

  function deleteTracker(trackerId: string) {
    const entries = { ...state.entries };
    delete entries[trackerId];
    persist({ ...state, trackers: state.trackers.filter((t) => t.id !== trackerId), entries });
    setEditingTracker(null);
  }

  function toggleBoolean(trackerId: string, key: string) {
    if (isFuture(new Date(`${key}T00:00:00`))) return;
    const trackerEntries = { ...(state.entries[trackerId] ?? {}) };
    if (trackerEntries[key]) delete trackerEntries[key];
    else trackerEntries[key] = true;
    persist({ ...state, entries: { ...state.entries, [trackerId]: trackerEntries } });
  }

  function setMood(trackerId: string, key: string, mood: MoodKey) {
    const trackerEntries = { ...(state.entries[trackerId] ?? {}), [key]: mood };
    persist({ ...state, entries: { ...state.entries, [trackerId]: trackerEntries } });
    setMoodPicker(null);
  }

  function setAmount(trackerId: string, key: string, value: string) {
    const trackerEntries = { ...(state.entries[trackerId] ?? {}) };
    if (value) trackerEntries[key] = value;
    else delete trackerEntries[key];
    persist({ ...state, entries: { ...state.entries, [trackerId]: trackerEntries } });
    setAmountEntry(null);
  }

  // The pinned strip only shrinks on mobile — desktop always shows the full
  // label. Content position of any day column is labelColPx + i*DAY_COL_PX,
  // and the visible-day-area start is also labelColPx (the sticky column's
  // own width), so the two shifts cancel out: scrollLeft doesn't need any
  // compensation when this collapses/expands, the same day just stays
  // first-visible while more room opens up to its right.
  const labelColPx = isMobile && pinned ? LABEL_COL_PX_COLLAPSED : LABEL_COL_PX;
  const gridCols = `${labelColPx}px repeat(${days.length}, ${DAY_COL_PX}px)`;

  return (
    <div className="relative flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      {/* Purely decorative — large soft hearts scattered behind the grid,
          same idea as the strawberries that used to live here, just not
          skin-gated this time since the ask was for the page generally. */}
      <svg aria-hidden="true" className="pointer-events-none absolute -right-6 top-2 h-28 w-28 text-accent opacity-[0.08]" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 19s-7.2-4.4-9.4-8.7C1 7 2.5 4 5.7 4c1.9 0 3.4 1 4.7 2.6C11.7 5 13.2 4 15.1 4c3.2 0 4.7 3 3.1 6.3C16 14.6 12 19 12 19Z" />
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute bottom-10 left-1/3 hidden h-20 w-20 rotate-12 text-accent opacity-[0.06] md:block" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 19s-7.2-4.4-9.4-8.7C1 7 2.5 4 5.7 4c1.9 0 3.4 1 4.7 2.6C11.7 5 13.2 4 15.1 4c3.2 0 4.7 3 3.1 6.3C16 14.6 12 19 12 19Z" />
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute -left-8 bottom-1/4 h-32 w-32 -rotate-6 text-accent opacity-[0.07]" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 19s-7.2-4.4-9.4-8.7C1 7 2.5 4 5.7 4c1.9 0 3.4 1 4.7 2.6C11.7 5 13.2 4 15.1 4c3.2 0 4.7 3 3.1 6.3C16 14.6 12 19 12 19Z" />
      </svg>

      <EnergyTrackerCard />

      <div className="flex flex-shrink-0 items-center justify-between rounded-theme border border-border bg-surface px-3 py-2.5 shadow-theme">
        <button
          type="button"
          onClick={() => setMonthPickerOpen(true)}
          className="m-0 rounded-full border px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-alt"
          style={{ borderColor: "var(--color-accent)" }}
        >
          {monthLabel(anchor.getFullYear(), anchor.getMonth())}
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-sidenav text-ink shadow-theme hover:bg-surface-alt"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-sidenav text-ink shadow-theme hover:bg-surface-alt"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={hScrollRef}
        onScroll={handleGridScroll}
        className="trackers-grid flex-shrink-0 overflow-x-auto overscroll-x-contain rounded-theme border border-border bg-surface shadow-theme [-webkit-overflow-scrolling:touch]"
      >
        <div style={{ minWidth: labelColPx + days.length * DAY_COL_PX }}>
          <div className="grid border-b border-border" style={{ gridTemplateColumns: gridCols }}>
            <div
              className={`sticky left-0 z-20 flex items-center border-r border-border bg-surface p-2 ${
                isMobile && pinned ? "justify-center" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setAddFlowOpen(true)}
                aria-label="Add tracker"
                className={`flex items-center justify-center gap-1.5 rounded-full bg-canvas text-xs font-semibold shadow-theme hover:brightness-95 ${
                  isMobile && pinned ? "h-7 w-7" : "px-2.5 py-1.5"
                }`}
                style={{ color: "var(--color-accent)" }}
              >
                <span className="text-sm leading-none">+</span>
                {!(isMobile && pinned) && "Add habit"}
              </button>
            </div>
            {days.map((d) => {
              const key = dateKey(d);
              const todayCol = key === todayKey;
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-center border-r border-border py-2 text-center last:border-r-0 ${
                    todayCol ? "font-bold text-accent-contrast" : "text-ink-muted"
                  }`}
                  style={todayCol ? { background: "var(--color-accent)" } : undefined}
                >
                  <span className="text-[0.6rem] uppercase tracking-wide">
                    {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                  <span className="text-[0.72rem] font-semibold">{d.getDate()}</span>
                </div>
              );
            })}
          </div>

          {state.trackers.map((tracker) => (
            <div key={tracker.id} className="grid border-b border-border last:border-b-0" style={{ gridTemplateColumns: gridCols }}>
              <button
                type="button"
                onClick={() => setEditingTracker(tracker)}
                title={tracker.name}
                className={`sticky left-0 z-20 flex items-center gap-2 border-r border-border bg-surface p-2 text-left hover:bg-surface-alt ${
                  isMobile && pinned ? "justify-center" : ""
                }`}
              >
                <TrackerIcon
                  icon={tracker.icon}
                  className="h-[18px] w-[18px] flex-shrink-0"
                  style={{ color: tracker.color }}
                />
                {!(isMobile && pinned) && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: tracker.color }}>
                      {tracker.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: tracker.color }}
                    />
                  </>
                )}
              </button>

              {days.map((d) => {
                const key = dateKey(d);
                const todayCol = key === todayKey;
                const locked = isFuture(d);
                const cellBase = `relative flex items-center justify-center border-r border-border last:border-r-0 ${
                  todayCol ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)]" : ""
                }`;

                if (tracker.kind === "period") {
                  const marked = isPeriodDay(tracker, d);
                  return (
                    <div key={key} className={cellBase} style={{ minHeight: 34 }}>
                      {marked && <DropIcon aria-hidden="true" className="h-4 w-4" style={{ color: tracker.color }} />}
                    </div>
                  );
                }

                if (tracker.kind === "mood") {
                  const value = state.entries[tracker.id]?.[key] as MoodKey | undefined;
                  const moodColor = value ? MOOD_OPTIONS.find((m) => m.key === value)?.color : undefined;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={locked}
                      onClick={() => setMoodPicker({ trackerId: tracker.id, dateKey: key })}
                      className={`${cellBase} disabled:cursor-default`}
                      style={{
                        minHeight: 34,
                        background: moodColor
                          ? `color-mix(in srgb, ${moodColor} 22%, var(--color-surface))`
                          : todayCol
                            ? "color-mix(in srgb, var(--color-accent) 16%, transparent)"
                            : undefined,
                      }}
                    >
                      {value ? (
                        <MoodIcon mood={value} className="h-4 w-4" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${locked ? "opacity-0" : "bg-border"}`}
                        />
                      )}
                    </button>
                  );
                }

                if (tracker.kind === "amount") {
                  const value = state.entries[tracker.id]?.[key] as string | undefined;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={locked}
                      onClick={() => setAmountEntry({ trackerId: tracker.id, dateKey: key })}
                      className={`${cellBase} disabled:cursor-default`}
                      style={{
                        minHeight: 34,
                        background: value
                          ? `color-mix(in srgb, ${tracker.color} 22%, var(--color-surface))`
                          : todayCol
                            ? "color-mix(in srgb, var(--color-accent) 16%, transparent)"
                            : undefined,
                      }}
                    >
                      {value ? (
                        <span
                          className="max-w-full truncate px-0.5 text-[0.58rem] font-semibold"
                          style={{ color: tracker.color }}
                        >
                          {value}
                        </span>
                      ) : (
                        !locked && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-border" />
                      )}
                    </button>
                  );
                }

                const done = Boolean(state.entries[tracker.id]?.[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={locked}
                    onClick={() => toggleBoolean(tracker.id, key)}
                    className={`${cellBase} disabled:cursor-default`}
                    style={{ minHeight: 34 }}
                  >
                    {done ? (
                      <span aria-hidden="true" className="h-4 w-4 rounded-full" style={{ background: tracker.color }} />
                    ) : (
                      !locked && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-border" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {addFlowOpen && (
        <AddTrackerFlow
          onClose={() => setAddFlowOpen(false)}
          onCreate={addTracker}
          periodAlreadyAdded={state.trackers.some((t) => t.kind === "period")}
        />
      )}

      {moodPicker && (
        <MoodPickerModal
          onClose={() => setMoodPicker(null)}
          onSelect={(mood) => setMood(moodPicker.trackerId, moodPicker.dateKey, mood)}
        />
      )}

      {amountEntry && (
        <AmountEntryModal
          trackerName={state.trackers.find((t) => t.id === amountEntry.trackerId)?.name ?? ""}
          initialValue={(state.entries[amountEntry.trackerId]?.[amountEntry.dateKey] as string | undefined) ?? ""}
          onClose={() => setAmountEntry(null)}
          onSave={(value) => setAmount(amountEntry.trackerId, amountEntry.dateKey, value)}
        />
      )}

      {editingTracker && (
        <EditTrackerModal
          tracker={editingTracker}
          onClose={() => setEditingTracker(null)}
          onSave={updateTracker}
          onDelete={() => deleteTracker(editingTracker.id)}
        />
      )}
    </div>
  );
}
