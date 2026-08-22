import { useEffect, useRef, useState } from "react";
import { sampleN, shuffle } from "@/lib/learning/rng";
import { CONSONANT_LETTERS, DIGITS, MEMORY_PICTURES, MEMORY_WORDS } from "@/lib/learning/word-lists";
import GameHeader from "./game-header";
import SegmentedToggle from "./segmented-toggle";

interface ReverseRecallGameProps {
  level: number;
  onLevelChange: (level: number) => void;
  onRoundComplete: (result: { attempts: number; correct: number }) => void;
  onExit: () => void;
}

type Mode = "number" | "letter" | "word" | "picture";
type Variant = "reverse" | "sort";
type Phase = "idle" | "showing" | "answer";

interface RecallItem {
  id: string;
  display: string;
  sortKey: string;
}

function poolFor(mode: Mode): RecallItem[] {
  if (mode === "number") return DIGITS.map((d) => ({ id: `n-${d}`, display: d, sortKey: d }));
  if (mode === "letter") return CONSONANT_LETTERS.map((l) => ({ id: `l-${l}`, display: l, sortKey: l }));
  if (mode === "word") return MEMORY_WORDS.map((w) => ({ id: `w-${w}`, display: w, sortKey: w }));
  return MEMORY_PICTURES.map((p, i) => ({ id: `p-${i}`, display: p, sortKey: MEMORY_WORDS[i] }));
}

function targetOrder(items: RecallItem[], variant: Variant): RecallItem[] {
  if (variant === "reverse") return [...items].reverse();
  return [...items].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

const SHOW_MS = 900;
const GAP_MS = 200;

export default function ReverseRecallGame({ level, onLevelChange, onRoundComplete, onExit }: ReverseRecallGameProps) {
  const [mode, setMode] = useState<Mode>("word");
  const [variant, setVariant] = useState<Variant>("reverse");
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<RecallItem[]>([]);
  const [target, setTarget] = useState<RecallItem[]>([]);
  const [choices, setChoices] = useState<RecallItem[]>([]);
  const [answer, setAnswer] = useState<RecallItem[]>([]);
  const [showIndex, setShowIndex] = useState(-1);
  const [flashId, setFlashId] = useState<{ id: string; kind: "success" | "error" } | null>(null);
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
    setMessage(null);
    setFlashId(null);
    setAnswer([]);
    const length = Math.min(level + 2, poolFor(mode).length);
    const picked = sampleN(poolFor(mode), length);
    setItems(picked);
    setTarget(targetOrder(picked, variant));
    setChoices(shuffle(picked));
    setShowIndex(-1);
    setPhase("showing");

    picked.forEach((_, i) => {
      const onAt = i * (SHOW_MS + GAP_MS);
      timeoutsRef.current.push(
        window.setTimeout(() => setShowIndex(i), onAt),
        window.setTimeout(() => setShowIndex(-1), onAt + SHOW_MS),
      );
    });
    timeoutsRef.current.push(window.setTimeout(() => setPhase("answer"), picked.length * (SHOW_MS + GAP_MS)));
  }

  function handleChipClick(item: RecallItem) {
    if (phase !== "answer") return;
    const expected = target[answer.length];
    if (item.id === expected.id) {
      setFlashId({ id: item.id, kind: "success" });
      window.setTimeout(() => setFlashId(null), 300);
      const nextAnswer = [...answer, item];
      setAnswer(nextAnswer);
      setChoices((c) => c.filter((x) => x.id !== item.id));
      if (nextAnswer.length === target.length) {
        onRoundComplete({ attempts: 1, correct: 1 });
        onLevelChange(level + 1);
        setMessage("Correct! Level up.");
        setWon(true);
        setPhase("idle");
      }
    } else {
      setFlashId({ id: item.id, kind: "error" });
      window.setTimeout(() => setFlashId(null), 350);
      onRoundComplete({ attempts: 1, correct: 0 });
      setMessage(`Not quite — the correct order was ${target.map((t) => t.display).join(", ")}.`);
      setWon(false);
      setPhase("idle");
    }
  }

  const variantLabel = variant === "reverse" ? "reverse order" : "alphabetical order";

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-3 md:p-5">
      <GameHeader title="Reverse Recall" level={level} onLevelChange={onLevelChange} onExit={onExit} />

      <div className="flex flex-col items-center gap-2.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <SegmentedToggle
            value={mode}
            onChange={(m) => phase === "idle" && setMode(m)}
            options={[
              { value: "number", label: "Numbers" },
              { value: "letter", label: "Letters" },
              { value: "word", label: "Words" },
              { value: "picture", label: "Pictures" },
            ]}
          />
          <SegmentedToggle
            value={variant}
            onChange={(v) => phase === "idle" && setVariant(v)}
            options={[
              { value: "reverse", label: "Reverse" },
              { value: "sort", label: "Sort A-Z" },
            ]}
          />
        </div>
        {message && <p className="m-0 text-center text-sm text-ink-muted">{message}</p>}
        {phase === "showing" && <p className="m-0 text-center text-xs text-ink-muted">Memorize the order…</p>}
        {phase === "answer" && (
          <p className="m-0 text-center text-xs text-ink-muted">
            Tap them back in {variantLabel} ({answer.length}/{target.length})
          </p>
        )}
      </div>

      <div className="flex min-h-[4.5rem] items-center justify-center">
        {phase === "showing" && showIndex >= 0 && (
          <span className="text-4xl font-bold text-ink">{items[showIndex]?.display}</span>
        )}
      </div>

      {phase === "answer" && answer.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {answer.map((a) => (
            <span key={a.id} className="rounded-theme-sm border border-accent bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
              {a.display}
            </span>
          ))}
        </div>
      )}

      {phase === "answer" && (
        <div className="mx-auto flex w-full max-w-md flex-wrap justify-center gap-2">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleChipClick(c)}
              className={`rounded-theme border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-ink shadow-theme hover:bg-surface-alt ${
                flashId?.id === c.id && flashId.kind === "success" ? "learning-flash-success border-accent bg-accent-soft" : ""
              } ${flashId?.id === c.id && flashId.kind === "error" ? "learning-flash-error border-[#c22a4d]" : ""}`}
            >
              {c.display}
            </button>
          ))}
        </div>
      )}

      {phase === "idle" && (
        <button
          type="button"
          onClick={startRound}
          className="mx-auto rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          {!items.length ? "Start" : won ? "Next level" : "Try again"}
        </button>
      )}
    </div>
  );
}
