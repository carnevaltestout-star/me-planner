import { useEffect, useRef, useState } from "react";
import { sampleN, sampleWithRepeats, shuffle } from "@/lib/learning/rng";
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
  // Unique per on-screen occurrence this round (see buildRoundItems) — used
  // for React keys and for removing exactly the chip that was tapped.
  id: string;
  // Canonical identity of the underlying digit/letter/word/picture, shared
  // by every occurrence of the same value in a round. Answer-matching checks
  // THIS, not `id`, so once a round has repeats (see buildRoundItems) two
  // on-screen chips showing the same value are correctly interchangeable —
  // the player can tap either "5" when the target calls for "5" next.
  valueId: string;
  display: string;
  sortKey: string;
}

function poolFor(mode: Mode): RecallItem[] {
  if (mode === "number") return DIGITS.map((d) => ({ id: `n-${d}`, valueId: `n-${d}`, display: d, sortKey: d }));
  if (mode === "letter") return CONSONANT_LETTERS.map((l) => ({ id: `l-${l}`, valueId: `l-${l}`, display: l, sortKey: l }));
  if (mode === "word") return MEMORY_WORDS.map((w) => ({ id: `w-${w}`, valueId: `w-${w}`, display: w, sortKey: w }));
  return MEMORY_PICTURES.map((p, i) => ({ id: `p-${i}`, valueId: `p-${i}`, display: p, sortKey: MEMORY_WORDS[i] }));
}

// Builds this round's item sequence. `length` is allowed to exceed the
// mode's pool size — digits (10 values) and, even after growing to all 21
// real consonants, letters near level 20 are finite alphabets that eventually
// run out of unique symbols. Rather than plateau forever at "the pool's
// size" once that happens (numbers capped at level 8, letters at level 13
// before CONSONANT_LETTERS was widened), we top up past the pool size by
// SAMPLING WITH REPLACEMENT — the standard way memory-span tasks add
// difficulty once they exhaust their alphabet: the player can no longer
// assume every value appears once and has to track which occurrence of a
// repeated value belongs where. Word/picture pools (36 items) don't need
// this until level 34+, past this game's level cap of 30, but the same
// function is used for every mode for consistency and future headroom.
function buildRoundItems(mode: Mode, length: number): RecallItem[] {
  const pool = poolFor(mode);
  const unique = sampleN(pool, Math.min(length, pool.length));
  const overflow = length > pool.length ? sampleWithRepeats(pool, length - pool.length) : [];
  // Instance ids are assigned after shuffling everything together so repeats
  // land at random positions in the sequence rather than clumped at the end.
  return shuffle([...unique, ...overflow]).map((item, i) => ({ ...item, id: `${item.id}#${i}` }));
}

function targetOrder(items: RecallItem[], variant: Variant): RecallItem[] {
  if (variant === "reverse") return [...items].reverse();
  // Array.prototype.sort is stable (guaranteed since ES2019), so when a
  // round has repeats and two items share a sortKey, they keep their
  // original relative order here instead of landing in an arbitrary spot —
  // otherwise "sort A-Z" would have no well-defined answer for ties.
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
    const length = level + 2;
    const picked = buildRoundItems(mode, length);
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
    if (item.valueId === expected.valueId) {
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

  // Aborts the round in progress and immediately deals a fresh one at the
  // same level/mode/variant — startRound() already does exactly that (clears
  // pending reveal timeouts first, then re-rolls via buildRoundItems). It
  // never touches onRoundComplete, so bailing out mid-round doesn't count as
  // a completed attempt or affect accuracy stats.
  function handleRestart() {
    startRound();
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-3 md:p-5">
      <GameHeader title="Reverse Recall" level={level} onLevelChange={onLevelChange} onExit={onExit} onRestart={handleRestart} />

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
