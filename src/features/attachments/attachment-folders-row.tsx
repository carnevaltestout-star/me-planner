import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "@/components/theme-provider/theme-context";
import type { AttachmentFolder } from "@/lib/attachments/attachment-types";
import { FolderIcon, NewFolderIcon } from "./attachment-icons";

// dnd-kit pointer-based drag (see attachments-page.tsx for the shared
// DndContext/sensors) — same reasoning as the file card: native HTML5
// draggable/dragover/drop never fires from a touchscreen drag on mobile,
// so folder reordering and "drop a file onto a folder" both need a
// touch-compatible approach instead.
function folderDragId(folderId: string): string {
  return `folder:${folderId}`;
}

interface AttachmentFoldersRowProps {
  folders: AttachmentFolder[];
  fileCounts: Record<string, number>;
  onOpenFolder: (folderId: string) => void;
  onAddFolder: () => void;
  onDeleteFolder: (folder: AttachmentFolder) => void;
}

function FolderCard({
  folder,
  fileCount,
  skinned,
  onOpenFolder,
  onDeleteFolder,
}: {
  folder: AttachmentFolder;
  fileCount: number;
  skinned: boolean;
  onOpenFolder: (folderId: string) => void;
  onDeleteFolder: (folder: AttachmentFolder) => void;
}) {
  const dragId = folderDragId(folder.id);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { type: "folder", folderId: folder.id },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dragId,
    data: { type: "folder", folderId: folder.id },
  });

  function setRefs(node: HTMLDivElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  return (
    <div
      ref={setRefs}
      {...attributes}
      {...listeners}
      onClick={() => onOpenFolder(folder.id)}
      title="Tap to open, drag onto another folder to reorder, or drop a file here to file it"
      style={{ transform: CSS.Translate.toString(transform), touchAction: "none" }}
      className={`group relative flex flex-shrink-0 cursor-grab flex-col items-center justify-center text-center transition-opacity active:cursor-grabbing ${
        skinned
          ? "h-20 w-20 gap-1.5 rounded-theme p-1 sm:h-24 sm:w-28"
          : "h-16 w-[4.5rem] gap-1 rounded-theme border border-border bg-surface p-1.5 shadow-theme sm:h-20 sm:w-24 sm:gap-1.5"
      } ${isDragging ? "opacity-40" : ""} ${isOver && !isDragging ? "ring-2 ring-accent" : ""}`}
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
      {fileCount > 0 && (
        <span className="absolute left-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-semibold text-accent-contrast">
          {fileCount}
        </span>
      )}
    </div>
  );
}

export default function AttachmentFoldersRow({
  folders,
  fileCounts,
  onOpenFolder,
  onAddFolder,
  onDeleteFolder,
}: AttachmentFoldersRowProps) {
  const theme = useTheme();
  // Retro/kawaii/tryout all use the bigger, shadowed folder glyph (see
  // FolderIcon) sitting straight on the page — no card chrome behind it —
  // whereas the plain theme keeps its bordered card around the thin-outline
  // icon.
  const skinned = theme.retro || theme.kawaii || theme.tryout;

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5 pb-1 sm:gap-3.5">
      <button
        type="button"
        onClick={onAddFolder}
        aria-label="New folder"
        title="New folder"
        className={`flex flex-shrink-0 items-center justify-center rounded-theme border-2 border-dashed border-accent text-accent hover:bg-accent-soft ${
          skinned ? "h-20 w-20 sm:h-24 sm:w-28" : "h-16 w-[4.5rem] sm:h-20 sm:w-24"
        }`}
      >
        <NewFolderIcon className={skinned ? "h-10 w-10 sm:h-12 sm:w-12" : "h-7 w-7 sm:h-9 sm:w-9"} />
      </button>

      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          fileCount={fileCounts[folder.id] ?? 0}
          skinned={skinned}
          onOpenFolder={onOpenFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}
