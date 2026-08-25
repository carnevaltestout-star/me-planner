import type { ReactNode } from "react";
import LevelPicker from "./level-picker";

interface GameHeaderProps {
  title: string;
  level: number;
  onLevelChange: (level: number) => void;
  onExit: () => void;
  extra?: ReactNode;
}

// Shared by every game screen — back button, title, and the level picker in
// the same spot every time (the picker also lives on each game's entry
// card on the main Learning list; having it here too means it never
// requires leaving the game to bump the difficulty between rounds).
export default function GameHeader({ title, level, onLevelChange, onExit, extra }: GameHeaderProps) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onExit}
        aria-label="Back to Brain & Training"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-alt"
      >
        ←
      </button>
      <h2 className="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-ink sm:text-base">{title}</h2>
      {extra}
      <LevelPicker level={level} onChange={onLevelChange} />
    </div>
  );
}
