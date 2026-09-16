export const NOTES_SETTINGS_STORAGE_KEY = "me-planner:notes-settings";

export interface NotesSettings {
  // How many days a note sits in Trash before being purged for good — see
  // purgeExpiredTrash in notes-storage.ts. Editable from Settings ->
  // General; this is just the fallback for a first run / a malformed value.
  trashRetentionDays: number;
}

export const DEFAULT_NOTES_SETTINGS: NotesSettings = { trashRetentionDays: 90 };

export function loadNotesSettings(): NotesSettings {
  try {
    const raw = window.localStorage.getItem(NOTES_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const days = Number(parsed?.trashRetentionDays);
      if (Number.isFinite(days) && days > 0) return { trashRetentionDays: Math.round(days) };
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_NOTES_SETTINGS;
}

export function saveNotesSettings(settings: NotesSettings) {
  window.localStorage.setItem(NOTES_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
