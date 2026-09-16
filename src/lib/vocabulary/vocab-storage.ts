import {
  addDaysToKey,
  newWordSrs,
  todayKey,
  type Direction,
  type VocabAttachment,
  type VocabLink,
  type VocabState,
  type VocabTopic,
  type VocabWord,
} from "./vocab-types";

// Same localStorage-as-stand-in-for-SQLite pattern as the other features.
export const VOCAB_STORAGE_KEY = "me-planner:mock-vocabulary";

// Which topic (if any) is currently open on the Topic Edit page — kept
// separate from VOCAB_STORAGE_KEY since it's UI navigation state, not data.
// Reloading the page while inside a topic should land back in that same
// topic instead of bouncing to the topic list.
export const VOCAB_UI_STORAGE_KEY = "me-planner:vocab-ui";

export interface VocabUiState {
  editingTopicId: string | null;
  // The direction a new training session starts in by default (the topic
  // list's own toggle sets this) — Mixed Training's dialog defaults to
  // whatever this is too, though it can still override it per-session.
  defaultDirection: Direction;
}

export function loadVocabUiState(): VocabUiState {
  try {
    const raw = window.localStorage.getItem(VOCAB_UI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          editingTopicId: parsed.editingTopicId ?? null,
          defaultDirection: parsed.defaultDirection === "meaning-to-term" ? "meaning-to-term" : "term-to-meaning",
        };
      }
    }
  } catch {
    // fall through to default
  }
  return { editingTopicId: null, defaultDirection: "term-to-meaning" };
}

// Merges into whatever's already stored rather than requiring every call
// site to restate the full object — most callers only ever change one field
// (editingTopicId on navigation, defaultDirection from the topic list toggle).
export function saveVocabUiState(patch: Partial<VocabUiState>) {
  window.localStorage.setItem(VOCAB_UI_STORAGE_KEY, JSON.stringify({ ...loadVocabUiState(), ...patch }));
}

function word(id: string, term: string, meaning: string, srsOverrides?: Partial<VocabWord["srs"]>): VocabWord {
  return { id, term, meaning, links: [], attachments: [], srs: { ...newWordSrs(), ...srsOverrides } };
}

function seedState(): VocabState {
  const today = todayKey();
  const spanishWords = [
    word("sp-1", "hola", "hello — casual greeting", { isNew: false, interval: 4, dueDate: today, correctCount: 3, mistakeCount: 2 }),
    word("sp-2", "gracias", "thank you", { isNew: false, interval: 8, dueDate: addDaysToKey(today, 3), correctCount: 4, mistakeCount: 0 }),
    word("sp-3", "adiós", "goodbye", { isNew: false, interval: 1, dueDate: today, correctCount: 1, mistakeCount: 3 }),
    word("sp-4", "por favor", 'please\ne.g. "Un café, por favor" — a coffee, please', {
      isNew: false,
      interval: 2,
      dueDate: today,
      correctCount: 2,
      mistakeCount: 1,
    }),
    word("sp-5", "sí", "yes"),
    word("sp-6", "no", "no"),
  ];
  const topics: VocabTopic[] = [
    {
      id: "topic-spanish",
      name: "Spanish Basics",
      words: spanishWords,
      lastResult: {
        correct: 4,
        wrong: 2,
        missedWordIds: [spanishWords[2].id, spanishWords[3].id],
        at: addDaysToKey(today, -1),
      },
      attachments: [],
    },
    {
      id: "topic-js",
      name: "JavaScript Terms",
      words: [
        word("js-1", "closure", "a function that remembers the variables from where it was created, even after that scope has exited"),
        word("js-2", "hoisting", "variable/function declarations are moved to the top of their scope before code runs"),
        word("js-3", "promise", "an object representing eventual completion (or failure) of an async operation"),
        word("js-4", "callback", "a function passed into another function to be run later"),
        word("js-5", "debounce", "delay running a function until a burst of calls has stopped for a set time"),
      ],
      lastResult: null,
      attachments: [],
    },
    {
      id: "topic-idioms",
      name: "Business Idioms",
      words: [
        word("bi-1", "low-hanging fruit", "the easiest wins to go after first"),
        word("bi-2", "circle back", "revisit a topic later"),
        word("bi-3", "move the needle", "make a meaningful, measurable difference"),
        word("bi-4", "boil the ocean", "attempt something needlessly huge/impossible in scope"),
      ],
      lastResult: null,
      attachments: [],
    },
  ];
  return { topics, pausedSession: null };
}

function normalizeAttachments(value: unknown): VocabAttachment[] {
  return Array.isArray(value) ? (value as VocabAttachment[]) : [];
}

function normalizeLinks(value: unknown): VocabLink[] {
  return Array.isArray(value) ? (value as VocabLink[]) : [];
}

function normalizeWord(raw: VocabWord): VocabWord {
  return {
    ...raw,
    links: normalizeLinks(raw.links),
    attachments: normalizeAttachments(raw.attachments),
  };
}

// Fills in fields added after a topic/word may have already been saved,
// same reasoning as every other feature's storage normalize.
function normalize(raw: VocabState): VocabState {
  return {
    topics: Array.isArray(raw.topics)
      ? raw.topics.map((t) => ({
          ...t,
          attachments: normalizeAttachments(t.attachments),
          words: Array.isArray(t.words) ? t.words.map(normalizeWord) : [],
        }))
      : [],
    pausedSession: raw.pausedSession ?? null,
  };
}

export function loadVocabState(): VocabState {
  try {
    const raw = window.localStorage.getItem(VOCAB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return normalize(parsed as VocabState);
    }
  } catch {
    // fall through to seed data
  }
  return seedState();
}

// Attachments are stored as base64 data URLs directly in this blob, so
// unlike every other feature's save, this one can realistically hit
// localStorage's quota — surface that instead of silently losing the write.
export function saveVocabState(state: VocabState) {
  try {
    window.localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(state));
  } catch {
    window.alert("Couldn't save — storage is full. Try removing an attachment and saving again.");
  }
}
