import { useState } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import type { AttachmentFolder } from "@/lib/attachments/attachment-types";
import { FILE_DRAG_TYPE } from "./attachment-file-card";
import { FolderIcon } from "./attachment-icons";

// Same native-HTML5-drag-payload approach as the Calendar tab's preset
// cards (see planner/preset-bar.tsx) — a plain custom MIME-ish type string,
// since both drag source and drop target are our own code.
export const FOLDER_DRAG_TYPE = "application/x-me-planner-attachment-folder-id";

interface AttachmentFoldersRowProps {
  folders: AttachmentFolder[];
  fileCounts: Record<string, number>;
  onOpenFolder: (folderId: string) => void;
  onAddFolder: () => void;
  onDeleteFolder: (folder: AttachmentFolder) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onFileDropped: (fileId: string, folderId: string) => void;
}

export default function AttachmentFoldersRow({
  folders,
  fileCounts,
  onOpenFolder,
  onAddFolder,
  onDeleteFolder,
  onReorder,
  onFileDropped,
}: AttachmentFoldersRowProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const theme = useTheme();
  // Retro/kawaii both use the bigger, shadowed "classic folder" glyph (see
  // FolderIcon) sitting straight on the page — no card chrome behind it —
  // whereas the plain theme keeps its bordered card around the thin-outline
  // icon.
  const skinned = theme.retro || theme.kawaii;

  return (
    <div className="flex flex-shrink-0 items-center gap-2.5 overflow-x-auto pb-1 sm:gap-3.5">
      <button
        type="button"
        onClick={onAddFolder}
        aria-label="New folder"
        title="New folder"
        className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast hover:brightness-105 active:brightness-95 sm:h-14 sm:w-14"
        style={{ boxShadow: "var(--shadow-theme), 0 4px 10px rgba(0,0,0,0.22)" }}
      >
        {/* Arcade-button plus: two chunky raised bars instead of a plain "+"
            glyph, each with its own inset highlight/shadow for a beveled,
            pressable-key look. Sized ~30% smaller than the button's first
            pass. */}
        <span
          className="absolute h-2 w-6 rounded-full sm:h-2.5 sm:w-7"
          style={{ background: "var(--color-accent-contrast)", boxShadow: "inset 0 -2px 2px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.6)" }}
        />
        <span
          className="absolute h-6 w-2 rounded-full sm:h-7 sm:w-2.5"
          style={{ background: "var(--color-accent-contrast)", boxShadow: "inset 0 -2px 2px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.6)" }}
        />
      </button>

      {folders.map((folder) => (
        <div
          key={folder.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(FOLDER_DRAG_TYPE, folder.id);
            e.dataTransfer.effectAllowed = "move";
            setDraggingId(folder.id);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDragOverId(null);
          }}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(FOLDER_DRAG_TYPE) && !e.dataTransfer.types.includes(FILE_DRAG_TYPE)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== folder.id) setDragOverId(folder.id);
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (related && e.currentTarget.contains(related)) return;
            setDragOverId((id) => (id === folder.id ? null : id));
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverId(null);
            const draggedFolderId = e.dataTransfer.getData(FOLDER_DRAG_TYPE);
            if (draggedFolderId) {
              if (draggedFolderId !== folder.id) onReorder(draggedFolderId, folder.id);
              return;
            }
            const droppedFileId = e.dataTransfer.getData(FILE_DRAG_TYPE);
            if (droppedFileId) onFileDropped(droppedFileId, folder.id);
          }}
          onClick={() => onOpenFolder(folder.id)}
          title="Click to open, drag onto another folder to reorder, or drop a file here to file it"
          className={`group relative flex flex-shrink-0 cursor-grab flex-col items-center justify-center text-center transition-opacity active:cursor-grabbing ${
            skinned
              ? "h-20 w-20 gap-1.5 rounded-theme p-1 sm:h-24 sm:w-28"
              : "h-16 w-[4.5rem] gap-1 rounded-theme border border-border bg-surface p-1.5 shadow-theme sm:h-20 sm:w-24 sm:gap-1.5"
          } ${draggingId === folder.id ? "opacity-40" : ""} ${
            dragOverId === folder.id && draggingId !== folder.id ? "ring-2 ring-accent" : ""
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder);
            }}
            aria-label={`Delete ${folder.name}`}
            className="absolute right-1 top-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-muted opacity-0 hover:text-[#c22a4d] group-hover:opacity-100"
          >
            ×
          </button>
          <FolderIcon className={skinned ? "h-12 w-12 flex-shrink-0 sm:h-16 sm:w-16" : "h-7 w-7 flex-shrink-0 text-accent sm:h-9 sm:w-9"} />
          <span className="line-clamp-2 w-full break-words text-[0.62rem] font-bold leading-tight text-ink sm:text-[0.7rem]">
            {folder.name}
          </span>
          {(fileCounts[folder.id] ?? 0) > 0 && (
            <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-semibold text-accent-contrast">
              {fileCounts[folder.id]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
