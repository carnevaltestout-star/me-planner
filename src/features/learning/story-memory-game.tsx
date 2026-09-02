import { useEffect, useRef, useState } from "react";
import { extractFactsFromCustomText, generateStory, pickQuizFacts, type RecallFact } from "@/lib/learning/story-content";
import type { CustomStory } from "@/lib/learning/learning-types";
import GameHeader from "./game-header";
import StoryUploadDialog from "./story-upload-dialog";

interface StoryMemoryGameProps {
  level: number;
  onLevelChange: (level: number) => void;
  onRoundComplete: (result: { attempts: number; correct: number }) => void;
  onExit: () => void;
  customStories: CustomStory[];
  onAddCustomStory: (level: number, name: string, text: string) => string;
}

type Phase = "idle" | "reading" | "distraction" | "quiz" | "result";

const DISTRACTION_S = 30;

export default function StoryMemoryGame({ level, onLevelChange, onRoundComplete, onExit, customStories, onAddCustomStory }: StoryMemoryGameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("built-in");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [quizFacts, setQuizFacts] = useState<RecallFact[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [pickedChoice, setPickedChoice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [distractionTotal, setDistractionTotal] = useState(DISTRACTION_S);
  const intervalRef = useRef<number>();
  // Tracks the "reveal" timeout that handleAnswer schedules between picking
  // an answer and advancing to the next question — if restart fires while
  // one of these is pending, it must be cancelled too, or it'll go off
  // against the freshly-restarted round's state (stale quizIndex/quizFacts
  // closed over from before the restart) and can even fire onRoundComplete
  // for a round the player just aborted.
  const answerTimeoutRef = useRef<number>();

  const levelStories = customStories.filter((s) => s.level === level);

  useEffect(
    () => () => {
      window.clearInterval(intervalRef.current);
      window.clearTimeout(answerTimeoutRef.current);
    },
    [],
  );

  // Aborts the round in progress and immediately starts a fresh one at the
  // same level. Clears both kinds of pending round timer first (the
  // distraction countdown interval and any in-flight answer-reveal
  // timeout) before handing off to startRound() — which supplies the same
  // content-generation logic a normal round start uses — so nothing left
  // over from the aborted round can fire later. Never touches
  // onRoundComplete, so this doesn't count as a completed/failed attempt.
  function handleRestart() {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(answerTimeoutRef.current);
    startRound();
  }

  function startRound() {
    const chosen = selectedStoryId === "built-in" ? null : levelStories.find((s) => s.id === selectedStoryId);
    const { text, facts } = chosen ? { text: chosen.text, facts: extractFactsFromCustomText(chosen.text) } : generateStory(level);
    setStoryText(text);
    setQuizFacts(pickQuizFacts(facts));
    setQuizIndex(0);
    setQuizCorrect(0);
    setPickedChoice(null);
    setPhase("reading");
  }

  function beginDistraction() {
    setDistractionTotal(DISTRACTION_S);
    setSecondsLeft(DISTRACTION_S);
    setPhase("distraction");
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(intervalRef.current);
          setPhase("quiz");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function skipDistraction() {
    window.clearInterval(intervalRef.current);
    setSecondsLeft(0);
    setPhase("quiz");
  }

  function handleAnswer(choice: string) {
    if (pickedChoice) return;
    setPickedChoice(choice);
    const correct = choice === quizFacts[quizIndex].answer;
    if (correct) setQuizCorrect((c) => c + 1);
    answerTimeoutRef.current = window.setTimeout(() => {
      setPickedChoice(null);
      if (quizIndex + 1 < quizFacts.length) {
        setQuizIndex((i) => i + 1);
      } else {
        const finalCorrect = correct ? quizCorrect + 1 : quizCorrect;
        onRoundComplete({ attempts: quizFacts.length, correct: finalCorrect });
        if (finalCorrect === quizFacts.length) onLevelChange(level + 1);
        setPhase("result");
      }
    }, 550);
  }

  const progressPct = distractionTotal ? Math.round(((distractionTotal - secondsLeft) / distractionTotal) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3 md:p-5">
      <GameHeader
        title="Story Memory"
        level={level}
        onLevelChange={onLevelChange}
        onExit={onExit}
        onRestart={phase === "reading" || phase === "distraction" || phase === "quiz" ? handleRestart : undefined}
      />

      {phase === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-ink-muted">
            Read the story, wait through a short distraction, then answer a few recall questions about it.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-muted">Story for level {level}</span>
            <select
              value={selectedStoryId}
              onChange={(e) => setSelectedStoryId(e.target.value)}
              className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
            >
              <option value="built-in">Built-in story (regenerates each time)</option>
              {levelStories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startRound}
              className="rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="rounded-theme-sm border border-dashed border-accent px-3 py-2 text-xs font-semibold text-accent hover:bg-accent-soft"
            >
              + Upload a story
            </button>
          </div>
        </div>
      )}

      {phase === "reading" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-theme border border-border bg-surface p-4 text-sm leading-relaxed text-ink shadow-theme">{storyText}</div>
          <button
            type="button"
            onClick={beginDistraction}
            className="mx-auto rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            I've read it — continue
          </button>
        </div>
      )}

      {phase === "distraction" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 text-xl font-bold text-ink transition-[border-color] duration-500"
            style={{ borderColor: "var(--color-accent)", background: `conic-gradient(var(--color-accent-soft) ${progressPct}%, transparent ${progressPct}%)` }}
          >
            {secondsLeft}s
          </div>
          <p className="m-0 max-w-xs text-center text-sm text-ink-muted">Hold on — this short pause keeps you from just rehearsing the story word for word.</p>
          <button
            type="button"
            onClick={skipDistraction}
            className="rounded-theme-sm border border-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            Start now
          </button>
        </div>
      )}

      {phase === "quiz" && quizFacts[quizIndex] && (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <p className="m-0 text-center text-xs text-ink-muted">
            Question {quizIndex + 1} of {quizFacts.length}
          </p>
          <h3 className="m-0 text-center text-base font-semibold text-ink">{quizFacts[quizIndex].question}</h3>
          <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
            {quizFacts[quizIndex].choices.map((choice) => {
              const isPicked = pickedChoice === choice;
              const isCorrectChoice = choice === quizFacts[quizIndex].answer;
              const showState = pickedChoice !== null;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleAnswer(choice)}
                  disabled={pickedChoice !== null}
                  className={`rounded-theme border px-3.5 py-2.5 text-left text-sm font-semibold shadow-theme disabled:cursor-default ${
                    showState && isCorrectChoice
                      ? "learning-flash-success border-accent bg-accent-soft text-accent"
                      : showState && isPicked
                        ? "learning-flash-error border-[#c22a4d] text-[#c22a4d]"
                        : "border-border bg-surface text-ink hover:bg-surface-alt"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="m-0 text-lg font-bold text-ink">
            {quizCorrect} / {quizFacts.length} correct
          </p>
          <p className="m-0 text-sm text-ink-muted">{quizCorrect === quizFacts.length ? "Perfect — level up!" : "Nice try — have another go."}</p>
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="rounded-theme border border-accent bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
          >
            {quizCorrect === quizFacts.length ? "Next level" : "Try again"}
          </button>
        </div>
      )}

      {uploadOpen && (
        <StoryUploadDialog
          onClose={() => setUploadOpen(false)}
          onSave={(uploadLevel, name, text) => {
            // Jump the game to whatever level the story was uploaded for
            // (it only appears in that level's picker) and select it
            // immediately, so Start plays the story just uploaded — not an
            // unrelated built-in one, and not a story for a level the
            // player wasn't even on.
            const newId = onAddCustomStory(uploadLevel, name, text);
            if (uploadLevel !== level) onLevelChange(uploadLevel);
            setSelectedStoryId(newId);
            setUploadOpen(false);
          }}
        />
      )}
    </div>
  );
}
