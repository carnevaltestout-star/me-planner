import { useEffect, useRef, useState } from "react";
import type { BrainSubpoint, BrainToggle } from "@/lib/brain/brain-types";
import { emptyToggle } from "@/lib/brain/brain-types";
import { subpointAnchorId } from "@/lib/brain/brain-subpoint-ops";
import {
  BRAIN_ATTACHMENT_ACCEPT,
  MAX_BRAIN_ATTACHMENT_BYTES,
  openOrDownloadBrainAttachment,
  readFileAsBrainAttachment,
  readImageFromClipboard,
} from "@/lib/brain/brain-files";
import AddBrainLinkDialog from "./add-brain-link-dialog";

// Same document-editor convention as Vocabulary's word-meaning field
// (topic-edit-view.tsx) — a contentEditable with a highlight/text-color/
// font-size toolbar, rather than a plain textarea — so a subpoint's notes
// read and edit like a real document section instead of a bare text box.
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

// Beyond 15 lines the field stops growing and shows a scrollbar instead,
// capped down to a 12-line viewport — same thresholds as Vocabulary's
// autosizeMeaningField, for the same "leave a visible scroll affordance
// instead of an ever-growing box" reasoning.
const MAX_LINES_BEFORE_CAP = 15;
const CAPPED_DISPLAY_LINES = 12;

function autosizeNotesField(el: HTMLDivElement) {
  const style = window.getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight) || 20;
  const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
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

interface SubpointSectionProps {
  subpoint: BrainSubpoint;
  path: number[];
  label: string;
  onUpdate: (updater: (sp: BrainSubpoint) => BrainSubpoint) => void;
  onAddChild: () => void;
  onDelete: () => void;
}

