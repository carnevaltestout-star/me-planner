import { useState } from "react";
import { isFuture, keyToDate } from "@/lib/journal/journal-dates";
import { loadEntries, saveEntries } from "@/lib/journal/journal-storage";
import { emptyEntry, isEntryEmpty, STATIC_QUESTIONS, type JournalEntry, type PrincipleType } from "@/lib/journal/journal-types";
import JournalPrompts from "@/features/journal/journal-prompts";
import { JournalIcon } from "@/components/tab-icons/tab-icons";
import SectionHeader from "./overview-section-header";

interface OverviewJournalPreviewProps {
  selectedDateKey: string;
}

// The real editable JournalPrompts form (same one the full Journal page
// uses), not a read-only snippet — so "today's journal" here means every
// question with its own answer field, not just a link through to the full
// page. Future dates stay locked, same as the full page.
export default function OverviewJournalPreview({ selectedDateKey }: OverviewJournalPreviewProps) {
  const [open, setOpen] = useState(true);
  const [entries, setEntries] = useState<Record<string, JournalEntry>>(() => loadEntries());

  const entry = entries[selectedDateKey] ?? emptyEntry(selectedDateKey);
  const locked = isFuture(keyToDate(selectedDateKey));
  const answeredCount = STATIC_QUESTIONS.filter((q) => entry[q.key].trim()).length;

  function persist(next: Record<string, JournalEntry>) {
    setEntries(next);
    saveEntries(next);
  }

  function handleFieldCommit(field: keyof JournalEntry, value: string) {
    const next = { ...(entries[selectedDateKey] ?? emptyEntry(selectedDateKey)), [field]: value };
    const updated = { ...entries };
    if (isEntryEmpty(next)) delete updated[selectedDateKey];
    else updated[selectedDateKey] = next;
    persist(updated);
  }

  function handleTogglePrinciple(value: boolean) {
    const next = { ...(entries[selectedDateKey] ?? emptyEntry(selectedDateKey)), isPrinciple: value };
    const updated = { ...entries };
    if (isEntryEmpty(next)) delete updated[selectedDateKey];
    else updated[selectedDateKey] = next;
    persist(updated);
  }

  function handlePrincipleTypeChange(value: PrincipleType) {
    const next = { ...(entries[selectedDateKey] ?? emptyEntry(selectedDateKey)), principleType: value };
    const updated = { ...entries };
    if (isEntryEmpty(next)) delete updated[selectedDateKey];
    else updated[selectedDateKey] = next;
    persist(updated);
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader
        icon={<JournalIcon className="h-4 w-4" />}
        title="Journal"
        count={answeredCount}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />
      {open && (
        <JournalPrompts
          key={selectedDateKey}
          entry={entry}
          locked={locked}
          onFieldCommit={handleFieldCommit}
          onTogglePrinciple={handleTogglePrinciple}
          onPrincipleTypeChange={handlePrincipleTypeChange}
        />
      )}
    </section>
  );
}
