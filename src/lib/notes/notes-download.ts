import type { Note } from "./notes-types";

// Same Blob/URL.createObjectURL/anchor-click mechanism data-transfer.ts's
// exportAppData uses. Content is already plain text (the markdown-lite
// "[ ]"/"-" syntax reads fine as-is in a .txt), no HTML stripping needed.
// Shared by the card grid's per-card download button and the editor's own.
export function downloadNoteAsText(note: Note) {
  const blob = new Blob([`${note.title || "Untitled note"}\n\n${note.content}`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(note.title || "untitled-note").trim().replace(/[^\w\- ]+/g, "").slice(0, 60) || "untitled-note"}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
