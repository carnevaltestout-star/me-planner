import { useEffect, useRef, useState } from "react";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  downloadAttachment,
  openLink,
  openOrDownloadAttachment,
  readFileAsAttachment,
} from "@/lib/vocabulary/vocab-files";
import type { VocabAttachment, VocabLink, VocabTopic, VocabWord } from "@/lib/vocabulary/vocab-types";
import AddLinkDialog from "./add-link-dialog";

// Beyond 15 lines the field stops growing and shows a scrollbar instead,
// capped down to a 12-line viewport rather than the full 15 — leaves a
// visual hint (a partial next line / scroll affordance) that there's more.
const MAX_LINES_BEFORE_CAP = 15;
const CAPPED_DISPLAY_LINES = 12;

function autosizeMeaningField(el: HTMLDivElement) {
  const style = window.getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);

  // Reset before measuring — otherwise scrollHeight reports the larger of
  // "current height" and "content height", which never lets the field
  // shrink back down after text is deleted.
  el.style.height = "auto";
  const contentHeight = el.scrollHeight;
  const maxHeight = lineHeight * MAX_LINES_BEFORE_CAP + verticalPadding;
  const cappedHeight = lineHeight * CAPPED_DISPLAY_LINES + verticalPadding;

  if (contentHeight <= maxHeight) {
    el.style.height = `${contentHeight}px`;
    el.style.overflowY = "hidden";
  } else {
    el.style.height = `${cappedHeight}px`;
    el.style.overflowY = "auto";
  }
}

interface TopicEditViewProps {
  topic: VocabTopic;
  onBack: () => void;
  onStartTraining: () => void;
  onRenameTopic: (name: string) => void;
  onUpdateWord: (wordId: string, term: string, meaning: string) => void;
  onAddWord: () => void;
  onDeleteWord: (wordId: string) => void;
  onUpdateWordLinks: (wordId: string, links: VocabLink[]) => void;
  onUpdateWordAttachments: (wordId: string, attachments: VocabAttachment[]) => void;
  onUpdateTopicAttachments: (attachments: VocabAttachment[]) => void;
}

async function readFilesWithSizeGuard(files: File[]): Promise<VocabAttachment[]> {
  const accepted: VocabAttachment[] = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      window.alert(`"${file.name}" is larger than 5MB and can't be attached.`);
      continue;
    }
    accepted.push(await readFileAsAttachment(file));
  }
  return accepted;
}

