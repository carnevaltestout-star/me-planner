import { useRef, useState } from "react";
import { dateKey, isFuture, shiftDay } from "@/lib/journal/journal-dates";
import { loadEntries, saveEntries } from "@/lib/journal/journal-storage";
import { emptyEntry, isEntryEmpty, type JournalEntry } from "@/lib/journal/journal-types";
import JournalHeader from "./journal-header";
import JournalPrompts from "./journal-prompts";
import JournalYearView from "./journal-year-view";
import JournalDeleteConfirm from "./journal-delete-confirm";

export default function JournalPage() {
  const [current, setCurrent] = useState(() => new Date());
  const [entries, setEntries] = useState<Record<string, JournalEntry>>(() => loadEntries());
  const [yearViewOpen, setYearViewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  // Bumped on delete so JournalPrompts remounts and drops its local field
  // state — its `key` alone doesn't change here since the date stays the
  // same, only the underlying entry is cleared out from under it.
  const [resetToken, setResetToken] = useState(0);
  // Lifted up here (rather than living in JournalHeader) so it fires for
  // every save path — blur-to-autosave from a field in JournalPrompts, not
  // just an explicit click on the Save button.
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeoutRef = useRef<number>();

  const key = dateKey(current);
  const entry = entries[key] ?? emptyEntry(key);
  const locked = isFuture(current);
  const hasEntry = key in entries;

  function persist(next: Record<string, JournalEntry>) {
    setEntries(next);
    saveEntries(next);
  }

  function pulseSaved() {
    window.clearTimeout(savedTimeoutRef.current);
    setJustSaved(true);
    savedTimeoutRef.current = window.setTimeout(() => setJustSaved(false), 1600);
  }

  function handleFieldCommit(field: keyof JournalEntry, value: string) {
    const next = { ...(entries[key] ?? emptyEntry(key)), [field]: value };
    const updated = { ...entries };
    if (isEntryEmpty(next)) {
      delete updated[key];
    } else {
      updated[key] = next;
    }
    persist(updated);
    pulseSaved();
  }

  function handleDelete() {
    const updated = { ...entries };
    delete updated[key];
    persist(updated);
    setDeleteConfirmOpen(false);
    setResetToken((t) => t + 1);
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4">
      <JournalHeader
        current={current}
        entries={entries}
        locked={locked}
        hasEntry={hasEntry}
        justSaved={justSaved}
        onToday={() => setCurrent(new Date())}
        onPrevDay={() => setCurrent((d) => shiftDay(d, -1))}
        onNextDay={() => setCurrent((d) => shiftDay(d, 1))}
        onOpenYearView={() => setYearViewOpen(true)}
        onJumpToDate={setCurrent}
        onSave={() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          pulseSaved();
        }}
        onDeleteRequest={() => setDeleteConfirmOpen(true)}
      />

      <JournalPrompts key={`${key}-${resetToken}`} entry={entry} locked={locked} onFieldCommit={handleFieldCommit} />

      {/* Kept as an empty placeholder — reserves the same vertical space the
          footer note used to take, so removing the text doesn't shift the
          page's height. */}
      <p className="pt-1 text-center text-xs text-ink-muted">&nbsp;</p>

      {yearViewOpen && (
        <JournalYearView
          anchor={current}
          onSelect={(d) => {
            setCurrent(d);
            setYearViewOpen(false);
          }}
          onClose={() => setYearViewOpen(false)}
        />
      )}

      {deleteConfirmOpen && <JournalDeleteConfirm onCancel={() => setDeleteConfirmOpen(false)} onConfirm={handleDelete} />}
    </div>
  );
}
