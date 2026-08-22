import { useMemo, useState } from "react";
import { isFuture, keyToDate } from "@/lib/trackers/tracker-dates";
import { loadTrackersState, saveTrackersState, type TrackersState } from "@/lib/trackers/tracker-storage";
import type { MoodKey } from "@/lib/trackers/tracker-types";
import TrackerIcon, { MoodIcon } from "@/features/trackers/tracker-icon";
import MoodPickerModal from "@/features/trackers/mood-picker-modal";
import AmountEntryModal from "@/features/trackers/amount-entry-modal";
import SectionHeader from "./overview-section-header";

interface OverviewHabitListProps {
  selectedDateKey: string;
}

// Period trackers are excluded — their marked days are derived from a cycle
// config, not something checked off day to day, so they don't belong in a
// daily habit checklist the way boolean/amount/mood trackers do.
export default function OverviewHabitList({ selectedDateKey }: OverviewHabitListProps) {
  const [state, setState] = useState<TrackersState>(() => loadTrackersState());
  const [open, setOpen] = useState(true);
  const [moodPickerTrackerId, setMoodPickerTrackerId] = useState<string | null>(null);
  const [amountEntryTrackerId, setAmountEntryTrackerId] = useState<string | null>(null);

  const habits = useMemo(() => state.trackers.filter((t) => t.kind !== "period"), [state.trackers]);
  const locked = useMemo(() => isFuture(keyToDate(selectedDateKey)), [selectedDateKey]);

  function persist(next: TrackersState) {
    setState(next);
    saveTrackersState(next);
  }

  function toggleBoolean(trackerId: string) {
    if (locked) return;
    const trackerEntries = { ...(state.entries[trackerId] ?? {}) };
    if (trackerEntries[selectedDateKey]) delete trackerEntries[selectedDateKey];
    else trackerEntries[selectedDateKey] = true;
    persist({ ...state, entries: { ...state.entries, [trackerId]: trackerEntries } });
  }

  function setMood(trackerId: string, mood: MoodKey) {
    persist({ ...state, entries: { ...state.entries, [trackerId]: { ...(state.entries[trackerId] ?? {}), [selectedDateKey]: mood } } });
    setMoodPickerTrackerId(null);
  }

  function setAmount(trackerId: string, value: string) {
    const trackerEntries = { ...(state.entries[trackerId] ?? {}) };
    if (value) trackerEntries[selectedDateKey] = value;
    else delete trackerEntries[selectedDateKey];
    persist({ ...state, entries: { ...state.entries, [trackerId]: trackerEntries } });
    setAmountEntryTrackerId(null);
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader
        icon={<TrackerIcon icon="heart" className="h-4 w-4" />}
        title="Daily Habits"
        count={habits.length}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />
      {open &&
        (habits.length === 0 ? (
          <p className="m-0 px-1 text-xs text-ink-muted">No habits yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {habits.map((tracker) => {
              const value = state.entries[tracker.id]?.[selectedDateKey];
              return (
                <div
                  key={tracker.id}
                  className="flex items-center gap-2.5 rounded-theme p-3 shadow-theme"
                  style={{ background: `color-mix(in srgb, ${tracker.color} 20%, var(--color-surface))` }}
                >
                  <TrackerIcon icon={tracker.icon} className="h-5 w-5 flex-shrink-0" style={{ color: tracker.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{tracker.name}</span>

                  {tracker.kind === "mood" ? (
                    <button
                      type="button"
                      onClick={() => setMoodPickerTrackerId(tracker.id)}
                      aria-label={`Set mood for ${tracker.name}`}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface"
                    >
                      {value ? (
                        <MoodIcon mood={value as MoodKey} className="h-5 w-5" />
                      ) : (
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-border" />
                      )}
                    </button>
                  ) : tracker.kind === "amount" ? (
                    <button
                      type="button"
                      onClick={() => setAmountEntryTrackerId(tracker.id)}
                      className="max-w-[6.5rem] flex-shrink-0 truncate rounded-theme-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink"
                    >
                      {value ? String(value) : "Log"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => toggleBoolean(tracker.id)}
                      aria-pressed={Boolean(value)}
                      aria-label={value ? "Mark not done" : "Mark done"}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-theme-sm border-2 disabled:opacity-40"
                      style={{
                        borderColor: value ? tracker.color : "var(--color-border)",
                        background: value ? tracker.color : "var(--color-surface)",
                      }}
                    >
                      {value && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5 9.5 17 19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      {moodPickerTrackerId && (
        <MoodPickerModal onClose={() => setMoodPickerTrackerId(null)} onSelect={(mood) => setMood(moodPickerTrackerId, mood)} />
      )}
      {amountEntryTrackerId && (
        <AmountEntryModal
          trackerName={state.trackers.find((t) => t.id === amountEntryTrackerId)?.name ?? ""}
          initialValue={(state.entries[amountEntryTrackerId]?.[selectedDateKey] as string | undefined) ?? ""}
          onClose={() => setAmountEntryTrackerId(null)}
          onSave={(value) => setAmount(amountEntryTrackerId, value)}
        />
      )}
    </section>
  );
}
