import { useState } from "react";
import { openLink, openOrDownloadAttachment } from "@/lib/vocabulary/vocab-files";
import type { Direction, TrainingSession, VocabTopic, VocabWord } from "@/lib/vocabulary/vocab-types";

// Same links/files a word carries on the Topic edit page, shown alongside
// whichever side of the card is currently displaying "Meaning" — stops
// propagation so tapping a link/file doesn't also flip the card underneath it.
function WordExtras({ word }: { word: VocabWord }) {
  if (word.links.length === 0 && word.attachments.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-1.5">
      {word.links.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openLink(l.url);
          }}
          title={l.url}
          className="max-w-[160px] truncate rounded-theme-sm border border-border bg-canvas px-2 py-0.5 text-[0.65rem] text-accent hover:bg-accent-soft"
        >
          🔗 {l.url.replace(/^https?:\/\//, "")}
        </button>
      ))}
      {word.attachments.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openOrDownloadAttachment(a);
          }}
          title={a.name}
          className="max-w-[160px] truncate rounded-theme-sm border border-border bg-canvas px-2 py-0.5 text-[0.65rem] text-ink hover:text-accent hover:underline"
        >
          📎 {a.name}
        </button>
      ))}
    </div>
  );
}

interface TrainingViewProps {
  session: TrainingSession;
  findTopic: (id: string) => VocabTopic | undefined;
  findWord: (topicId: string, wordId: string) => VocabWord | undefined;
  onChangeDirection: (direction: Direction) => void;
  onGrade: (correct: boolean) => void;
  onExit: () => void;
  onFinish: () => void;
}

export default function TrainingView({ session, findTopic, findWord, onChangeDirection, onGrade, onExit, onFinish }: TrainingViewProps) {
  const [flipped, setFlipped] = useState(false);
  const ref = session.wordRefs[session.index];
  const word = ref ? findWord(ref.topicId, ref.wordId) : undefined;
  const topic = ref ? findTopic(ref.topicId) : undefined;

  if (!ref || !word || !topic) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <h2 className="m-0 text-lg font-bold text-ink">Session complete</h2>
        <p className="m-0 text-base font-semibold">
          <span className="text-[#4f8a45]">Correct: {session.correct}</span>
          <span className="mx-2 text-ink-muted">|</span>
          <span className="text-[#c94f6b]">Wrong: {session.wrong}</span>
        </p>
        <button
          type="button"
          onClick={onFinish}
          className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          Back to Topics
        </button>
      </div>
    );
  }

  const frontIsTerm = session.direction === "term-to-meaning";
  const frontText = frontIsTerm ? word.term : word.meaning;
  const backText = frontIsTerm ? word.meaning : word.term;
  const frontLabel = frontIsTerm ? "Word / Term" : "Meaning";
  const backLabel = frontIsTerm ? "Meaning" : "Word / Term";
  // Meaning may contain rich-text HTML (highlight/color/size) from the
  // Topic edit page's meaning editor — Term never does, so only that side
  // needs dangerouslySetInnerHTML.
  const frontIsHtml = !frontIsTerm;
  const backIsHtml = frontIsTerm;

  function grade(correct: boolean) {
    setFlipped(false);
    onGrade(correct);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink-muted">
          Card {session.index + 1} of {session.wordRefs.length} — {topic.name}
        </span>
        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-border">
            <button
              type="button"
              onClick={() => onChangeDirection("term-to-meaning")}
              className={`px-3 py-1 text-xs ${session.direction === "term-to-meaning" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
            >
              Word → Meaning
            </button>
            <button
              type="button"
              onClick={() => onChangeDirection("meaning-to-term")}
              className={`px-3 py-1 text-xs ${session.direction === "meaning-to-term" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
            >
              Meaning → Word
            </button>
          </div>
          <button type="button" onClick={onExit} className="rounded-theme-sm border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:bg-surface-alt">
            Exit
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 py-6">
        <button
          type="button"
          onClick={() => !flipped && setFlipped(true)}
          className="flex min-h-[220px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-theme border border-border bg-surface p-8 text-center shadow-theme"
        >
          <span className="text-[0.7rem] uppercase tracking-wide text-ink-muted">{frontLabel}</span>
          {frontIsHtml ? (
            <span className="whitespace-pre-wrap text-2xl font-bold text-ink" dangerouslySetInnerHTML={{ __html: frontText }} />
          ) : (
            <span className="whitespace-pre-wrap text-2xl font-bold text-ink">{frontText}</span>
          )}
          {frontLabel === "Meaning" && <WordExtras word={word} />}
          {flipped ? (
            <div className="mt-1 w-full border-t border-dashed border-border pt-3">
              <span className="text-[0.7rem] uppercase tracking-wide text-ink-muted">{backLabel}</span>
              <br />
              {backIsHtml ? (
                <span className="whitespace-pre-wrap text-lg text-accent" dangerouslySetInnerHTML={{ __html: backText }} />
              ) : (
                <span className="whitespace-pre-wrap text-lg text-accent">{backText}</span>
              )}
              {backLabel === "Meaning" && <WordExtras word={word} />}
            </div>
          ) : (
            <span className="text-xs text-ink-muted">Click to flip</span>
          )}
        </button>

        {flipped && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => grade(false)}
              className="rounded-theme-sm border-[1.5px] border-[#c94f6b] bg-[color-mix(in_srgb,#c94f6b_10%,var(--color-surface))] px-6 py-2.5 text-sm font-bold text-[#c94f6b] hover:bg-[#c94f6b] hover:text-white"
            >
              ✕ Wrong
            </button>
            <button
              type="button"
              onClick={() => grade(true)}
              className="rounded-theme-sm border-[1.5px] border-[#4f8a45] bg-[color-mix(in_srgb,#4f8a45_10%,var(--color-surface))] px-6 py-2.5 text-sm font-bold text-[#4f8a45] hover:bg-[#4f8a45] hover:text-white"
            >
              ✓ Correct
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