function ToggleItem({ toggle, onUpdate, onDelete }: { toggle: BrainToggle; onUpdate: (patch: Partial<BrainToggle>) => void; onDelete: () => void }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  async function handlePasteImage(e: React.ClipboardEvent) {
    const image = await readImageFromClipboard(e);
    if (image) onUpdate({ answerImage: image });
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onUpdate({ answerImage: await readFileAsBrainAttachment(file) });
  }

  async function handleDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BRAIN_ATTACHMENT_BYTES) {
      window.alert(`"${file.name}" is larger than 5MB and can't be attached.`);
      return;
    }
    onUpdate({ answerDocument: await readFileAsBrainAttachment(file) });
  }

  return (
    <div className="rounded-theme-sm border border-border bg-surface-alt">
      {/* A div acting as the expand/collapse control (not a <button>) since
          it needs to contain the delete button below it — nesting a
          <button> inside a <button> is invalid HTML and leaves the inner
          one's clicks undefined in some browsers. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onUpdate({ expanded: !toggle.expanded })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onUpdate({ expanded: !toggle.expanded });
          }
        }}
        aria-expanded={toggle.expanded}
        className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left"
      >
        <span aria-hidden="true" className="flex-shrink-0 text-xs text-ink-muted">
          {toggle.expanded ? "▾" : "▸"}
        </span>
        <input
          type="text"
          value={toggle.question}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ question: e.target.value })}
          placeholder="Question…"
          className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-ink focus:outline-none"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete toggle"
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-[#c22a4d]"
        >
          ✕
        </button>
      </div>
      {toggle.expanded && (
        <div className="flex flex-col gap-2 border-t border-border px-2.5 py-2.5">
          <textarea
            value={toggle.answerText}
            onChange={(e) => onUpdate({ answerText: e.target.value })}
            onPaste={handlePasteImage}
            placeholder="Answer — type here, or paste (Ctrl/Cmd+V) an image directly"
            rows={3}
            className="w-full resize-y rounded-theme-sm border border-border bg-canvas p-2 text-sm text-ink focus:outline focus:outline-2 focus:outline-accent"
          />
          {toggle.answerImage && (
            <div className="relative w-fit">
              <img src={toggle.answerImage.dataUrl} alt="" className="max-h-40 rounded-theme-sm border border-border" />
              <button
                type="button"
                onClick={() => onUpdate({ answerImage: null })}
                aria-label="Remove image"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-ink-muted text-[10px] text-surface"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="rounded-theme-sm border border-dashed border-accent px-2 py-1 text-[0.7rem] font-semibold text-accent hover:bg-accent-soft"
            >
              🖼️ Upload image
            </button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="rounded-theme-sm border border-dashed border-accent px-2 py-1 text-[0.7rem] font-semibold text-accent hover:bg-accent-soft"
            >
              📎 Attach document
            </button>
            <input ref={docInputRef} type="file" accept={BRAIN_ATTACHMENT_ACCEPT} className="hidden" onChange={handleDocFile} />
          </div>
          {toggle.answerDocument && (
            <span className="flex w-fit items-center gap-1.5 rounded-theme-sm border border-border bg-canvas px-2 py-1 text-xs text-ink">
              <button type="button" onClick={() => openOrDownloadBrainAttachment(toggle.answerDocument!)} className="max-w-[220px] truncate hover:text-accent hover:underline">
                📎 {toggle.answerDocument.name}
              </button>
              <button type="button" onClick={() => onUpdate({ answerDocument: null })} aria-label="Remove document" className="text-ink-muted hover:text-[#c22a4d]">
                ✕
              </button>
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="url"
              value={toggle.answerLink?.url ?? ""}
              onChange={(e) => onUpdate({ answerLink: e.target.value.trim() ? { id: toggle.answerLink?.id ?? crypto.randomUUID(), url: e.target.value } : null })}
              placeholder="🔗 Link a document/website — https://…"
              className="w-full min-w-0 flex-1 rounded-theme-sm border border-border bg-canvas px-2 py-1.5 text-xs text-ink focus:outline focus:outline-2 focus:outline-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubpointSection({ subpoint, path, label, onUpdate, onAddChild, onDelete }: SubpointSectionProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const didInitNotesRef = useRef(false);
  const fontLevelRef = useRef(DEFAULT_FONT_LEVEL);

  // Seeds the contentEditable's DOM content once — after that it's
  // uncontrolled, same reasoning as Vocabulary's meaning field: re-setting
  // innerHTML on every render would fight the browser's own cursor
  // position. SubpointSection is remounted per subpoint (keyed by
  // subpoint.id in brain-info-panel.tsx) so this still resets correctly
  // when switching subpoints.
  useEffect(() => {
    if (didInitNotesRef.current || !notesRef.current) return;
    didInitNotesRef.current = true;
    notesRef.current.innerHTML = subpoint.notes;
    autosizeNotesField(notesRef.current);
  }, [subpoint.notes]);

  function commitNotes() {
    onUpdate((sp) => ({ ...sp, notes: notesRef.current?.innerHTML ?? sp.notes }));
  }

  // mousedown+preventDefault keeps focus (and the current text selection)
  // on the contentEditable instead of shifting it to the toolbar button,
  // which is what execCommand needs to apply to the right range.
  function runToolbarCommand(run: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      notesRef.current?.focus();
      document.execCommand("styleWithCSS", false, "true");
      run();
    };
  }

  function updateToggle(toggleId: string, patch: Partial<BrainToggle>) {
    onUpdate((sp) => ({ ...sp, toggles: sp.toggles.map((t) => (t.id === toggleId ? { ...t, ...patch } : t)) }));
  }

  function addToggle() {
    onUpdate((sp) => ({ ...sp, toggles: [...sp.toggles, emptyToggle(crypto.randomUUID())] }));
  }

  function removeToggle(toggleId: string) {
    onUpdate((sp) => ({ ...sp, toggles: sp.toggles.filter((t) => t.id !== toggleId) }));
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      if (file.size > MAX_BRAIN_ATTACHMENT_BYTES) {
        window.alert(`"${file.name}" is larger than 5MB and can't be attached.`);
        continue;
      }
      const attachment = await readFileAsBrainAttachment(file);
      onUpdate((sp) => ({ ...sp, attachments: [...sp.attachments, attachment] }));
    }
  }

  function removeAttachment(id: string) {
    onUpdate((sp) => ({ ...sp, attachments: sp.attachments.filter((a) => a.id !== id) }));
  }

  function removeLink(id: string) {
    onUpdate((sp) => ({ ...sp, links: sp.links.filter((l) => l.id !== id) }));
  }

  return (
    <div id={subpointAnchorId(path)} className="scroll-mt-4 rounded-theme border border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0 rounded-theme-sm bg-accent-soft px-1.5 py-0.5 text-xs font-bold text-accent">{label}</span>
        <input
          type="text"
          value={subpoint.title}
          onChange={(e) => onUpdate((sp) => ({ ...sp, title: e.target.value }))}
          placeholder="Subpoint title"
          className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold text-ink focus:outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete subpoint ${label}`}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-[#c22a4d]"
        >
          ✕
        </button>
      </div>

      <div className="mt-2.5 flex flex-col gap-1.5">
        {subpoint.toggles.map((t) => (
          <ToggleItem key={t.id} toggle={t} onUpdate={(patch) => updateToggle(t.id, patch)} onDelete={() => removeToggle(t.id)} />
        ))}
        <button
          type="button"
          onClick={addToggle}
          className="w-full rounded-theme-sm border border-dashed border-accent px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft"
        >
          + Add toggle
        </button>
      </div>

      {/* Document-editor style content area — a formatting toolbar over a
          contentEditable, matching Vocabulary's word-meaning field, instead
          of a bare textarea. */}
      <div className="mt-2.5 rounded-theme-sm border border-border bg-canvas p-2">
        <div className="mb-1.5 flex flex-wrap items-center gap-1 border-b border-dashed border-border pb-1.5">
          <span className="text-[0.62rem] text-ink-muted">Highlight:</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              tabIndex={-1}
              title={`Highlight ${c.label}`}
              onMouseDown={runToolbarCommand(() => document.execCommand("hiliteColor", false, c.value))}
              className="h-4 w-4 flex-shrink-0 rounded-full border border-border"
              style={{ background: c.value }}
            />
          ))}
          <button
            type="button"
            tabIndex={-1}
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
              tabIndex={-1}
              title={`Text ${c.label}`}
              onMouseDown={runToolbarCommand(() => document.execCommand("foreColor", false, c.value))}
              className="h-4 w-4 flex-shrink-0 rounded-full border border-border"
              style={{ background: c.value }}
            />
          ))}
          <span className="mx-0.5 h-3 w-px flex-shrink-0 bg-border" />
          <button
            type="button"
            tabIndex={-1}
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
            tabIndex={-1}
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
          ref={notesRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={commitNotes}
          onInput={(e) => autosizeNotesField(e.currentTarget)}
          data-placeholder="Notes for this subpoint…"
          className="brain-notes-editable min-h-[3em] w-full rounded-theme-sm border-none bg-transparent p-0.5 text-sm leading-relaxed text-ink focus:outline-none"
        />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-theme-sm border border-dashed border-accent px-2 py-1 text-[0.7rem] font-semibold text-accent hover:bg-accent-soft"
        >
          📎 Upload file
        </button>
        <input ref={fileInputRef} type="file" accept={BRAIN_ATTACHMENT_ACCEPT} multiple className="hidden" onChange={handleFilesSelected} />
        <button
          type="button"
          onClick={() => setLinkDialogOpen(true)}
          className="rounded-theme-sm border border-dashed border-accent px-2 py-1 text-[0.7rem] font-semibold text-accent hover:bg-accent-soft"
        >
          🔗 Link document/website
        </button>
        <button
          type="button"
          onClick={onAddChild}
          className="ml-auto rounded-theme-sm border border-border px-2 py-1 text-[0.7rem] font-semibold text-ink-muted hover:bg-surface-alt hover:text-ink"
        >
          + Add sub-subpoint
        </button>
      </div>

      {(subpoint.attachments.length > 0 || subpoint.links.length > 0) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {subpoint.attachments.map((a) => (
            <span key={a.id} className="flex items-center gap-1 rounded-theme-sm border border-border bg-canvas px-2 py-1 text-xs text-ink">
              <button type="button" onClick={() => openOrDownloadBrainAttachment(a)} className="max-w-[180px] truncate hover:text-accent hover:underline">
                📎 {a.name}
              </button>
              <button type="button" onClick={() => removeAttachment(a.id)} aria-label={`Remove ${a.name}`} className="text-ink-muted hover:text-[#c22a4d]">
                ✕
              </button>
            </span>
          ))}
          {subpoint.links.map((l) => (
            <span key={l.id} className="flex items-center gap-1 rounded-theme-sm border border-border bg-canvas px-2 py-1 text-xs text-ink">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="max-w-[180px] truncate hover:text-accent hover:underline">
                🔗 {l.url}
              </a>
              <button type="button" onClick={() => removeLink(l.id)} aria-label="Remove link" className="text-ink-muted hover:text-[#c22a4d]">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {linkDialogOpen && (
        <AddBrainLinkDialog
          links={subpoint.links}
          onClose={() => setLinkDialogOpen(false)}
          onSave={(links) => {
            onUpdate((sp) => ({ ...sp, links }));
            setLinkDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
