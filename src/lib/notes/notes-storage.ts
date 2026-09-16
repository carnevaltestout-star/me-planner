import { loadNotesSettings } from "./notes-settings-storage";
import type { Note } from "./notes-types";

// Same localStorage-as-stand-in-for-SQLite pattern as every other
// not-yet-migrated feature.
export const NOTES_STORAGE_KEY = "me-planner:notes";

// A note saved before the card-overview redesign has a "contentHtml"
// field (rich text from a contentEditable field) instead of today's plain
// "content" — best-effort strip its tags down to plain text rather than
// silently dropping whatever was in it.
function legacyHtmlToPlainText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function normalize(raw: Partial<Note> & { contentHtml?: string }): Note | null {
  if (typeof raw.id !== "string") return null;
  const content = typeof raw.content === "string" ? raw.content : typeof raw.contentHtml === "string" ? legacyHtmlToPlainText(raw.contentHtml) : "";
  return {
    id: raw.id,
    title: typeof raw.title === "string" ? raw.title : "",
    content,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
    deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : null,
  };
}

// Trashed notes older than the configured retention period (Settings ->
// General) are dropped for good the next time notes are loaded — no
// separate cleanup job needed, this just runs as a side effect of the
// normal load path.
function purgeExpiredTrash(notes: Note[]): Note[] {
  const { trashRetentionDays } = loadNotesSettings();
  const cutoff = Date.now() - trashRetentionDays * 24 * 60 * 60 * 1000;
  return notes.filter((n) => !n.deletedAt || new Date(n.deletedAt).getTime() >= cutoff);
}

export function loadNotes(): Note[] {
  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return purgeExpiredTrash(parsed.map(normalize).filter((n): n is Note => n !== null));
    }
  } catch {
    // fall through to empty
  }
  return [];
}

export function saveNotes(notes: Note[]) {
  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}
