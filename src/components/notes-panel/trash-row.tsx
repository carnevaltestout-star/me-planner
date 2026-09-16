import type { Note } from "@/lib/notes/notes-types";
import TrashIcon from "./trash-icon";

interface TrashRowProps {
  note: Note;
  retentionDays: number;
  onRestore: () => void;
  onDeleteForever: () => void;
}

function daysLeft(deletedAt: string, retentionDays: number): number {
  const elapsedMs = Date.now() - new Date(deletedAt).getTime();
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  return Math.max(0, retentionDays - elapsedDays);
}

// Read-only preview — a trashed note isn't editable in place, only
// restorable or permanently deletable, so there's no editable body or
// title input here, just its title and a plain text snippet.
export default function TrashRow({ note, retentionDays, onRestore, onDeleteForever }: TrashRowProps) {
  const snippet = note.content.replace(/\s+/g, " ").trim().slice(0, 80);
  return (
    <div className="flex flex-col gap-1 border-b border-black/10 px-3 py-2.5 opacity-70 dark:border-white/10">
      <div className="flex items-center gap-1.5">
        {/* Restore sits right next to the name (not off with the other
            actions on the trailing edge) — the name+restore pair reads as
            one unit, "bring this one back", separate from the
            days-left/delete-forever pair on the right. */}
        <span className="min-w-0 flex-shrink truncate text-sm font-bold">{note.title || "Untitled note"}</span>
        <button
          type="button"
          onClick={onRestore}
          className="flex-shrink-0 rounded-full border border-current px-2 py-0.5 text-[0.68rem] font-semibold hover:bg-black/5 dark:hover:bg-white/10"
        >
          Restore
        </button>
        <span className="flex-1" />
        {/* Mobile: stacked with the icon on top and the days-left text
            centered underneath it (flex-col-reverse keeps this DOM order —
            text, then button — while visually flipping it) — the pairing
            reads clearer as its own small stacked unit on a narrow row.
            Desktop: back to the original side-by-side layout, text then
            icon, matching how it's always looked there. */}
        <div className="flex flex-shrink-0 flex-col-reverse items-center gap-0.5 md:flex-row md:gap-1.5">
          <span className="text-[0.6rem] opacity-70 md:text-[0.65rem]">({`Deleted in ${daysLeft(note.deletedAt!, retentionDays)} days`})</span>
          <button
            type="button"
            aria-label="Delete forever"
            title="Delete forever"
            onClick={onDeleteForever}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black/10 opacity-80 hover:bg-black/20 hover:opacity-100 active:bg-black/25 dark:bg-white/10 dark:hover:bg-white/20 dark:active:bg-white/25"
          >
            <TrashIcon className="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
      {snippet && <span className="truncate text-xs opacity-60">{snippet}</span>}
    </div>
  );
}
