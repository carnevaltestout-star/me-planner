import { useEffect, useRef, useState } from "react";
import { pickRandom } from "@/lib/learning/rng";
import { CONSONANT_LETTERS } from "@/lib/learning/word-lists";
import GameHeader from "./game-header";

interface NBackGameProps {
  level: number;
  onLevelChange: (level: number) => void;
  onRoundComplete: (result: { attempts: number; correct: number }) => void;
  onExit: () => void;
}

type Phase = "idle" | "running" | "result";

const STREAM_LENGTH_BASE = 16;
const MATCH_PROBABILITY = 0.35;
// Speeds up slightly at higher levels, floored so it never becomes
// unreadable.
function intervalMsForLevel(level: number): number {
  return Math.max(1200, 2200 - level * 100);
}

function buildStream(n: number, length: number): string[] {
  const stream: string[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= n && Math.random() < MATCH_PROBABILITY) {
      stream.push(stream[i - n]);
    } else {
      stream.push(pickRandom(CONSONANT_LETTERS));
    }
  }
  return stream;
}

export default function NBackGame({ level, onLevelChange, onRoundComplete, onExit }: NBackGameProps) {
  const [adaptive, setAdaptive] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stream, setStream] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [flash, setFlash] = useState<"success" | "error" | null>(null);
  const [result, setResult] = useState<{ hits: number; falseAlarms: number; misses: number; total: number; accuracy: number } | null>(null);
  const respondedRef = useRef<boolean[]>([]);
  const hitsRef = useRef(0);
  const falseAlarmsRef = useRef(0);
  const missesRef = useRef(0);
  const correctRejectionsRef = useRef(0);
  const intervalRef = useRef<number>();

  useEffect(() => () => window.clearInterval(intervalRef.current), []);

  function finishTrial(index: number, stream_: string[]) {
    const isMatch = index >= level && stream_[index] === stream_[index - level];
    const responded = respondedRef.current[index];
    if (isMatch && responded) hitsRef.current += 1;
    else if (isMatch && !responded) missesRef.current += 1;
    else if (!isMatch && responded) falseAlarmsRef.current += 1;
    else correctRejectionsRef.current += 1;
  }

  function startRound() {
    const length = STREAM_LENGTH_BASE + level * 2;
    const s = buildStream(level, length);
    setStream(s);
    respondedRef.current = new Array(length).fill(false);
    hitsRef.current = 0;
    falseAlarmsRef.current = 0;
    missesRef.current = 0;
    correctRejectionsRef.current = 0;
    setResult(null);
    setCurrentIndex(0);
    setPhase("running");

    let index = 0;
    intervalRef.current = window.setInterval(() => {
      finishTrial(index, s);
      index += 1;
      if (index >= s.length) {
        window.clearInterval(intervalRef.current);
        const trialsWithJudgment = s.length - level;
        const correct = hitsRef.current + correctRejectionsRef.current;
        const accuracy = trialsWithJudgment > 0 ? Math.round((correct / trialsWithJudgment) * 100) : 100;
        onRoundComplete({ attempts: trialsWithJudgment, correct });
        if (adaptive && accuracy >= 85) onLevelChange(level + 1);
        setResult({ hits: hitsRef.current, falseAlarms: falseAlarmsRef.current, misses: missesRef.current, total: trialsWithJudgment, accuracy });
        setCurrentIndex(-1);
        setPhase("result");
        return;
      }
      setCurrentIndex(index);
    }, intervalMsForLevel(level));
  }

  function handleMatchTap() {
    if (phase !== "running" || currentIndex < level || respondedRef.current[currentIndex]) return;
    respondedRef.current[currentIndex] = true;
    const isMatch = stream[currentIndex] === stream[currentIndex - level];
    setFlash(isMatch ? "success" : "error");
    window.setTimeout(() => setFlash(null), 300);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        handleMatchTap();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex, stream, level]);

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-3 md:p-5">
      <GameHeader title="N-Back" level={level} onLevelChange={onLevelChange} onExit={onExit} />

      <div className="flex flex-col items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-muted">
          <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
          Adaptive difficulty (auto level-up at 85%+ accuracy)
        </label>
        <p className="m-0 text-center text-xs text-ink-muted">
          Tap Match (or press Space) whenever the letter matches the one {level} step{level === 1 ? "" : "s"} back.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        {phase === "running" && currentIndex >= 0 && (
          <span className="flex h-28 w-28 items-center justify-center rounded-theme border border-border bg-surface text-5xl font-bold text-ink shadow-theme">
            {stream[currentIndex]}
          </span>
        )}

        {phase === "running" && (
          <button
            type="button"
            onClick={handleMatchTap}
            disabled={currentIndex < level}
            className={`rounded-theme border border-accent bg-accent px-8 py-3 text-sm font-semibold text-accent-contrast hover:brightness-105 disabled:cursor-default disabled:opacity-40 ${
              flash === "success" ? "learning-flash-success" : ""
            } ${flash === "error" ? "learning-flash-error" : ""}`}
          >
            Match
          </button>
        )}

        {phase === "result" && result && (
          <div className="flex flex-col items-center gap-2">
            <p className="m-0 text-lg font-bold text-ink">{result.accuracy}% accuracy</p>
            <p className="m-0 text-xs text-ink-muted">
              {result.hits} hits · {result.misses} missed · {result.falseAlarms} false alarms
            </p>
            {result.accuracy >= 85 && <p className="m-0 text-sm text-accent">Great run{adaptive ? " — level up!" : "!"}</p>}
          </div>
        )}

        {phase === "idle" || phase === "result" ? (
          <button
            type="button"
            onClick={startRound}
            className="rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            {phase !== "result" ? "Start" : adaptive && (result?.accuracy ?? 0) >= 85 ? "Next level" : "Try again"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
