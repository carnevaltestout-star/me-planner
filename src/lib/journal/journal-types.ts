export interface JournalEntry {
  dateKey: string;
  wentWell: string;
  differently: string;
  learned: string;
  forSomeone: string;
  q5Label: string;
  q5Text: string;
  notes: string;
}

export interface StaticQuestion {
  key: "wentWell" | "differently" | "learned" | "forSomeone";
  emoji: string;
  label: string;
  placeholder: string;
}

export const STATIC_QUESTIONS: StaticQuestion[] = [
  {
    key: "wentWell",
    emoji: "☀️",
    label: "What went well today, why?",
    placeholder: "Something did. Sit here until you remember what.",
  },
  {
    key: "differently",
    emoji: "🔄",
    label: "What will I do differently?",
    placeholder: "Future You is reading this. Make it useful for them.",
  },
  {
    key: "learned",
    emoji: "💡",
    label: "What new thing did I learn?",
    placeholder: "Bonus points if it changed your mind about something.",
  },
  {
    key: "forSomeone",
    emoji: "🤝",
    label: "What did I do for someone else today?",
    placeholder: "Nothing? Okay, but that's tomorrow's homework then.",
  },
];

export interface Q5PoolItem {
  question: string;
  placeholder: string;
}

export const Q5_POOL: Q5PoolItem[] = [
  { question: "What am I grateful for today?", placeholder: "Gratitude. No fake manifestations." },
  {
    question: "What's one thing I'm proud of today?",
    placeholder: "One thing you handled like a slightly competent adult.",
  },
  {
    question: "What challenged me today, and how did I handle it?",
    placeholder: "Even if \"handled it\" means avoided it until 11pm.",
  },
  {
    question: "What's one small thing that made today better?",
    placeholder: "Small joys are still joys. Don't be a snob about it.",
  },
];

export function emptyEntry(dateKey: string): JournalEntry {
  return { dateKey, wentWell: "", differently: "", learned: "", forSomeone: "", q5Label: "", q5Text: "", notes: "" };
}

export function isEntryEmpty(entry: JournalEntry): boolean {
  return !(
    entry.wentWell ||
    entry.differently ||
    entry.learned ||
    entry.forSomeone ||
    entry.q5Text.trim() ||
    entry.notes.trim()
  );
}

export function entrySearchText(entry: JournalEntry): string {
  return [entry.wentWell, entry.differently, entry.learned, entry.forSomeone, entry.q5Label, entry.q5Text, entry.notes]
    .filter(Boolean)
    .join(" ");
}
