import type { AttachmentFile, AttachmentFolder, AttachmentsData } from "./attachment-types";

// Same localStorage-as-stand-in-for-SQLite pattern as planner-storage.ts.
export const ATTACHMENTS_STORAGE_KEY = "me-planner:mock-attachments";

function seedFolders(): AttachmentFolder[] {
  return [
    { id: crypto.randomUUID(), name: "Wichtiges", parentId: null },
    { id: crypto.randomUUID(), name: "Inspirationen", parentId: null },
    { id: crypto.randomUUID(), name: "Skills", parentId: null },
    { id: crypto.randomUUID(), name: "Sonstiges", parentId: null },
  ];
}

function normalizeFolder(raw: Partial<AttachmentFolder>): AttachmentFolder | null {
  if (!raw.id) return null;
  return { id: raw.id, name: raw.name ?? "Untitled", parentId: raw.parentId ?? null };
}

function normalizeFile(raw: Partial<AttachmentFile>): AttachmentFile | null {
  if (!raw.id || !raw.dataUrl) return null;
  return {
    id: raw.id,
    name: raw.name ?? "file",
    mimeType: raw.mimeType ?? "application/octet-stream",
    dataUrl: raw.dataUrl,
    folderId: raw.folderId ?? null,
    addedAt: raw.addedAt ?? new Date().toISOString(),
  };
}

export function loadAttachments(): AttachmentsData {
  try {
    const raw = window.localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const folders = Array.isArray(parsed.folders)
        ? parsed.folders.map(normalizeFolder).filter((f: AttachmentFolder | null): f is AttachmentFolder => f !== null)
        : [];
      const files = Array.isArray(parsed.files)
        ? parsed.files.map(normalizeFile).filter((f: AttachmentFile | null): f is AttachmentFile => f !== null)
        : [];
      return { folders, files };
    }
  } catch {
    // fall through to seed data
  }
  return { folders: seedFolders(), files: [] };
}

export function saveAttachments(data: AttachmentsData) {
  window.localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(data));
}