export default function TopicEditView({
  topic,
  onBack,
  onStartTraining,
  onRenameTopic,
  onUpdateWord,
  onAddWord,
  onDeleteWord,
  onUpdateWordLinks,
  onUpdateWordAttachments,
  onUpdateTopicAttachments,
}: TopicEditViewProps) {
  const topicFileInputRef = useRef<HTMLInputElement>(null);

  async function handleTopicFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    // .files is a live FileList tied to the input — capture it as a plain
    // array before resetting .value, or clearing .value empties this
    // reference too and the files below silently vanish.
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const accepted = await readFilesWithSizeGuard(files);
    if (accepted.length > 0) onUpdateTopicAttachments([...topic.attachments, ...accepted]);
  }

  function removeTopicAttachment(id: string) {
    onUpdateTopicAttachments(topic.attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to topics"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-alt"
        >
          ←
        </button>
        <input
          type="text"
          defaultValue={topic.name}
          onBlur={(e) => {
            const trimmed = e.target.value.trim();
            if (trimmed) onRenameTopic(trimmed);
            else e.target.value = topic.name;
          }}
          className="min-w-[120px] flex-1 border-b-[1.5px] border-transparent bg-transparent p-1 text-lg font-bold text-ink focus:border-accent focus:outline-none"
        />
        <span aria-hidden="true" className="h-6 w-px flex-shrink-0" style={{ background: "var(--color-surface-alt)" }} />
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span className="text-xs font-semibold text-ink-muted">Learning methods</span>
          <button
            type="button"
            onClick={() => topicFileInputRef.current?.click()}
            className="rounded-theme-sm border border-dashed border-accent px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft"
          >
            📎 Attach file
          </button>
          <input
            ref={topicFileInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            multiple
            className="hidden"
            onChange={handleTopicFilesSelected}
          />
        </div>
        <button
          type="button"
          onClick={onStartTraining}
          className="flex-shrink-0 rounded-theme-sm border border-accent bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast hover:brightness-105"
        >
          ▶ Start Training
        </button>
      </div>

      {topic.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.attachments.map((a) => (
            <span key={a.id} className="flex items-center gap-1 rounded-theme-sm border border-border bg-canvas px-2 py-1 text-xs text-ink">
              <button
                type="button"
                onClick={() => openOrDownloadAttachment(a)}
                title={a.name}
                className="max-w-[220px] truncate text-ink hover:text-accent hover:underline"
              >
                📎 {a.name}
              </button>
              <button
                type="button"
                onClick={() => downloadAttachment(a)}
                aria-label={`Download ${a.name}`}
                title="Download"
                className="text-ink-muted hover:text-accent"
              >
                ⬇
              </button>
              <button
                type="button"
                onClick={() => removeTopicAttachment(a.id)}
                aria-label={`Remove ${a.name}`}
                className="text-ink-muted hover:text-[#c22a4d]"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-theme border border-border bg-surface">
        <div className="grid grid-cols-[1fr_1.6fr_34px] border-b border-border bg-surface-alt text-[0.68rem] font-bold uppercase tracking-wide text-ink-muted">
          <div className="px-2.5 py-2">Word / Term</div>
          <div className="px-2.5 py-2">Meaning</div>
          <div />
        </div>
        {topic.words.map((w) => (
          <WordRow
            key={w.id}
            word={w}
            onUpdate={onUpdateWord}
            onUpdateLinks={onUpdateWordLinks}
            onUpdateAttachments={onUpdateWordAttachments}
            onDelete={() => onDeleteWord(w.id)}
          />
        ))}
        <div className="p-2.5">
          <button
            type="button"
            onClick={onAddWord}
            className="w-full rounded-theme-sm border border-dashed border-accent px-3 py-2 text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            + Add word
          </button>
        </div>
      </div>
    </div>
  );
}

const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: "Yellow", value: "#fff3a0" },
  { label: "Pink", value: "#ffd6e0" },
  { label: "Green", value: "#d7f5d0" },
];

const TEXT_COLORS: { label: string; value: string }[] = [
  { label: "Ink", value: "#2b2b2b" },
  { label: "Accent", value: "var(--color-accent)" },
  { label: "Red", value: "#c94f6b" },
  { label: "Blue", value: "#3b82c4" },
];

const MIN_FONT_LEVEL = 1;
const MAX_FONT_LEVEL = 7;
const DEFAULT_FONT_LEVEL = 3;

function WordRow({
  word,
  onUpdate,
  onUpdateLinks,
  onUpdateAttachments,
  onDelete,
}: {
  word: VocabWord;
  onUpdate: (wordId: string, term: string, meaning: string) => void;
  onUpdateLinks: (wordId: string, links: VocabLink[]) => void;
  onUpdateAttachments: (wordId: string, attachments: VocabAttachment[]) => void;
  onDelete: () => void;
}) {
  const [term, setTerm] = useState(word.term);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const meaningRef = useRef<HTMLDivElement>(null);
  const fontLevelRef = useRef(DEFAULT_FONT_LEVEL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didInitMeaningRef = useRef(false);
  // Term/meaning commit silently on blur with no other feedback that
  // anything happened — same "Saved" pulse convention as the Journal's
  // autosave, so leaving a field doesn't look like a no-op.
  const [justSaved, setJustSaved] = useState(false);
  const savedTimeoutRef = useRef<number>();

  function pulseSaved() {
    window.clearTimeout(savedTimeoutRef.current);
    setJustSaved(true);
    savedTimeoutRef.current = window.setTimeout(() => setJustSaved(false), 1600);
  }

  // Seeds the contentEditable's DOM content once — after that it's
  // uncontrolled (same reasoning as any contentEditable in React: re-setting
  // innerHTML on every render would fight the browser's own cursor
  // position). WordRow is remounted per-word (keyed by word.id) so this
  // still resets correctly when switching words.
  useEffect(() => {
    if (didInitMeaningRef.current || !meaningRef.current) return;
    didInitMeaningRef.current = true;
    meaningRef.current.innerHTML = word.meaning;
    autosizeMeaningField(meaningRef.current);
  }, [word.meaning]);

  function currentMeaningHtml(): string {
    return meaningRef.current?.innerHTML ?? word.meaning;
  }

  function commitTerm() {
    onUpdate(word.id, term.trim() || word.term, currentMeaningHtml());
    pulseSaved();
  }

  function commitMeaning() {
    onUpdate(word.id, term.trim() || word.term, currentMeaningHtml());
    pulseSaved();
  }

  // mousedown+preventDefault keeps focus (and the current text selection)
  // on the contentEditable instead of shifting it to the toolbar button,
  // which is what execCommand needs to apply to the right range.
  function runToolbarCommand(run: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      meaningRef.current?.focus();
      document.execCommand("styleWithCSS", false, "true");
      run();
    };
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const accepted = await readFilesWithSizeGuard(files);
    if (accepted.length > 0) onUpdateAttachments(word.id, [...word.attachments, ...accepted]);
  }

  function removeAttachment(id: string) {
    onUpdateAttachments(word.id, word.attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="relative grid grid-cols-[1fr_1.6fr_34px] border-b border-border last:border-b-0">
      <span
        aria-live="polite"
        className={`pointer-events-none absolute right-1.5 top-1 z-10 text-[0.62rem] font-medium text-ink-muted transition-opacity duration-300 ${
          justSaved ? "opacity-100" : "opacity-0"
        }`}
      >
        Saved
      </span>
      <div className="flex items-stretch border-l-0 border-border">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onBlur={commitTerm}
          className="w-full min-w-0 border-none bg-transparent p-2.5 text-sm text-ink focus:bg-canvas focus:outline-none"
        />
      </div>
      <div className="vocab-col-divider flex flex-col gap-1.5 border-l border-border p-2.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[0.62rem] text-ink-muted">Highlight:</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={`Highlight ${c.label}`}
              onMouseDown={runToolbarCommand(() => document.execCommand("hiliteColor", false, c.value))}
              className="h-4 w-4 flex-shrink-0 rounded-full border border-border"
              style={{ background: c.value }}
            />
          ))}
          <button
            type="button"
            title="Clear highlight"
            onMouseDown={runToolbarCommand(() => document.execCommand("hiliteColor", false, "transparent"))}
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-border text-[8px] text-ink-muted"
          >
            ✕
          </button>
          <span className="mx-0.5 h-3 w-px flex-shrink-0 bg-border" />
          <span className="text-[0.62rem] text-ink-muted">Text Color</span>
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={`Text ${c.label}`}
              onMouseDown={runToolbarCommand(() => document.execCommand("foreColor", false, c.value))}
              className="h-4 w-4 flex-shrink-0 rounded-full border border-border"
              style={{ background: c.value }}
            />
          ))}
          <span className="mx-0.5 h-3 w-px flex-shrink-0 bg-border" />
          <button
            type="button"
            title="Smaller text"
            onMouseDown={runToolbarCommand(() => {
              fontLevelRef.current = Math.max(MIN_FONT_LEVEL, fontLevelRef.current - 1);
              document.execCommand("fontSize", false, String(fontLevelRef.current));
            })}
            className="flex h-4 w-5 flex-shrink-0 items-center justify-center rounded-theme-sm text-[10px] font-bold text-ink-muted hover:bg-surface-alt"
          >
            A-
          </button>
          <button
            type="button"
            title="Bigger text"
            onMouseDown={runToolbarCommand(() => {
              fontLevelRef.current = Math.min(MAX_FONT_LEVEL, fontLevelRef.current + 1);
              document.execCommand("fontSize", false, String(fontLevelRef.current));
            })}
            className="flex h-4 w-5 flex-shrink-0 items-center justify-center rounded-theme-sm text-xs font-bold text-ink-muted hover:bg-surface-alt"
          >
            A+
          </button>
        </div>
        <div
          ref={meaningRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={commitMeaning}
          onInput={(e) => autosizeMeaningField(e.currentTarget)}
          className="min-h-[3em] w-full rounded-theme-sm border-none bg-transparent p-0.5 text-sm leading-relaxed text-ink focus:rounded-theme-sm focus:bg-canvas focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLinkDialogOpen(true)}
            className="rounded-theme-sm border border-dashed border-accent px-2 py-0.5 text-[0.65rem] font-semibold text-accent hover:bg-accent-soft"
          >
            🔗 Add link
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-theme-sm border border-dashed border-accent px-2 py-0.5 text-[0.65rem] font-semibold text-accent hover:bg-accent-soft"
          >
            📎 Attach file
          </button>
          <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} multiple className="hidden" onChange={handleFilesSelected} />
        </div>
        {(word.links.length > 0 || word.attachments.length > 0) && (
          // Links and files share one wrapping row — links always sort
          // before files, and a newly added link lands right after the
          // last existing link (not pushed to a separate row of its own).
          <div className="flex flex-wrap gap-1.5">
            {word.links.map((l) => (
              <span key={l.id} className="flex items-center gap-1 rounded-theme-sm border border-border bg-canvas px-2 py-0.5 text-[0.65rem]">
                <button
                  type="button"
                  onClick={() => openLink(l.url)}
                  title={l.url}
                  className="max-w-[160px] truncate text-accent hover:underline"
                >
                  🔗 {l.url.replace(/^https?:\/\//, "")}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateLinks(word.id, word.links.filter((x) => x.id !== l.id))}
                  aria-label={`Remove link ${l.url}`}
                  className="text-ink-muted hover:text-[#c22a4d]"
                >
                  ✕
                </button>
              </span>
            ))}
            {word.attachments.map((a) => (
              <span key={a.id} className="flex items-center gap-1 rounded-theme-sm border border-border bg-canvas px-2 py-0.5 text-[0.65rem] text-ink">
                <button
                  type="button"
                  onClick={() => openOrDownloadAttachment(a)}
                  title={a.name}
                  className="max-w-[140px] truncate text-ink hover:text-accent hover:underline"
                >
                  📎 {a.name}
                </button>
                <button
                  type="button"
                  onClick={() => downloadAttachment(a)}
                  aria-label={`Download ${a.name}`}
                  title="Download"
                  className="text-ink-muted hover:text-accent"
                >
                  ⬇
                </button>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  aria-label={`Remove ${a.name}`}
                  className="text-ink-muted hover:text-[#c22a4d]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${word.term || "word"}`}
        className="vocab-col-divider flex items-center justify-center border-l border-border text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
      >
        ✕
      </button>
      {linkDialogOpen && (
        <AddLinkDialog
          links={word.links}
          onClose={() => setLinkDialogOpen(false)}
          onSave={(links) => {
            onUpdateLinks(word.id, links);
            setLinkDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
