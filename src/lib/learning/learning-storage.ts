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
      level: Number.isFinite(s.level) ? Math.min(20, Math.max(1, Math.round(s.level))) : 1,
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
// are a lifetime tally, not a per-session snapshot. Called once per played
// round/session for every game, so it's also the right place to stamp
// "last trained."
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
