import { useRef, useState } from "react";

interface StoryUploadDialogProps {
  onClose: () => void;
  onSave: (level: number, text: string) => void;
}

const MAX_CHARS = 1000;

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function StoryUploadDialog({ onClose, onSave }: StoryUploadDialogProps) {
  const [level, setLevel] = useState(1);
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(level, trimmed.slice(0, MAX_CHARS));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className="flex w-full max-w-[420px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme">
        <h2 className="m-0 text-base text-ink">Upload a custom story</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Level (1-20)</span>
          <div className="inline-flex w-fit items-center gap-1.5">
            <button
              type="button"
              aria-label="Lower level"
              onClick={() => setLevel((l) => Math.max(1, l - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
            >
              ‹
            </button>
            <span className="min-w-[3.5rem] text-center text-sm font-semibold text-ink">Level {level}</span>
            <button
              type="button"
              aria-label="Raise level"
              onClick={() => setLevel((l) => Math.min(20, l + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
            >
              ›
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">
            Story text ({text.length}/{MAX_CHARS})
          </span>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_CHARS));
              resize(e.currentTarget);
            }}
            placeholder="Paste or write a short story…"
            rows={4}
            className="max-h-[50vh] min-h-[6em] resize-none overflow-y-auto rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim()}
            className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105 disabled:cursor-default disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
