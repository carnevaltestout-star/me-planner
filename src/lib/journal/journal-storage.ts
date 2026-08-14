import { dateKey } from "./journal-dates";
import { emptyEntry, type JournalEntry } from "./journal-types";

// Same localStorage-as-stand-in-for-SQLite pattern as
// src/lib/planner/planner-storage.ts — swapping this for the real DB later
// shouldn't need to touch any component, just this file.
export const JOURNAL_STORAGE_KEY = "me-planner:mock-journal-entries";

function seedEntries(): Record<string, JournalEntry> {
  const today = new Date();
  const demoDate1 = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 3));
  const demoDate2 = new Date(today.getFullYear() - 1, 5, 14);
  const k1 = dateKey(demoDate1);
  const k2 = dateKey(demoDate2);
  return {
    [k1]: {
      ...emptyEntry(k1),
      wentWell: "Finally finished setting up the new desk.",
      q5Label: "What am I grateful for today?",
      q5Text: "A quiet, uneventful evening.",
      notes: "Nothing major, just a steady day.",
    },
    [k2]: {
      ...emptyEntry(k2),
      wentWell: "Started this journal for the first time.",
      differently: "Would've written a bit more.",
      learned: "Small notes add up over time.",
      q5Label: "What challenged me today, and how did I handle it?",
      q5Text: "Getting used to a new routine.",
    },
  };
}

// Normalizes whatever's in storage to the current shape, same reasoning as
// planner-storage.ts's normalize: fields added after an entry was first
// saved shouldn't crash anything that assumes they're always present.
function normalize(key: string, raw: Partial<JournalEntry>): JournalEntry {
  return { ...emptyEntry(key), ...raw, dateKey: key };
}

export function loadEntries(): Record<string, JournalEntry> {
  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, normalize(k, v as Partial<JournalEntry>)]));
      }
    }
  } catch {
    // fall through to seed data
  }
  return seedEntries();
}

export function saveEntries(entries: Record<string, JournalEntry>) {
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
}
