import { useState } from "react";
import { buildSessionQueue } from "@/lib/vocabulary/vocab-srs";
import { addDaysToKey, todayKey, type VocabTopic } from "@/lib/vocabulary/vocab-types";

interface TopicCardProps {
  topic: VocabTopic;
  onOpen: () => void;
  onStartTraining: () => void;
  onDeleteRequest: () => void;
}

// "Today"/"Yesterday" for recent sessions (updates as soon as a new session
// finishes, since lastResult.at is always stamped with the real todayKey()),
// a short date otherwise.
function formatSessionDate(dateKey: string): string {
  const today = todayKey();
  if (dateKey === today) return "Today";
  if (dateKey === addDaysToKey(today, -1)) return "Yesterday";
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TopicCard({ topic, onOpen, onStartTraining, onDeleteRequest }: TopicCardProps) {
  const [missedOpen, setMissedOpen] = useState(false);
  const dueCount = buildSessionQueue(topic.words, 999).length;
  const missedWords = topic.lastResult
    ? topic.lastResult.missedWordIds.map((id) => topic.words.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => Boolean(w))
    : [];

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="group relative flex cursor-pointer flex-col gap-2.5 rounded-theme border border-border bg-surface p-4 shadow-theme hover:bg-surface-alt"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRequest();
        }}
        aria-label={`Delete ${topic.name}`}
        title="Delete topic"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-ink-muted opacity-0 transition-opacity hover:bg-surface hover:text-[#c22a4d] focus-visible:opacity-100 group-hover:opacity-100"
      >
        🗑
      </button>
      <div className="flex flex-col gap-0.5 pr-7">
        <h3 className="m-0 text-base font-semibold text-ink">{topic.name}</h3>
        <span className="text-xs text-ink-muted">
          {topic.words.length} word{topic.words.length === 1 ? "" : "s"} · {dueCount} due
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStartTraining();
        }}
        className="self-start rounded-theme-sm border border-accent bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent hover:text-accent-contrast"
      >
        ▶ Start Training
      </button>

      {topic.lastResult && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-muted">
              Last session: <span className="font-medium text-ink">{formatSessionDate(topic.lastResult.at)}</span>
            </span>
            <b className="text-[#4f8a45]">Correct {topic.lastResult.correct}</b>
            <span className="text-ink-muted">|</span>
            <b className="text-[#c94f6b]">Wrong {topic.lastResult.wrong}</b>
          </div>
          {missedWords.length > 0 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMissedOpen((o) => !o);
                }}
                className="self-start text-[0.72rem] font-semibold text-accent hover:underline"
              >
                Review {missedWords.length} missed word{missedWords.length === 1 ? "" : "s"} {missedOpen ? "▴" : "▾"}
              </button>
              {missedOpen && (
                <div className="flex flex-col gap-1">
                  {missedWords.map((w) => (
                    <MissedWordItem key={w.id} term={w.term} meaning={w.meaning} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MissedWordItem({ term, meaning }: { term: string; meaning: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
      className="flex flex-col gap-0.5 rounded-theme-sm border border-border bg-canvas px-2 py-1.5 text-left hover:bg-surface-alt"
    >
      <span className="text-[0.72rem] font-bold text-ink">{term}</span>
      {expanded && <span className="text-[0.68rem] text-ink-muted" dangerouslySetInnerHTML={{ __html: meaning }} />}
    </button>
  );
}
