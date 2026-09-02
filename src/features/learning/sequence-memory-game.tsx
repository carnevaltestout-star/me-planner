import { useEffect, useRef, useState } from "react";
import { sampleN, sampleWithRepeats } from "@/lib/learning/rng";
import { MEMORY_WORDS } from "@/lib/learning/word-lists";
import GameHeader from "./game-header";
import SegmentedToggle from "./segmented-toggle";

interface SequenceMemoryGameProps {
  level: number;
  onLevelChange: (level: number) => void;
  onRoundComplete: (result: { attempts: number; correct: number }) => void;
  onSessionStart: () => void;
  onExit: () => void;
}

type Phase = "idle" | "showing" | "input";
type Mode = "visual" | "word";

const GRID_SIZE = 9; // 3x3 — see spec's "3x3 or 4x4" allowance
const CELL_INDEXES = Array.from({ length: GRID_SIZE }, (_, i) => i);
const FLASH_MS = 550;
const GAP_MS = 250;
const PRESS_MS = 200; // how long a user-tapped tile stays lit — see handleCellClick

export default function SequenceMemoryGame({ level, onLevelChange, onRoundComplete, onSessionStart, onExit }: SequenceMemoryGameProps) {
  const [mode, setMode] = useState<Mode>("visual");
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [pressedCell, setPressedCell] = useState<number | null>(null);
  const [userIndex, setUserIndex] = useState(0);
  const [flash, setFlash] = useState<{ index: number; kind: "success" | "error" } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  function clearTimeouts() {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  }
  useEffect(() => clearTimeouts, []);

  function startRound() {
    clearTimeouts();
    onSessionStart();
    setMessage(null);
    setFlash(null);
    setPressedCell(null);
    const length = level + 2;
    const seq = sampleWithRepeats(CELL_INDEXES, length);
    setSequence(seq);
    setWords(mode === "word" ? sampleN(MEMORY_WORDS, GRID_SIZE) : []);
    setUserIndex(0);
    setActiveCell(null);
    setPhase("showing");

    seq.forEach((cellIndex, i) => {
      const onAt = i * (FLASH_MS + GAP_MS);
      timeoutsRef.current.push(
        window.setTimeout(() => setActiveCell(cellIndex), onAt),
        window.setTimeout(() => setActiveCell(null), onAt + FLASH_MS),
      );
    });
    timeoutsRef.current.push(window.setTimeout(() => setPhase("input"), seq.length * (FLASH_MS + GAP_MS)));
  }

  // Aborts the round in progress and immediately starts a fresh one at the
  // same level — reuses startRound() as-is (same content-generation logic,
  // same timeout-clearing) so this can never diverge from a normal round
  // start. Crucially it never touches onRoundComplete, so bailing out
  // mid-sequence doesn't count as a failed attempt.
  function handleRestart() {
    startRound();
  }

  function handleCellClick(index: number) {
    if (phase !== "input") return;
    // Light the tapped tile the same way playback highlights it, so the
    // user gets immediate, unambiguous confirmation of which tile
    // registered — independent of (and a beat before) the success/error
    // flash below, which only shows once correctness is known.
    setPressedCell(index);
    timeoutsRef.current.push(window.setTimeout(() => setPressedCell(null), PRESS_MS));
    const expected = sequence[userIndex];
    if (index === expected) {
      setFlash({ index, kind: "success" });
      window.setTimeout(() => setFlash(null), 300);
      const nextIndex = userIndex + 1;
      if (nextIndex === sequence.length) {
        onRoundComplete({ attempts: 1, correct: 1 });
        onLevelChange(level + 1);
        setMessage("Correct! Level up.");
        setWon(true);
        setPhase("idle");
      } else {
        setUserIndex(nextIndex);
      }
    } else {
      setFlash({ index, kind: "error" });
      window.setTimeout(() => setFlash(null), 350);
      onRoundComplete({ attempts: 1, correct: 0 });
      setMessage(`Not quite — the sequence was ${sequence.length} steps long.`);
      setWon(false);
      setPhase("idle");
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-3 md:p-5">
      <GameHeader
        title="Sequence Memory"
        level={level}
        onLevelChange={onLevelChange}
        onExit={onExit}
        onRestart={phase !== "idle" ? handleRestart : undefined}
      />

      <div className="flex flex-col items-center gap-3">
        <SegmentedToggle
          value={mode}
          onChange={(m) => {
            if (phase === "idle") setMode(m);
          }}
          options={[
            { value: "visual", label: "Visual" },
            { value: "word", label: "Words" },
          ]}
        />
        {message && <p className="m-0 text-center text-sm text-ink-muted">{message}</p>}
        {phase === "showing" && <p className="m-0 text-center text-xs text-ink-muted">Watch closely…</p>}
        {phase === "input" && (
          <p className="m-0 text-center text-xs text-ink-muted">
            Your turn — step {userIndex + 1} of {sequence.length}
          </p>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-2.5">
        {CELL_INDEXES.map((i) => {
          const isActive = activeCell === i || pressedCell === i;
          const cellFlash = flash?.index === i ? flash.kind : null;
          return (
            <button
              key={i}
              type="button"
              disabled={phase !== "input"}
              onClick={() => handleCellClick(i)}
              className={`flex aspect-square items-center justify-center rounded-theme border px-1 text-center text-[0.7rem] font-semibold text-ink shadow-theme transition-colors disabled:cursor-default ${
                isActive ? "border-accent bg-accent text-accent-contrast" : "border-border bg-surface"
              } ${cellFlash === "success" ? "learning-flash-success border-accent bg-accent-soft" : ""} ${
                cellFlash === "error" ? "learning-flash-error border-[#c22a4d]" : ""
              }`}
              style={cellFlash === "error" ? { background: "color-mix(in srgb, #c22a4d 15%, var(--color-surface))" } : undefined}
            >
              {mode === "word" ? words[i] : ""}
            </button>
          );
        })}
      </div>

      {phase === "idle" && (
        <button
          type="button"
          onClick={startRound}
          className="mx-auto rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          {!sequence.length ? "Start" : won ? "Next level" : "Try again"}
        </button>
      )}
    </div>
  );
}
