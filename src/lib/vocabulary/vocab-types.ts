export type Direction = "term-to-meaning" | "meaning-to-term";

// A word's own spaced-repetition bookkeeping — see vocab-srs.ts for how
// these fields get updated.
export interface WordSrs {
  interval: number; // days
  dueDate: string; // dateKey
  mistakeCount: number; // lifetime, never resets — drives session priority
  correctCount: number;
  isNew: boolean;
}

export interface VocabLink {
  id: string;
  url: string;
}

export interface VocabAttachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface VocabWord {
  id: string;
  term: string;
  meaning: string;
  links: VocabLink[];
  attachments: VocabAttachment[];
  srs: WordSrs;
}

export interface TopicResult {
  correct: number;
  wrong: number;
  missedWordIds: string[];
  at: string; // dateKey
}

export interface VocabTopic {
  id: string;
  name: string;
  words: VocabWord[];
  lastResult: TopicResult | null;
  // Topic-wide ("Learning methods") attachments — not tied to a single word.
  attachments: VocabAttachment[];
}

export interface SessionWordRef {
  topicId: string;
  wordId: string;
}

// Exiting mid-session persists this whole shape (see vocab-storage.ts) so
// training can be resumed exactly where it left off.
export interface TrainingSession {
  topicIds: string[];
  direction: Direction;
  wordRefs: SessionWordRef[];
  index: number;
  correct: number;
  wrong: number;
  missed: SessionWordRef[];
}

export interface VocabState {
  topics: VocabTopic[];
  pausedSession: TrainingSession | null;
}

export function newWordSrs(): WordSrs {
  return { interval: 0, dueDate: todayKey(), mistakeCount: 0, correctCount: 0, isNew: true };
}

export function emptyWord(id: string): VocabWord {
  return { id, term: "", meaning: "", links: [], attachments: [], srs: newWordSrs() };
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
