import { downloadNoteAsText } from "@/lib/notes/notes-download";
import { toggleCheckboxAtLine } from "@/lib/notes/notes-markdown";
import type { Note } from "@/lib/notes/notes-types";
import NoteContentView from "./note-content-view";
import TrashIcon from "./trash-icon";

interface NoteCardProps {
  note: Note;
  onOpen: () => void;
  onToggleCheckbox: (nextContent: string) => void;
  onDelete: () => void;
}

const PREVIEW_MAX_LINES = 5;

function formatCreatedDate(createdAt: string): string {
  const d = new Date(createdAt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

// One card in the overview grid — Google-Keep-style: title + a preview of
// the first few lines, checkboxes in that preview are directly clickable
// without opening the note (per spec), opening the note happens on any
// other part of the card. Fixed height + overflow-hidden at every
// breakpoint — every card the same size regardless of how much content it
// actually holds (a natural-height mobile card made rows visibly uneven
// whenever neighboring notes had different amounts of content).
export default function NoteCard({ note, onOpen, onToggleCheckbox, onDelete }: NoteCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="group relative flex h-[170px] cursor-pointer flex-col gap-1.5 rounded-theme-sm border border-black/10 bg-white p-3 text-left shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-[#1f1f1f] md:h-[190px]"
    >
      <button
        type="button"
        aria-label="Delete note"
        title="Move to Trash"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded opacity-0 hover:bg-black/10 group-hover:opacity-60 group-hover:hover:opacity-100 dark:hover:bg-white/10"
      >
        <TrashIcon className="h-[17px] w-[17px]" />
      </button>
      <button
        type="button"
        aria-label="Download note as text file"
        title="Download as .txt"
        onClick={(e) => {
          e.stopPropagation();
          downloadNoteAsText(note);
        }}
        className="absolute bottom-1.5 right-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sm opacity-0 hover:bg-black/10 group-hover:opacity-60 group-hover:hover:opacity-100 dark:hover:bg-white/10"
      >
        ⬇
      </button>
      <h3 className="m-0 flex-shrink-0 truncate pr-6 text-sm font-bold">{note.title || "Untitled note"}</h3>
      <div className="min-h-0 flex-1 overflow-hidden">
        <NoteContentView
          content={note.content}
          maxLines={PREVIEW_MAX_LINES}
          onToggleCheckbox={(lineIndex) => onToggleCheckbox(toggleCheckboxAtLine(note.content, lineIndex))}
        />
      </div>
      {/* Same faint text treatment as the Trash view's "(Deleted in X days)"
          — text-[0.65rem] opacity-70 — for visual consistency across the
          two card-adjacent metadata labels. */}
      <span className="flex-shrink-0 text-center text-[0.65rem] opacity-70">{formatCreatedDate(note.createdAt)}</span>
    </div>
  );
}
