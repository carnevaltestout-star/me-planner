import { useState } from "react";
import { fileBaseName, fileExtension, isImageFile } from "@/lib/attachments/attachment-files";
import type { AttachmentFile } from "@/lib/attachments/attachment-types";
import { DownloadIcon, FileIcon } from "./attachment-icons";
import { TrashIcon } from "@/features/goals/goal-todo-icons";

// Same native-HTML5-drag approach as the folder row — a file card is a drag
// *source* (dropped onto a folder card, dragged up to the top bar to move
// it back out, or dropped onto another file card to reorder — see
// attachments-page.tsx) and, for that last case, also a drop *target* for
// other file cards.
export const FILE_DRAG_TYPE = "application/x-me-planner-attachment-file-id";

interface AttachmentFileCardProps {
  file: AttachmentFile;
  onOpen: () => void;
  onDownload: () => void;
  onDeleteRequest: () => void;
  // Only set where reordering makes sense (the normal browsing grid, not
  // search results) — called with the dragged file's id when another file
  // card is dropped onto this one.
  onReorder?: (draggedFileId: string) => void;
}

export default function AttachmentFileCard({ file, onOpen, onDownload, onDeleteRequest, onReorder }: AttachmentFileCardProps) {
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const ext = fileExtension(file.name);
  const baseName = fileBaseName(file.name);
  const image = isImageFile(file.name);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(FILE_DRAG_TYPE, file.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => {
        setDragging(false);
        setDragOver(false);
      }}
      onDragOver={(e) => {
        if (!onReorder || !e.dataTransfer.types.includes(FILE_DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!dragOver) setDragOver(true);
      }}
      onDragLeave={(e) => {
        const related = e.relatedTarget as Node | null;
        if (related && e.currentTarget.contains(related)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        if (!onReorder) return;
        const draggedId = e.dataTransfer.getData(FILE_DRAG_TYPE);
        if (!draggedId) return;
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        onReorder(draggedId);
      }}
      onClick={onOpen}
      title={file.name}
      className={`group relative flex aspect-square cursor-grab flex-col overflow-hidden rounded-theme border border-border bg-surface shadow-theme transition-opacity active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      } ${dragOver && !dragging ? "ring-2 ring-accent" : ""}`}
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
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-accent">
            {ext || "file"}
          </span>
        </div>
      )}

      <div className="flex-shrink-0 border-t border-border bg-surface px-1.5 py-1">
        {/* The base name truncates with an ellipsis; the extension is a
            separate non-shrinking span so it's always visible — a long
            name reads as "some-long-nam….pdf" instead of losing the
            extension entirely to the ellipsis. */}
        <p className="flex min-w-0 text-[0.68rem] leading-tight text-ink" title={file.name}>
          <span className="min-w-0 flex-1 truncate">{baseName}</span>
          {ext && <span className="flex-shrink-0">.{ext}</span>}
        </p>
      </div>
    </div>
  );
}
