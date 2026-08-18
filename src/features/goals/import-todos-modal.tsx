import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  extractTextFromImage,
  linesFromCommaText,
  linesFromOcrText,
  validateImportFile,
} from "@/lib/goals/todo-import";
import { ImportImageIcon, TrashIcon } from "./goal-todo-icons";

interface ImportTodosModalProps {
  onClose: () => void;
  onConfirm: (titles: string[]) => void;
}

type Mode = "photo" | "text";
type Status = "idle" | "loading" | "error" | "review";

const inputClass =
  "w-full rounded-theme-sm border border-border bg-canvas px-2.5 py-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent";

// Two ways in: an image OCR'd client-side (Tesseract.js, no server/API key,
// nothing leaves the device) or plain comma-separated text — both land in
// the same editable review list before anything is actually saved, so OCR
// mistakes can be fixed instead of silently importing garbage.
export default function ImportTodosModal({ onClose, onConfirm }: ImportTodosModalProps) {
  const [mode, setMode] = useState<Mode>("photo");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [textDraft, setTextDraft] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const validationError = validateImportFile(file);
    if (validationError) {
      setStatus("error");
      setError(validationError);
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const text = await extractTextFromImage(file);
      const parsed = linesFromOcrText(text);
      if (parsed.length === 0) {
        setStatus("error");
        setError("Please upload a better image, yikes.");
        return;
      }
      setLines(parsed);
      setStatus("review");
    } catch {
      setStatus("error");
      setError("Couldn't read that image — please try another one.");
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleParseText() {
    const parsed = linesFromCommaText(textDraft);
    if (parsed.length === 0) {
      setStatus("error");
      setError("Enter at least one to-do, separated by commas.");
      return;
    }
    setLines(parsed);
    setStatus("review");
  }

  function updateLine(index: number, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? value : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    const cleaned = lines.map((l) => l.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    onConfirm(cleaned);
  }

  function reset() {
    setStatus("idle");
    setError("");
    setLines([]);
    setTextDraft("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-[1.1rem] py-3">
          <h2 className="m-0 text-base text-ink">Import to-dos</h2>
          {status !== "idle" && (
            <button type="button" onClick={reset} className="text-xs font-semibold text-accent hover:underline">
              Start over
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-[1.1rem] py-3.5">
          {status === "idle" && (
            <div className="flex flex-col gap-3.5">
              <div className="inline-flex self-start overflow-hidden rounded-full border border-border">
                <button
                  type="button"
                  aria-pressed={mode === "photo"}
                  onClick={() => setMode("photo")}
                  className={`px-3 py-1 text-xs ${mode === "photo" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
                >
                  Photo
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "text"}
                  onClick={() => setMode("text")}
                  className={`px-3 py-1 text-xs ${mode === "text" ? "bg-accent font-semibold text-accent-contrast" : "bg-surface text-ink-muted"}`}
                >
                  Text
                </button>
              </div>

              {mode === "photo" ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-theme border-2 border-dashed p-6 text-center ${
                    dragActive ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-alt"
                  }`}
                >
                  <ImportImageIcon className="h-8 w-8" style={{ color: "var(--color-accent)" }} />
                  <p className="m-0 text-sm font-semibold text-ink">Drop an image, or click to choose one</p>
                  <p className="m-0 text-xs text-ink-muted">A handwritten list, whiteboard, or photo. PNG/JPG/WEBP, up to 5MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-ink-muted">Comma-separated to-dos</span>
                  <textarea
                    rows={3}
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    placeholder="call susan, go to therapy, buy groceries"
                    className={`${inputClass} resize-y`}
                  />
                  <button
                    type="button"
                    onClick={handleParseText}
                    className="mt-1 self-start rounded-theme-sm border border-accent bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-contrast hover:brightness-105"
                  >
                    Parse
                  </button>
                </div>
              )}
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <span
                aria-hidden="true"
                className="h-8 w-8 animate-spin rounded-full border-[3px] border-accent-soft border-t-accent"
              />
              <p className="m-0 text-sm text-ink-muted">Reading your image…</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="m-0 text-sm text-[#c22a4d]">{error}</p>
              <button
                type="button"
                onClick={reset}
                className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt"
              >
                Try again
              </button>
            </div>
          )}

          {status === "review" && (
            <div className="flex flex-col gap-2.5">
              <p className="m-0 text-xs text-ink-muted">
                {lines.length} to-do{lines.length === 1 ? "" : "s"} found — edit or remove any before adding.
              </p>
              <div className="flex flex-col gap-1.5">
                {lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => updateLine(i, e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      aria-label={`Remove ${line || "this line"}`}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-theme-sm text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {lines.length === 0 && <p className="m-0 text-center text-xs text-ink-muted">Nothing left to add.</p>}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-[1.1rem] py-3">
          <button type="button" onClick={onClose} className="rounded-theme-sm border border-border px-3.5 py-2 text-sm text-ink hover:bg-surface-alt">
            Cancel
          </button>
          {status === "review" && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={lines.filter((l) => l.trim()).length === 0}
              className="rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105 disabled:cursor-default disabled:opacity-50"
            >
              Add {lines.filter((l) => l.trim()).length || ""} to-do{lines.filter((l) => l.trim()).length === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
