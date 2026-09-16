import { useState } from "react";
import { downloadNoteAsText } from "@/lib/notes/notes-download";
import type { Note } from "@/lib/notes/notes-types";
import TrashIcon from "./trash-icon";

interface NoteEditorProps {
  note: Note;
  onUpdate: (title: string, content: string) => void;
  onDelete: () => void;
  onBack: () => void;
}

// The dedicated "open a note" screen — title + one big plain-text field,
// mirroring Easy Notes' editor layout. Checkboxes/bullets are authored as
// raw "[ ]"/"[x]"/"-" text here (not rendered/clickable) — the overview
// card is where those render as real, clickable checkboxes; see
// NoteContentView. Desktop gets a wider, centered column instead of the
// mobile-style edge-to-edge field, so a line of text doesn't stretch
// uncomfortably far on the panel's full 80%-of-screen width.
export default function NoteEditor({ note, onUpdate, onDelete, onBack }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  function commit() {
    onUpdate(title, content);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Title lives in the header row itself, right next to the back
          arrow — not as its own row down in the body — and claims the
          row's remaining space (flex-1) so download/delete still land at
          the far right without a separate spacer. */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-black/10 px-3 py-2.5 dark:border-white/10">
        <button
          type="button"
          onClick={() => {
            commit();
            onBack();
          }}
          aria-label="Back to all notes"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          ←
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          placeholder="Title"
          className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold placeholder:opacity-40 focus:outline-none"
        />
        <button
          type="button"
          title="Download as .txt"
          aria-label="Download note as text file"
          onClick={() => downloadNoteAsText(note)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-sm opacity-60 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
        >
          ⬇
        </button>
        <button
          type="button"
          title="Move to Trash"
          aria-label="Delete note"
          onClick={() => {
            onDelete();
            onBack();
          }}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-sm opacity-60 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
        >
          <TrashIcon className="h-[17px] w-[17px]" />
        </button>
      </div>

      {/* Desktop: left edge matches the title input's own left edge above
          (header padding 12px + back button 28px + gap 8px = 48px) — reads
          as a direct continuation of the title on a wide panel. Mobile: that
          same 48px offset ate up a third of the panel's much narrower width,
          reading as text pushed toward the middle of the screen instead of
          flush left — so mobile instead matches the header's own left
          padding (12px), i.e. lines up with the back arrow itself. */}
      <div className="flex w-full max-w-[560px] flex-1 flex-col overflow-y-auto py-3 pl-3 pr-3 md:py-5 md:pl-[48px] md:pr-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={commit}
          placeholder={"Write something…\n\nTip: start a line with \"[ ]\" for a checkbox or \"-\" for a bullet point."}
          className="min-h-[50vh] flex-1 resize-none border-0 bg-transparent text-sm leading-relaxed placeholder:opacity-40 focus:outline-none"
        />
      </div>
    </div>
  );
}
