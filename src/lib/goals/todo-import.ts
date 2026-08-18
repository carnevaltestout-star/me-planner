import * as Tesseract from "tesseract.js";

export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
export const IMPORT_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateImportFile(file: File): string | null {
  if (!IMPORT_ACCEPTED_TYPES.includes(file.type)) {
    return "Please upload a PNG, JPG, or WEBP image.";
  }
  if (file.size > IMPORT_MAX_FILE_BYTES) {
    return "That image is over 5MB — try a smaller one.";
  }
  return null;
}

// Strips common list markers OCR picks up literally (bullets, numbering,
// checkboxes) so "- call susan" or "1) call susan" both become "call susan".
const LIST_MARKER_RE = /^\s*(?:[-*•●▪‣◦]|\d+[.)]|\[[ xX]?\])\s*/;

export function linesFromOcrText(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(LIST_MARKER_RE, "").trim())
    .filter(Boolean);
}

export function linesFromCommaText(raw: string): string[] {
  return raw
    .split(",")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Runs entirely client-side (WASM) via Tesseract.js — no server round-trip,
// no API key, nothing sent anywhere. The engine + language data are fetched
// lazily on first use (not bundled into the app), then cached by the
// browser for next time.
export async function extractTextFromImage(file: File): Promise<string> {
  const result = await Tesseract.recognize(file, "eng");
  return result.data.text;
}
