import { useMemo, useRef, useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SearchIcon } from "@/features/goals/goal-todo-icons";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  downloadAttachment,
  openOrDownloadAttachment,
  readFileAsAttachment,
} from "@/lib/attachments/attachment-files";
import { loadAttachments, saveAttachments } from "@/lib/attachments/attachment-storage";
import type { AttachmentFile, AttachmentFolder, AttachmentsData } from "@/lib/attachments/attachment-types";
import AttachmentDeleteConfirm from "./attachment-delete-confirm";
import AttachmentFileCard from "./attachment-file-card";
import AttachmentFoldersRow from "./attachment-folders-row";
import { BackArrowIcon, FileIcon, FolderIcon, MoveUpIcon } from "./attachment-icons";
import NewFolderDialog from "./new-folder-dialog";

// Drag payloads carried on each dnd-kit draggable/droppable's `data` — see
// AttachmentFileCard / AttachmentFoldersRow for the drag sources and the
// EXIT_ZONE_ID droppable below for the "move up a level" target. Using
// dnd-kit (pointer events under the hood, with a MouseSensor + TouchSensor)
// instead of native HTML5 drag-and-drop is what makes this work on
// touchscreens — HTML5's draggable/dragstart/dragover/drop never fires
// from a touch gesture on mobile browsers/WebViews.
type DragData =
  | { type: "file"; fileId: string }
  | { type: "folder"; folderId: string }
  | { type: "exit" };

const EXIT_ZONE_ID = "attachments-exit-zone";

// All ids from a folder down through every level of its subfolders —
// deleting a folder takes its whole subtree with it.
function collectDescendantFolderIds(folders: AttachmentFolder[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        grew = true;
      }
    }
  }
  return ids;
}

