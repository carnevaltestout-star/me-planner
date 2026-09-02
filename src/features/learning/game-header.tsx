import type { ReactNode } from "react";
import LevelPicker from "./level-picker";

interface GameHeaderProps {
  title: string;
  level: number;
  onLevelChange: (level: number) => void;
  onExit: () => void;
  extra?: ReactNode;
  // Resets the round in progress back to a fresh start at the same level —
  // optional since not every screen has a "round" to restart (e.g. the
  // Learning list itself doesn't use GameHeader at all, and a game between
  // rounds may choose to hide it). Absolutely centered over the header
  // regardless of how wide the title/level-picker are, so it reads as "top
  // center" of the game screen rather than just another item in the row.
  onRestart?: () => void;
}

// Shared by every game screen — back button, title, and the level picker in
// the same spot every time (the picker also lives on each game's entry
// card on the main Learning list; having it here too means it never
// requires leaving the game to bump the difficulty between rounds).
export default function GameHeader({ title, level, onLevelChange, onExit, extra, onRestart }: GameHeaderProps) {
  return (
    <div className="relative flex flex-shrink-0 flex-wrap items-center gap-2">
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
      {onRestart && (
        <button
          type="button"
          onClick={onRestart}
          aria-label="Restart this level"
          title="Restart this level"
          className="absolute left-1/2 top-1/2 flex h-8 w-8 flex-shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-theme hover:bg-surface-alt hover:text-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
        </button>
      )}
    </div>
  );
}
