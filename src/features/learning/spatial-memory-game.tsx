import { useEffect, useRef, useState } from "react";
import { sampleN } from "@/lib/learning/rng";
import GameHeader from "./game-header";

interface SpatialMemoryGameProps {
  level: number;
  onLevelChange: (level: number) => void;
  onRoundComplete: (result: { attempts: number; correct: number }) => void;
  onExit: () => void;
}

type Phase = "idle" | "showing" | "input" | "reveal";

// Grid grows every few levels, positions-to-remember every level — kept
// comfortably below the grid's total cell count so the puzzle stays
// solvable-by-eye rather than needing to fill almost the whole board.
// Levels 1-10 top out at 6x6 (4x4 for 1-3, 5x5 for 4-7, 6x6 for 8-10); past
// that the grid itself keeps growing — 7x7 for 11-17, 8x8 for 18-23, 9x9 for
// 24-27, 10x10 for 28-30 — rather than just packing more lit cells into a
// fixed-size board, since a denser subset of a small board starts to feel
// like "most of the grid is lit" instead of a genuine spatial-span task.
// Levels 1-20 are unchanged from before this 21-30 tier was added.
function gridSizeForLevel(level: number): number {
  if (level <= 3) return 4;
  if (level <= 7) return 5;
  if (level <= 10) return 6;
  if (level <= 17) return 7;
  if (level <= 23) return 8;
  if (level <= 27) return 9;
  return 10;
}
function positionCountForLevel(level: number): number {
  const size = gridSizeForLevel(level);
  return Math.min(level + 2, size * size - 3);
}

const SHOW_MS = 1500;

export default function SpatialMemoryGame({ level, onLevelChange, onRoundComplete, onExit }: SpatialMemoryGameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [gridSize, setGridSize] = useState(() => gridSizeForLevel(level));
  const [target, setTarget] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const revealTimeoutRef = useRef<number>();

  useEffect(() => () => window.clearTimeout(revealTimeoutRef.current), []);

  function startRound() {
    window.clearTimeout(revealTimeoutRef.current);
    const size = gridSizeForLevel(level);
    setGridSize(size);
    const positions = sampleN(
      Array.from({ length: size * size }, (_, i) => i),
      positionCountForLevel(level),
    );
    setTarget(new Set(positions));
    setSelected(new Set());
    setMessage(null);
    setPhase("showing");
    revealTimeoutRef.current = window.setTimeout(() => setPhase("input"), SHOW_MS);
  }

  // Aborts the round in progress and immediately deals a fresh one at the
  // same level — pending reveal timer cleared, no onRoundComplete call, so
  // it never touches accuracy stats or the level. Not a "loss", just a redo.
  function restartRound() {
    startRound();
  }

  function toggleCell(index: number) {
    if (phase !== "input") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function submit() {
    if (phase !== "input") return;
    const isCorrect = selected.size === target.size && [...selected].every((i) => target.has(i));
    onRoundComplete({ attempts: 1, correct: isCorrect ? 1 : 0 });
    setWon(isCorrect);
    if (isCorrect) onLevelChange(level + 1);
    setMessage(isCorrect ? "Correct! Level up." : `Not quite — ${target.size} cells were lit.`);
    setPhase("reveal");
    revealTimeoutRef.current = window.setTimeout(() => setPhase("idle"), 1400);
  }

  function cellClass(index: number): string {
    if (phase === "showing") return target.has(index) ? "border-accent bg-accent text-accent-contrast" : "border-border bg-surface";
    if (phase === "reveal") {
      const inTarget = target.has(index);
      const wasSelected = selected.has(index);
      if (inTarget && wasSelected) return "learning-flash-success border-accent bg-accent-soft";
      if (inTarget && !wasSelected) return "border-[#d99a3d] bg-[color-mix(in_srgb,#d99a3d_18%,var(--color-surface))]";
      if (!inTarget && wasSelected) return "learning-flash-error border-[#c22a4d] bg-[color-mix(in_srgb,#c22a4d_12%,var(--color-surface))]";
      return "border-border bg-surface";
    }
    return selected.has(index) ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-alt";
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-3 md:p-5">
      <GameHeader
        title="Spatial Memory"
        level={level}
        onLevelChange={onLevelChange}
        onExit={onExit}
        onRestart={phase === "showing" || phase === "input" ? restartRound : undefined}
      />

      <div className="flex flex-col items-center gap-2">
        {message && <p className={`m-0 text-center text-sm ${won ? "text-accent" : "text-ink-muted"}`}>{message}</p>}
        {phase === "showing" && <p className="m-0 text-center text-xs text-ink-muted">Memorize the lit cells…</p>}
        {phase === "input" && (
          <p className="m-0 text-center text-xs text-ink-muted">
            Select the {target.size} cells that lit up ({selected.size} chosen)
          </p>
        )}
      </div>

      <div
        className="mx-auto grid w-full gap-2"
        // max-width scales with grid size so cells at 7x7/8x8 (levels 11-20)
        // don't shrink more than necessary on wide screens; on narrow
        // screens `w-full` still wins and the grid just fits the viewport.
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, maxWidth: `${Math.max(340, gridSize * 48)}px` }}
      >
        {Array.from({ length: gridSize * gridSize }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={phase !== "input"}
            onClick={() => toggleCell(i)}
            className={`aspect-square rounded-theme-sm border shadow-theme transition-colors disabled:cursor-default ${cellClass(i)}`}
          />
        ))}
      </div>

      {phase === "input" && (
        <button
          type="button"
          onClick={submit}
          disabled={selected.size === 0}
          className="mx-auto rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105 disabled:cursor-default disabled:opacity-50"
        >
          Submit
        </button>
      )}

      {phase === "idle" && (
        <button
          type="button"
          onClick={startRound}
          className="mx-auto rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          {!target.size ? "Start" : won ? "Next level" : "Try again"}
        </button>
      )}
    </div>
  );
}
