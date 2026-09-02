import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { fileBaseName, fileExtension, isImageFile } from "@/lib/attachments/attachment-files";
import type { AttachmentFile } from "@/lib/attachments/attachment-types";
import { DownloadIcon, FileIcon, PencilIcon } from "./attachment-icons";
import { TrashIcon } from "@/features/goals/goal-todo-icons";

// dnd-kit pointer-based drag (see attachments-page.tsx for the shared
// DndContext/sensors) rather than native HTML5 draggable/dragstart/drop —
// the native API never fires from a touchscreen tap/drag on mobile
// browsers and WebViews, which is why drag-and-drop and even plain tapping
// a card (a draggable="true" element eats the tap gesture on Android
// before it ever becomes a "click") were both broken on mobile. A file
// card is a drag *source* (dropped onto a folder card, dragged up to the
// exit zone to move it back out, or dropped onto another file card to
// reorder — see attachments-page.tsx) and, for that last case, also a drop
// *target* for other file cards.
function fileDragId(fileId: string): string {
  return `file:${fileId}`;
}

interface AttachmentFileCardProps {
  file: AttachmentFile;
  onOpen: () => void;
  onDownload: () => void;
  onDeleteRequest: () => void;
  // Only true where reordering makes sense (the normal browsing grid, not
  // search results) — makes this card a valid drop target for another file
  // card; the actual reorder happens centrally in attachments-page.tsx's
  // DndContext onDragEnd handler.
  reorderable?: boolean;
  // Renames the file in place (extension stays fixed — only the base name
  // is editable). Omit to hide the pencil affordance entirely.
  onRename?: (newName: string) => void;
}

export default function AttachmentFileCard({ file, onOpen, onDownload, onDeleteRequest, reorderable, onRename }: AttachmentFileCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const ext = fileExtension(file.name);
  const baseName = fileBaseName(file.name);
  const image = isImageFile(file.name);

  const dragId = fileDragId(file.id);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: "file", fileId: file.id },
  });
  // Only a valid drop target for other files where reordering makes sense
  // (the search-results grid passes reorderable={false}) — still draggable
  // there so a search hit can be dragged into a folder.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dragId,
    data: { type: "file", fileId: file.id },
    disabled: !reorderable,
  });

  function setRefs(node: HTMLDivElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  function startRename() {
    setDraftName(baseName);
    setRenaming(true);
  }

  function commitRename() {
    setRenaming(false);
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === baseName) return;
    onRename?.(ext ? `${trimmed}.${ext}` : trimmed);
  }

  return (
    <div
      ref={setRefs}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      title={file.name}
      style={{ transform: CSS.Translate.toString(transform), touchAction: "none" }}
      className={`group relative flex aspect-square cursor-grab flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme transition-opacity active:cursor-grabbing ${
        isDragging ? "z-10 opacity-40" : ""
      } ${isOver && !isDragging ? "ring-2 ring-accent" : ""}`}
    >
      <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          aria-label={`Download ${file.name}`}
          title="Download"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-ink-muted hover:text-accent"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest();
          }}
          aria-label={`Delete ${file.name}`}
          title="Delete"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-ink-muted hover:text-[#c22a4d]"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {image ? (
        <div className="relative flex-1 overflow-hidden bg-canvas">
          <img src={file.dataUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-2">
          <FileIcon className="h-9 w-9 text-ink-muted" />
        </div>
      )}

      <div className="flex-shrink-0 border-t border-border bg-surface px-1.5 py-1">
        {/* The base name truncates with an ellipsis; the extension is a
            separate non-shrinking span so it's always visible — a long
            name reads as "some-long-nam….pdf" instead of losing the
            extension entirely to the ellipsis. Renaming only ever edits the
            base name — the extension stays fixed either side of it. */}
        <div className="flex min-w-0 items-center gap-1 text-[0.68rem] leading-tight text-ink" title={file.name}>
          {onRename && !renaming && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startRename();
              }}
              aria-label={`Rename ${file.name}`}
              title="Rename"
              className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center text-ink-muted hover:text-accent"
            >
              <PencilIcon className="h-3 w-3" />
            </button>
          )}
          {renaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                else if (e.key === "Escape") setRenaming(false);
              }}
              className="min-w-0 flex-1 border-none bg-transparent p-0 text-[0.68rem] leading-tight text-ink focus:outline-none"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate">{baseName}</span>
          )}
          {ext && <span className="flex-shrink-0">.{ext}</span>}
        </div>
      </div>
    </div>
  );
}
