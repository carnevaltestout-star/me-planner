import type { BrainAttachment } from "./brain-types";

// Extension-based rather than MIME-based — several of these don't have MIME
// types every browser recognizes for the `accept` attribute, but extensions
// always work. Same convention as vocabulary's ATTACHMENT_ACCEPT.
export const BRAIN_ATTACHMENT_ACCEPT = ".csv,.doc,.docx,.txt,.pdf,.rtf,.tex,.odt,.pptx";

// Generous per-file cap — attachments are stored as base64 data URLs
// directly in localStorage, which has a real (~5-10MB total) quota.
export const MAX_BRAIN_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export function readFileAsBrainAttachment(file: File): Promise<BrainAttachment> {
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

// A toggle's answer image is meant to be pasted straight from the
// clipboard (screenshot, copied image) rather than always needing a file
// picker — reads the first image item off a paste event, if any.
export function readImageFromClipboard(e: { clipboardData: DataTransfer | null }): Promise<BrainAttachment | null> {
  const items = Array.from(e.clipboardData?.items ?? []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) return Promise.resolve(null);
  const file = imageItem.getAsFile();
  if (!file) return Promise.resolve(null);
  return readFileAsBrainAttachment(file);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Tries to open the file in a new tab first; falls back to an explicit
// download confirmation if the browser refuses — same reasoning as
// vocabulary's openOrDownloadAttachment (data: URLs can't be window.open'd
// directly in Chrome, so this goes through a blob: URL instead).
export function openOrDownloadBrainAttachment(attachment: BrainAttachment) {
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
