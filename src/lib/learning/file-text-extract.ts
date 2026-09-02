// Pulls plain text out of a handful of common document formats so Story
// Memory's upload dialog can accept more than copy-paste. Kept separate from
// the dialog component the same way story-content.ts is kept separate from
// story-memory-game.tsx — this is content-extraction logic, not UI.
import * as pdfjsLib from "pdfjs-dist";
// Vite's `?url` suffix gives us a URL to the worker file it bundles
// alongside the app, rather than needing a CDN (which wouldn't work
// offline in the packaged Tauri app) or inlining the whole worker.
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

async function extractFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }
  return pageTexts.join("\n\n");
}

// .odt is a zip archive with the document body in content.xml, text wrapped
// in <text:p> paragraph elements. Using the "*" namespace wildcard (match
// local name "p" regardless of namespace URI) instead of hardcoding the
// OpenDocument namespace URI, since that's a bit more forgiving of version
// differences between ODT producers.
async function extractFromOdt(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const contentXml = await zip.file("content.xml")?.async("string");
  if (!contentXml) throw new Error("That doesn't look like a valid .odt file.");
  const doc = new DOMParser().parseFromString(contentXml, "application/xml");
  const paragraphs = Array.from(doc.getElementsByTagNameNS("*", "p"));
  return paragraphs.map((p) => p.textContent ?? "").join("\n");
}

// .docx is the same zip-of-XML idea, body in word/document.xml, text runs
// wrapped in <w:t> elements.
async function extractFromDocx(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) throw new Error("That doesn't look like a valid .docx file.");
  const doc = new DOMParser().parseFromString(documentXml, "application/xml");
  const textRuns = Array.from(doc.getElementsByTagNameNS("*", "t"));
  return textRuns.map((t) => t.textContent ?? "").join(" ");
}

export const ACCEPTED_FILE_TYPES = ".txt,.md,.pdf,.odt,.docx";

// Falls back to plain-text reading for anything not explicitly handled
// (.md, .rtf saved as plain text, etc.) rather than rejecting it outright —
// worst case it shows raw markup, which the player can just edit/trim in
// the textarea afterward same as any other imperfect paste.
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractFromPdf(file);
  if (name.endsWith(".odt")) return extractFromOdt(file);
  if (name.endsWith(".docx")) return extractFromDocx(file);
  return file.text();
}
