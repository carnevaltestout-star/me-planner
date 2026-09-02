import { defaultProgress, GAME_IDS, type CustomStory, type GameId, type GameProgress, type LearningProgress } from "./learning-types";

// Same localStorage-as-stand-in-for-SQLite pattern as every other feature.
export const LEARNING_STORAGE_KEY = "me-planner:mock-learning";

export interface LearningState {
  progress: LearningProgress;
  customStories: CustomStory[];
}

function normalizeProgress(raw: unknown): LearningProgress {
  const base = defaultProgress();
  if (!raw || typeof raw !== "object") return base;
  const result = { ...base };
  for (const id of GAME_IDS) {
    const p = (raw as Record<string, Partial<GameProgress>>)[id];
    if (p && typeof p === "object") {
      result[id] = {
        level: Number.isFinite(p.level) ? Math.max(1, Math.round(p.level as number)) : 1,
        attempts: Number.isFinite(p.attempts) ? Math.max(0, Math.round(p.attempts as number)) : 0,
        correct: Number.isFinite(p.correct) ? Math.max(0, Math.round(p.correct as number)) : 0,
        lastPlayedAt: typeof p.lastPlayedAt === "string" ? p.lastPlayedAt : "",
      };
    }
  }
  return result;
}

function normalizeCustomStories(raw: unknown): CustomStory[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is CustomStory => Boolean(s) && typeof s.id === "string" && typeof s.text === "string")
    .map((s) => ({
      id: s.id,
      level: Number.isFinite(s.level) ? Math.min(30, Math.max(1, Math.round(s.level))) : 1,
      // Stories saved before names existed fall back to a generic label
      // rather than an empty one, so the picker never shows a blank entry.
      name: typeof s.name === "string" && s.name.trim() ? s.name.trim().slice(0, 60) : "Untitled story",
      text: s.text.slice(0, 1000),
      createdAt: s.createdAt ?? new Date().toISOString(),
    }));
}

function seedState(): LearningState {
  return { progress: defaultProgress(), customStories: [] };
}

export function loadLearningState(): LearningState {
  try {
    const raw = window.localStorage.getItem(LEARNING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        progress: normalizeProgress(parsed.progress),
        customStories: normalizeCustomStories(parsed.customStories),
      };
    }
  } catch {
    // fall through to seed data
  }
  return seedState();
}

export function saveLearningState(state: LearningState) {
  window.localStorage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(state));
}

export function withLevel(state: LearningState, gameId: GameId, level: number): LearningState {
  return { ...state, progress: { ...state.progress, [gameId]: { ...state.progress[gameId], level } } };
}

// Adds to the running totals rather than replacing them — attempts/correct
// are a lifetime tally, not a per-session snapshot. Also re-stamps
// "last trained", though the primary place that happens is now
// withSessionStarted below — see its comment for why relying solely on
// this function to set the date left the two displayed stats able to
// disagree.
export function withRecordedAttempts(state: LearningState, gameId: GameId, attempts: number, correct: number): LearningState {
  const current = state.progress[gameId];
  return {
    ...state,
    progress: {
      ...state.progress,
      [gameId]: {
        ...current,
        attempts: current.attempts + attempts,
        correct: current.correct + correct,
        lastPlayedAt: new Date().toISOString(),
      },
    },
  };
}

// Stamps "last trained" the moment a session/attempt *starts*, not just
// when it finishes. A round only reports attempts/correct via
// withRecordedAttempts once it's over (win or loss), so a build that only
// ever stamped lastPlayedAt there was fine for brand-new plays but left any
// progress saved before this field existed (attempts/correct already
// nonzero, lastPlayedAt missing/"") stuck showing "Last trained: Never"
// right alongside a nonzero attempts/accuracy line — a visibly inconsistent
// pair the user could see immediately. Calling this on start means the
// instant someone begins (or resumes) training, the date is corrected —
// it can never again lag behind the attempts/accuracy counters the way a
// completion-only stamp could.
export function withSessionStarted(state: LearningState, gameId: GameId): LearningState {
  const current = state.progress[gameId];
  return {
    ...state,
    progress: {
      ...state.progress,
      [gameId]: { ...current, lastPlayedAt: new Date().toISOString() },
    },
  };
}
