import Database from "@tauri-apps/plugin-sql";

// Must match the URL registered with add_migrations(...) in src-tauri/src/db.rs
// exactly, or the plugin resolves to a different file with no migrations run.
const DB_URL = "sqlite:me-planner.db";

let dbPromise: Promise<Database> | null = null;

// SQLite doesn't enforce foreign keys (or run ON DELETE CASCADE) unless this
// is set per-connection — without it, deleting a brain node would silently
// orphan its subpoints/toggles/attachments instead of cascading.
async function connect(): Promise<Database> {
  const db = await Database.load(DB_URL);
  await db.execute("PRAGMA foreign_keys = ON");
  return db;
}

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    // If connect() rejects (no Tauri IPC bridge yet, a transient plugin
    // hiccup at startup, etc.), don't cache the rejected promise itself —
    // that would permanently poison every future call for the rest of the
    // session, since a rejected promise never resolves differently on a
    // second `await`. Clearing it back to null lets the next call retry.
    dbPromise = connect().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}
