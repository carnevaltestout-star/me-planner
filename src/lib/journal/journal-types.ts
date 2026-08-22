export type PrincipleType = "All" | "Personal" | "Social" | "Work" | "Finance" | "Me";

// Full list — used for the Principles tab's type filters and badge
// coloring. "Me" is deliberately excluded from SELECTABLE_PRINCIPLE_TYPES
// below: it's an automatic type reserved for principles saved from the
// Energy Tracker's notes field, not something a person picks by hand.
export const PRINCIPLE_TYPES: PrincipleType[] = ["All", "Personal", "Social", "Work", "Finance", "Me"];

// What the Journal's own Type dropdown and the "Add Principle" dialog offer
// — everywhere a person is manually choosing a type for something they're
// writing themselves.
export const SELECTABLE_PRINCIPLE_TYPES: PrincipleType[] = ["All", "Personal", "Social", "Work", "Finance"];

export interface JournalEntry {
  dateKey: string;
  wentWell: string;
  wentBad: string;
  differently: string;
  learned: string;
  forSomeone: string;
  q5Label: string;
  q5Text: string;
  notes: string;
  // Flagged from the "What new thing did I learn?" prompt — just a marker
  // for now, meant to be picked up by the Principles tab later.
  isPrinciple: boolean;
  principleType: PrincipleType;
}

export interface StaticQuestion {
  key: "wentWell" | "wentBad" | "differently" | "learned" | "forSomeone";
  emoji: string;
  label: string;
  placeholder: string;
}

export const STATIC_QUESTIONS: StaticQuestion[] = [
  {
    key: "wentWell",
    emoji: "☀️",
    label: "What happened today, what went well?",
    placeholder: "Something did. Sit here until you remember what.",
  },
  {
    key: "wentBad",
    emoji: "🌧️",
    label: "What went bad? Is there a pattern?",
    placeholder: "Yes, THAT thing. It's not going away by ignoring it.",
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
  return {
    dateKey,
    wentWell: "",
    wentBad: "",
    differently: "",
    learned: "",
    forSomeone: "",
    q5Label: "",
    q5Text: "",
    notes: "",
    isPrinciple: false,
    principleType: "All",
  };
}

export function isEntryEmpty(entry: JournalEntry): boolean {
  return !(
    entry.wentWell ||
    entry.wentBad ||
    entry.differently ||
    entry.learned ||
    entry.forSomeone ||
    entry.q5Text.trim() ||
    entry.notes.trim() ||
    entry.isPrinciple
  );
}

export function entrySearchText(entry: JournalEntry): string {
  return [entry.wentWell, entry.wentBad, entry.differently, entry.learned, entry.forSomeone, entry.q5Label, entry.q5Text, entry.notes]
    .filter(Boolean)
    .join(" ");
}