export default function AttachmentsPage() {
  const [data, setData] = useState<AttachmentsData>(() => loadAttachments());
  // The navigation stack of folder ids from root down to wherever we are —
  // folders can nest arbitrarily deep, so a single id isn't enough; the
  // last entry is the folder currently open, and Back pops one level.
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<AttachmentFile | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<AttachmentFolder | null>(null);
  const [osFilesOver, setOsFilesOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mouse needs a small movement threshold so a plain click still registers
  // as a click; touch needs a short hold (plus its own tolerance) so a
  // scroll gesture on the page isn't mistaken for a drag — same
  // activation-constraint pattern already used for dnd-kit elsewhere in
  // this app (see book-reviews-page.tsx).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const { setNodeRef: setExitZoneRef, isOver: dragOverExit } = useDroppable({
    id: EXIT_ZONE_ID,
    data: { type: "exit" } satisfies DragData,
  });

  function persist(next: AttachmentsData) {
    setData(next);
    saveAttachments(next);
  }

  const fileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of data.files) {
      if (f.folderId) counts[f.folderId] = (counts[f.folderId] ?? 0) + 1;
    }
    return counts;
  }, [data.files]);

  const activeFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1] : null;
  const activeFolder = activeFolderId ? (data.folders.find((f) => f.id === activeFolderId) ?? null) : null;
  const childFolders = useMemo(
    () => data.folders.filter((f) => f.parentId === activeFolderId),
    [data.folders, activeFolderId],
  );
  const queryTrimmed = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!queryTrimmed) return [];
    return data.files.filter((f) => f.name.toLowerCase().includes(queryTrimmed));
  }, [data.files, queryTrimmed]);

  const visibleFiles = data.files.filter((f) => f.folderId === activeFolderId);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const accepted: AttachmentFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        window.alert(`"${file.name}" is larger than 5MB and can't be uploaded.`);
        continue;
      }
      accepted.push(await readFileAsAttachment(file, activeFolderId));
    }
    if (accepted.length > 0) persist({ ...data, files: [...data.files, ...accepted] });
  }

  function handleAddFolder(name: string) {
    persist({ ...data, folders: [...data.folders, { id: crypto.randomUUID(), name, parentId: activeFolderId }] });
    setCreatingFolder(false);
  }

  function handleOpenFolder(folderId: string) {
    setFolderPath((path) => [...path, folderId]);
  }

  function handleBack() {
    setFolderPath((path) => path.slice(0, -1));
  }

  function reorderFolders(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const fromIndex = data.folders.findIndex((f) => f.id === draggedId);
    const toIndex = data.folders.findIndex((f) => f.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...data.folders];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist({ ...data, folders: next });
  }

  function reorderFiles(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const fromIndex = data.files.findIndex((f) => f.id === draggedId);
    const toIndex = data.files.findIndex((f) => f.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...data.files];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist({ ...data, files: next });
  }

  function moveFileToFolder(fileId: string, folderId: string | null) {
    persist({ ...data, files: data.files.map((f) => (f.id === fileId ? { ...f, folderId } : f)) });
  }

  // One shared drag-end handler for every draggable/droppable pair on this
  // page (file cards, folder cards, and the "move up a level" exit zone) —
  // each side's `data` (see DragData above) says what it is, so this just
  // matches active-type/over-type combinations to the right action instead
  // of each component wiring its own onDrop the way the old native-HTML5
  // version did.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DragData | undefined;
    if (!activeData || !overData) return;

    if (activeData.type === "folder" && overData.type === "folder") {
      reorderFolders(activeData.folderId, overData.folderId);
      return;
    }
    if (activeData.type === "file" && overData.type === "folder") {
      moveFileToFolder(activeData.fileId, overData.folderId);
      return;
    }
    if (activeData.type === "file" && overData.type === "file") {
      reorderFiles(activeData.fileId, overData.fileId);
      return;
    }
    if (activeData.type === "file" && overData.type === "exit" && activeFolder) {
      moveFileToFolder(activeData.fileId, activeFolder.parentId);
    }
  }

  function handleDeleteFile(file: AttachmentFile) {
    persist({ ...data, files: data.files.filter((f) => f.id !== file.id) });
    setPendingDeleteFile(null);
  }

  function renameFile(fileId: string, newName: string) {
    persist({ ...data, files: data.files.map((f) => (f.id === fileId ? { ...f, name: newName } : f)) });
  }

  function handleDeleteFolder(folder: AttachmentFolder) {
    const doomed = collectDescendantFolderIds(data.folders, folder.id);
    persist({
      folders: data.folders.filter((f) => !doomed.has(f.id)),
      files: data.files.filter((f) => !f.folderId || !doomed.has(f.folderId)),
    });
    const idx = folderPath.indexOf(folder.id);
    if (idx !== -1) setFolderPath((path) => path.slice(0, idx));
    setPendingDeleteFolder(null);
  }

  const uploadButton = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Upload files"
        className="flex h-8 flex-shrink-0 scale-100 items-center gap-1.5 rounded-full border-2 border-accent-contrast/40 bg-accent px-3 text-xs font-bold uppercase tracking-wide text-accent-contrast transition hover:scale-[1.03] hover:brightness-105 active:scale-100 active:brightness-95 sm:h-9 sm:px-3.5 sm:text-sm"
        style={{ boxShadow: "var(--shadow-theme), 0 4px 0 rgba(0,0,0,0.55), 0 6px 12px rgba(0,0,0,0.35)" }}
      >
        <span className="text-sm leading-none sm:text-base">+</span>
        <FileIcon className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
        Upload files
      </button>
    </>
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className="attachments-page-bg relative flex h-full flex-col gap-3 overflow-y-auto p-2 md:gap-4 md:p-4"
        // A real OS file drag (dragged in from Finder/Explorer, or a browser
        // "open files" picker used as a drag source) carries a native "Files"
        // type, delivered through the browser's own native HTML5 drag-and-
        // drop events — a completely separate mechanism from the app-internal
        // drags above (those go through dnd-kit / pointer events so they also
        // work on touch), so this never fires for those and doesn't need to
        // fight their own stopPropagation() calls.
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          if (!osFilesOver) setOsFilesOver(true);
        }}
        onDragLeave={(e) => {
          const related = e.relatedTarget as Node | null;
          if (related && e.currentTarget.contains(related)) return;
          setOsFilesOver(false);
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files.length === 0) return;
          e.preventDefault();
          setOsFilesOver(false);
          handleFilesSelected(e.dataTransfer.files);
        }}
      >
        {osFilesOver && (
          <div className="pointer-events-none absolute inset-2 z-20 flex items-center justify-center rounded-theme border-2 border-dashed border-accent bg-accent-soft/90 md:inset-4">
            <p className="m-0 text-sm font-semibold text-accent">Drop to upload</p>
          </div>
        )}
        <div className="relative flex-shrink-0">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-theme border border-border bg-surface py-2 pl-8 pr-2.5 text-sm text-ink shadow-theme focus:outline focus:outline-2 focus:outline-accent"
          />
        </div>

        {activeFolder && (
          <div className="flex flex-shrink-0 items-center gap-3 overflow-x-auto pb-1">
            <div
              ref={setExitZoneRef}
              title="Drag a file here to move it up one level"
              className={`flex min-w-0 items-center gap-2 rounded-theme px-2 py-1 transition-colors ${
                dragOverExit ? "bg-accent-soft ring-2 ring-accent" : ""
              }`}
            >
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-alt"
              >
                {dragOverExit ? <MoveUpIcon className="h-4 w-4 text-accent" /> : <BackArrowIcon className="h-4 w-4" />}
              </button>
              <FolderIcon className="h-5 w-5 flex-shrink-0 text-accent" />
              <h2 className="m-0 truncate text-base font-semibold text-ink">{activeFolder.name}</h2>
              {dragOverExit && <span className="whitespace-nowrap text-xs font-semibold text-accent">Drop to move up a level</span>}
            </div>
          </div>
        )}

        <AttachmentFoldersRow
          folders={childFolders}
          fileCounts={fileCounts}
          onOpenFolder={handleOpenFolder}
          onAddFolder={() => setCreatingFolder(true)}
          onDeleteFolder={setPendingDeleteFolder}
        />

        <div className="flex flex-shrink-0 items-center overflow-x-auto pb-1">{uploadButton}</div>

        {queryTrimmed ? (
          <>
            <p className="flex-shrink-0 text-xs text-ink-muted">
              {searchResults.length === 0
                ? "No files match your search."
                : `${searchResults.length} file${searchResults.length === 1 ? "" : "s"} found`}
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {searchResults.map((file) => (
                <AttachmentFileCard
                  key={file.id}
                  file={file}
                  onOpen={() => openOrDownloadAttachment(file)}
                  onDownload={() => downloadAttachment(file)}
                  onDeleteRequest={() => setPendingDeleteFile(file)}
                  onRename={(newName) => renameFile(file.id, newName)}
                />
              ))}
            </div>
          </>
        ) : visibleFiles.length === 0 ? (
          <p className="pt-4 text-center text-sm text-ink-muted">No files here yet — tap Upload files to add some.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {visibleFiles.map((file) => (
              <AttachmentFileCard
                key={file.id}
                file={file}
                onOpen={() => openOrDownloadAttachment(file)}
                onDownload={() => downloadAttachment(file)}
                onDeleteRequest={() => setPendingDeleteFile(file)}
                reorderable
                onRename={(newName) => renameFile(file.id, newName)}
              />
            ))}
          </div>
        )}

        {creatingFolder && <NewFolderDialog onSave={handleAddFolder} onClose={() => setCreatingFolder(false)} />}

        {pendingDeleteFile && (
          <AttachmentDeleteConfirm
            title={pendingDeleteFile.name}
            kind="file"
            onCancel={() => setPendingDeleteFile(null)}
            onConfirm={() => handleDeleteFile(pendingDeleteFile)}
          />
        )}

        {pendingDeleteFolder && (
          <AttachmentDeleteConfirm
            title={pendingDeleteFolder.name}
            kind="folder"
            onCancel={() => setPendingDeleteFolder(null)}
            onConfirm={() => handleDeleteFolder(pendingDeleteFolder)}
          />
        )}
      </div>
    </DndContext>
  );
}
