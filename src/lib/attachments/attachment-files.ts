import type { AttachmentFile } from "./attachment-types";

export const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.odt,.xls,.xlsx,.xlsm,.ods,.ppt,.pptx,.odp,.jpg,.jpeg,.png,.gif,.webp,.svg";

// Generous per-file cap — attachments are stored as base64 data URLs
// directly in localStorage, which has a real (~5-10MB total) quota.
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

// Everything before the extension — used to truncate long filenames
// without ever losing the extension itself (see AttachmentFileCard).
export function fileBaseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

export function isImageFile(name: string): boolean {
  return IMAGE_EXTENSIONS.has(fileExtension(name));
}

export function readFileAsAttachment(file: File, folderId: string | null): Promise<AttachmentFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: reader.result as string,
        folderId,
        addedAt: new Date().toISOString(),
      });
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Tries to open the file in a new tab first; if the browser refuses (popup
// blocked, or a type it won't render inline), falls back to an explicit
// download confirmation instead of failing silently. Goes through a blob:
// URL rather than window.open(dataUrl) directly — Chrome blocks a new tab
// from navigating straight to a data: URL, so that would silently no-op.
export function openOrDownloadAttachment(file: AttachmentFile) {
  const blobUrl = URL.createObjectURL(dataUrlToBlob(file.dataUrl));
  const win = window.open(blobUrl, "_blank");
  if (win) {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    return;
  }
  URL.revokeObjectURL(blobUrl);
  if (window.confirm(`This file can't be opened in a new tab.\n\nDownload "${file.name}"?`)) {
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name;
    a.click();
  }
}

export function downloadAttachment(file: AttachmentFile) {
  const a = document.createElement("a");
  a.href = file.dataUrl;
  a.download = file.name;
  a.click();
}
