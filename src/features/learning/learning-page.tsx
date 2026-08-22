import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { loadLearningState, saveLearningState, withLevel, withRecordedAttempts, type LearningState } from "@/lib/learning/learning-storage";
import { accuracyPercent, type GameId } from "@/lib/learning/learning-types";
import LevelPicker from "./level-picker";
import { NBackIcon, ReverseRecallIcon, SequenceMemoryIcon, SpatialMemoryIcon, StoryMemoryIcon } from "./learning-icons";
import SequenceMemoryGame from "./sequence-memory-game";
import ReverseRecallGame from "./reverse-recall-game";
import StoryMemoryGame from "./story-memory-game";
import SpatialMemoryGame from "./spatial-memory-game";
import NBackGame from "./n-back-game";

interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const GAMES: GameMeta[] = [
  { id: "sequence-memory", title: "Sequence Memory", description: "Watch the sequence, then tap it back in order.", icon: SequenceMemoryIcon },
  { id: "reverse-recall", title: "Reverse Recall", description: "Memorize the list, then rebuild it reversed or sorted.", icon: ReverseRecallIcon },
  { id: "story-memory", title: "Story Memory", description: "Read a short story, wait it out, then answer questions.", icon: StoryMemoryIcon },
  { id: "spatial-memory", title: "Spatial Memory", description: "Remember which cells lit up all at once.", icon: SpatialMemoryIcon },
  { id: "n-back", title: "N-Back", description: "Tap when the current letter matches N steps back.", icon: NBackIcon },
];

// Every game lives inside this one tab as a local-state "detail view" (same
// pattern as e.g. Goals/To-Dos' Done list) rather than its own route — the
// level picker on each entry card is the one consistent place difficulty
// gets set before playing, per the spec's "placed consistently next to the
// game entry point."
export default function LearningPage() {
  const [state, setState] = useState<LearningState>(() => loadLearningState());
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  // Persisted as a side effect of state changing, not inline with each
  // update — a win fires onRoundComplete *and* onLevelChange back to back
  // in the same synchronous handler; updating via plain setState(newState)
  // from each one independently meant the second call built its update off
  // the same pre-render `state` the first one did, so its setState silently
  // overwrote the first update instead of composing with it (attempts/
  // accuracy would never actually move on a win). Functional setState
  // updates fix that — each one is guaranteed to see the other's result.
  useEffect(() => saveLearningState(state), [state]);

  function setLevel(id: GameId, level: number) {
    setState((prev) => withLevel(prev, id, level));
  }

  function recordAttempts(id: GameId, attempts: number, correct: number) {
    setState((prev) => withRecordedAttempts(prev, id, attempts, correct));
  }

  function addCustomStory(level: number, text: string) {
    setState((prev) => ({
      ...prev,
      customStories: [...prev.customStories, { id: crypto.randomUUID(), level, text, createdAt: new Date().toISOString() }],
    }));
  }

  if (activeGame) {
    const level = state.progress[activeGame].level;
    const shared = {
      level,
      onLevelChange: (l: number) => setLevel(activeGame, l),
      onRoundComplete: ({ attempts, correct }: { attempts: number; correct: number }) => recordAttempts(activeGame, attempts, correct),
      onExit: () => setActiveGame(null),
    };
    switch (activeGame) {
      case "sequence-memory":
        return <SequenceMemoryGame {...shared} />;
      case "reverse-recall":
        return <ReverseRecallGame {...shared} />;
      case "story-memory":
        return <StoryMemoryGame {...shared} customStories={state.customStories} onAddCustomStory={addCustomStory} />;
      case "spatial-memory":
        return <SpatialMemoryGame {...shared} />;
      case "n-back":
        return <NBackGame {...shared} />;
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3 md:p-5">
      <h1 className="m-0 text-base font-semibold text-ink">Brain Training</h1>
      <p className="m-0 -mt-2 text-sm text-ink-muted">Five quick cognitive training games. Pick a level, then play.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GAMES.map((g) => {
          const progress = state.progress[g.id];
          const Icon = g.icon;
          return (
            <div key={g.id} className="flex flex-col gap-3 rounded-theme border border-border bg-surface p-4 shadow-theme">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-theme-sm bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-sm font-semibold text-ink">{g.title}</h3>
                  <p className="m-0 text-xs text-ink-muted">{g.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <LevelPicker level={progress.level} onChange={(l) => setLevel(g.id, l)} />
                <span className="text-[0.68rem] text-ink-muted">
                  {progress.attempts} attempts · {accuracyPercent(progress)}% accuracy
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveGame(g.id)}
                className="rounded-theme border border-accent bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
              >
                ▶ Play
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
