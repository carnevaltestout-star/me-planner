export type GameId = "sequence-memory" | "reverse-recall" | "story-memory" | "spatial-memory" | "n-back";

export const GAME_IDS: GameId[] = ["sequence-memory", "reverse-recall", "story-memory", "spatial-memory", "n-back"];

// "attempts"/"correct" mean slightly different units per game (a whole
// round for Sequence/Spatial/Reverse Recall, one quiz question for Story
// Memory, one trial for N-Back) — each game decides what counts as one unit
// for itself; accuracy = correct / attempts is comparable across all of them
// regardless of what the unit is.
export interface GameProgress {
  level: number;
  attempts: number;
  correct: number;
  lastPlayedAt: string; // ISO timestamp, "" if never played
}

export type LearningProgress = Record<GameId, GameProgress>;

export function emptyProgress(level = 1): GameProgress {
  return { level, attempts: 0, correct: 0, lastPlayedAt: "" };
}

export function defaultProgress(): LearningProgress {
  return {
    "sequence-memory": emptyProgress(),
    "reverse-recall": emptyProgress(),
    "story-memory": emptyProgress(),
    "spatial-memory": emptyProgress(),
    "n-back": emptyProgress(),
  };
}

export function accuracyPercent(p: GameProgress): number {
  return p.attempts === 0 ? 0 : Math.round((p.correct / p.attempts) * 100);
}

export interface CustomStory {
  id: string;
  level: number;
  text: string;
  createdAt: string;
}
