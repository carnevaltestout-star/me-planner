import { useRef, useState } from "react";
import { useMobileBottomReserve } from "@/lib/layout/use-mobile-bottom-reserve";
import { ACCEPTED_FILE_TYPES, extractTextFromFile } from "@/lib/learning/file-text-extract";

interface StoryUploadDialogProps {
  onClose: () => void;
  onSave: (level: number, name: string, text: string) => void;
}

const MAX_CHARS = 1000;
const MAX_NAME_CHARS = 60;

function resize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// Strips a file extension and turns dashes/underscores into spaces, so
// picking "grandmas-trip-to-paris.pdf" pre-fills a readable "grandmas trip
// to paris" instead of the raw filename — still editable before saving.
function nameFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^./\\]+$/, "");
  return withoutExt.replace(/[-_]+/g, " ").trim().slice(0, MAX_NAME_CHARS);
}

export default function StoryUploadDialog({ onClose, onSave }: StoryUploadDialogProps) {
  const bottomReserve = useMobileBottomReserve();
  const [level, setLevel] = useState(1);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave(level, name.trim() || "Untitled story", trimmed.slice(0, MAX_CHARS));
  }

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets re-picking the same file re-trigger this
    if (!file) return;
    setFileError(null);
    setReading(true);
    try {
      const extracted = (await extractTextFromFile(file)).trim();
      if (!extracted) throw new Error("Couldn't find any readable text in that file.");
      setText(extracted.slice(0, MAX_CHARS));
      if (!name.trim()) setName(nameFromFilename(file.name));
      if (textareaRef.current) resize(textareaRef.current);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Couldn't read that file — try pasting the text instead.");
    } finally {
      setReading(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-black/35 p-4 md:inset-0"
      style={{ bottom: bottomReserve }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="flex w-full max-w-[420px] flex-col gap-3.5 rounded-theme border border-border bg-surface p-[1.1rem] shadow-theme">
        <h2 className="m-0 text-base text-ink">Upload a custom story</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">
            Story name ({name.length}/{MAX_NAME_CHARS})
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_CHARS))}
            placeholder="e.g. Grandma's trip to Paris"
            className="rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Level (1-30)</span>
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
              onClick={() => setLevel((l) => Math.min(30, l + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-sidenav text-xs text-ink shadow-theme hover:bg-surface-alt"
            >
              ›
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink-muted">
              Story text ({text.length}/{MAX_CHARS})
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={reading}
              className="flex-shrink-0 rounded-theme-sm border border-dashed border-accent px-2 py-1 text-[0.7rem] font-semibold text-accent hover:bg-accent-soft disabled:cursor-default disabled:opacity-50"
            >
              {reading ? "Reading…" : "Upload a file"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFilePicked}
              className="hidden"
              aria-label="Upload a story file"
            />
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_CHARS));
              setFileError(null);
              resize(e.currentTarget);
            }}
            placeholder="Include a name, number, or weekday for best quiz results."
            rows={4}
            className="max-h-[50vh] min-h-[6em] resize-none overflow-y-auto rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
          {fileError ? (
            <p className="m-0 text-xs text-[#c22a4d]">{fileError}</p>
          ) : (
            <p className="m-0 text-[0.68rem] text-ink-muted">Accepts .txt, .md, .pdf, .odt, or .docx</p>
          )}
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
