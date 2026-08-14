import { useEffect, useRef, useState } from "react";
import { Q5_POOL, STATIC_QUESTIONS, type JournalEntry } from "@/lib/journal/journal-types";

interface JournalPromptsProps {
  entry: JournalEntry;
  locked: boolean;
  onFieldCommit: (field: keyof JournalEntry, value: string) => void;
}

const textareaClass =
  "min-h-[3em] resize-y border-0 bg-transparent px-0.5 pb-[0.55rem] pt-1.5 text-[0.86rem] leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none disabled:cursor-default";
const sectionDivider = "border-b border-[color-mix(in_srgb,var(--color-border)_55%,transparent)]";
const fieldUnderline =
  "border-0 border-b-[1.5px] border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] bg-transparent px-0.5 py-1.5 text-sm font-semibold text-ink focus:border-accent focus:outline-none disabled:cursor-default";

// Remounted with key={entry.dateKey} by the parent whenever the viewed date
// changes, so each field's local (blur-to-commit) state naturally resets —
// no effect-based sync needed.
export default function JournalPrompts({ entry, locked, onFieldCommit }: JournalPromptsProps) {
  const [values, setValues] = useState({
    wentWell: entry.wentWell,
    differently: entry.differently,
    learned: entry.learned,
    forSomeone: entry.forSomeone,
    q5Text: entry.q5Text,
    notes: entry.notes,
  });
  const [q5Label, setQ5Label] = useState(
    entry.q5Label || Q5_POOL[Math.floor(Math.random() * Q5_POOL.length)].question,
  );
  const [q5Custom, setQ5Custom] = useState(
    () => Boolean(entry.q5Label) && !Q5_POOL.some((q) => q.question === entry.q5Label),
  );
  const [q5Draft, setQ5Draft] = useState(q5Custom ? q5Label : "");
  const q5Placeholder = Q5_POOL.find((q) => q.question === q5Label)?.placeholder ?? "Whatever comes to mind…";
  const [q5MenuOpen, setQ5MenuOpen] = useState(false);
  const q5MenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (q5MenuRef.current && !q5MenuRef.current.contains(e.target as Node)) setQ5MenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function setValue(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleQ5Select(value: string) {
    setQ5Label(value);
    setQ5Custom(false);
    setQ5MenuOpen(false);
    onFieldCommit("q5Label", value);
  }

  function handleQ5CustomBlur() {
    const v = q5Draft.trim();
    if (v) {
      setQ5Label(v);
      onFieldCommit("q5Label", v);
    } else {
      // Left blank — revert to the dropdown showing whatever question was
      // already loaded, instead of leaving an empty field.
      setQ5Custom(false);
    }
  }

  function openCustomEditor() {
    setQ5Draft("");
    setQ5Custom(true);
    setQ5MenuOpen(false);
  }

  return (
    <div className="rounded-theme border border-border bg-surface px-4 py-0.5 shadow-theme sm:px-5">
      {STATIC_QUESTIONS.map((q) => (
        <div key={q.key} className={`flex flex-col gap-2.5 py-[1.15rem] transition-colors focus-within:border-accent ${sectionDivider}`}>
          <div className="flex items-center gap-2.5 border-l-[3px] border-accent pl-2.5 text-sm font-semibold text-ink">
            <span className="text-base">{q.emoji}</span>
            <span>{q.label}</span>
          </div>
          <textarea
            rows={2}
            placeholder={q.placeholder}
            value={values[q.key]}
            disabled={locked}
            onChange={(e) => setValue(q.key, e.target.value)}
            onBlur={(e) => onFieldCommit(q.key, e.target.value)}
            className={textareaClass}
          />
        </div>
      ))}

      <div className={`flex flex-col gap-2.5 py-[1.15rem] transition-colors focus-within:border-accent ${sectionDivider}`}>
        <div className="flex items-center gap-2 border-l-[3px] border-accent pl-2.5">
          {q5Custom ? (
            <>
              <input
                type="text"
                autoFocus
                placeholder="Write your own question…"
                value={q5Draft}
                disabled={locked}
                onChange={(e) => setQ5Draft(e.target.value)}
                onBlur={handleQ5CustomBlur}
                className={`min-w-0 flex-1 ${fieldUnderline}`}
              />
              <button
                type="button"
                disabled={locked}
                onClick={() => setQ5Custom(false)}
                aria-label="Pick from list"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-accent disabled:cursor-default"
              >
                ☰
              </button>
            </>
          ) : (
            <>
              <div ref={q5MenuRef} className="relative min-w-0 flex-1">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setQ5MenuOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={q5MenuOpen}
                  className={`flex w-full items-start justify-between gap-2 text-left ${fieldUnderline}`}
                >
                  <span className="min-w-0 flex-1 whitespace-normal break-words">{q5Label}</span>
                  <span className="flex-shrink-0 text-ink-muted">{q5MenuOpen ? "︿" : "﹀"}</span>
                </button>
                {q5MenuOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-theme border border-border bg-surface shadow-theme"
                  >
                    {Q5_POOL.map((q) => (
                      <button
                        key={q.question}
                        type="button"
                        role="option"
                        aria-selected={q.question === q5Label}
                        onClick={() => handleQ5Select(q.question)}
                        className={`block w-full border-b border-border px-2.5 py-2 text-left text-sm last:border-b-0 hover:bg-surface-alt ${
                          q.question === q5Label ? "font-semibold text-accent" : "text-ink"
                        }`}
                      >
                        {q.question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={locked}
                onClick={openCustomEditor}
                aria-label="Write your own question"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-accent disabled:cursor-default"
              >
                ✎
              </button>
            </>
          )}
        </div>
        <textarea
          rows={2}
          placeholder={q5Placeholder}
          value={values.q5Text}
          disabled={locked}
          onChange={(e) => setValue("q5Text", e.target.value)}
          onBlur={(e) => onFieldCommit("q5Text", e.target.value)}
          className={textareaClass}
        />
      </div>

      <div className="flex flex-col gap-2.5 py-[1.15rem]">
        <div className="flex items-center gap-2.5 border-l-[3px] border-accent pl-2.5 text-sm font-semibold text-ink">
          <span className="text-base">📝</span>
          <span>Notes</span>
        </div>
        <textarea
          rows={5}
          placeholder="Anything else on your mind…"
          value={values.notes}
          disabled={locked}
          onChange={(e) => setValue("notes", e.target.value)}
          onBlur={(e) => onFieldCommit("notes", e.target.value)}
          className="journal-notes-paper min-h-[8em] resize-y border-0 px-0.5 py-2.5 text-[0.86rem] leading-[20px] text-ink placeholder:text-ink-muted focus:outline-none disabled:cursor-default"
        />
      </div>
    </div>
  );
}
