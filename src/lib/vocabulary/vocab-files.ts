import type { VocabAttachment } from "./vocab-types";

// Extension-based rather than MIME-based — several of these (.tex, .rtf,
// .odt) don't have MIME types every browser recognizes for the `accept`
// attribute, but extensions always work.
export const ATTACHMENT_ACCEPT = ".csv,.doc,.docx,.txt,.pdf,.rtf,.tex,.odt,.pptx";

// Generous per-file cap — attachments are stored as base64 data URLs
// directly in localStorage, which has a real (~5-10MB total) quota.
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export function readFileAsAttachment(file: File): Promise<VocabAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: reader.result as string,
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
export function openOrDownloadAttachment(attachment: VocabAttachment) {
  const blobUrl = URL.createObjectURL(dataUrlToBlob(attachment.dataUrl));
  const win = window.open(blobUrl, "_blank");
  if (win) {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    return;
  }
  URL.revokeObjectURL(blobUrl);
  if (window.confirm(`This file can't be opened in a new tab.\n\nDownload "${attachment.name}"?`)) {
    const a = document.createElement("a");
    a.href = attachment.dataUrl;
    a.download = attachment.name;
    a.click();
  }
}

export function openLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Always downloads directly rather than trying to open a tab first — this
// is the explicit "save a copy" action (its own button next to the file
// name), as opposed to openOrDownloadAttachment's open-first fallback.
export function downloadAttachment(attachment: VocabAttachment) {
  const a = document.createElement("a");
  a.href = attachment.dataUrl;
  a.download = attachment.name;
  a.click();
}
