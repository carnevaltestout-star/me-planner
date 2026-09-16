export interface Note {
  id: string;
  title: string;
  // Plain text with lightweight markdown — "[ ]"/"[x]" checkbox lines and
  // "-"/"*" bullet lines, parsed by notes-markdown.ts. Not HTML anymore
  // (was, before the card-overview redesign — see notes-storage.ts's
  // normalize() for the one-time migration of any old contentHtml notes).
  content: string;
  createdAt: string;
  updatedAt: string;
  // null = active (shown in the Notes tab). Set to the deletion timestamp
  // when moved to Trash instead of being removed outright — purged for
  // good once the configured retention period has passed (see
  // notes-settings-storage.ts and purgeExpiredTrash in notes-storage.ts).
  deletedAt: string | null;
}

export function emptyNote(id: string): Note {
  const now = new Date().toISOString();
  return { id, title: "", content: "", createdAt: now, updatedAt: now, deletedAt: null };
}
