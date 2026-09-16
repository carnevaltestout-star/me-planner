import { getDb } from "@/lib/db/client";

// Two storage layers currently coexist mid-migration: most features still
// persist straight to window.localStorage under a "me-planner:" prefix (see
// the *-storage.ts modules), while a few (Theme, Music, Goals/To-Dos,
// Brain — see src/lib/db/) have moved onto real SQLite tables via
// tauri-plugin-sql. Data never crosses origins/installs on its own either
// way — the desktop app, the Android app, and a plain browser dev tab each
// get their own separate localStorage AND their own sqlite file — so this
// is the bridge: export walks every "me-planner:"-prefixed key (not a
// hardcoded list, so it never goes stale as features add new ones) PLUS
// every real SQL table, into one JSON file the user can carry between
// installs; import reads that file back into both layers and reloads so
// every provider re-hydrates from it. The SQL half is best-effort — a
// plain browser tab (no Tauri IPC) simply won't have any tables to read,
// and export/import still work fine for everything still on localStorage.
const PREFIX = "me-planner:";
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface ExportPayload {
  exportedAt: string;
  entries: Record<string, string>;
  tables?: Record<string, Record<string, unknown>[]>;
}

function collectEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return entries;
}

async function listUserTables(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_sqlx_%'",
  );
  return rows.map((r) => r.name).filter((name) => IDENTIFIER_RE.test(name));
}

async function collectTables(): Promise<Record<string, Record<string, unknown>[]>> {
  try {
    const db = await getDb();
    const tables = await listUserTables();
    const result: Record<string, Record<string, unknown>[]> = {};
    for (const table of tables) {
      // Table names come from sqlite_master itself (just validated above),
      // not from anywhere user-controlled — safe to interpolate.
      result[table] = await db.select<Record<string, unknown>[]>(`SELECT * FROM ${table}`);
    }
    return result;
  } catch {
    // Not running inside a real Tauri window (no IPC bridge) — export still
    // proceeds with just the localStorage half.
    return {};
  }
}

export async function exportAppData(): Promise<void> {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    entries: collectEntries(),
    tables: await collectTables(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `me-planner-backup-${payload.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function countStoredEntries(): number {
  return Object.keys(collectEntries()).length;
}

// Exported for legacy-migration.ts's bundled-seed path — a fresh install's
// first launch replays a real export's `tables` payload the same way a
// manual "Import backup" would, instead of duplicating this logic.
export async function applyTables(tables: Record<string, Record<string, unknown>[]>): Promise<number> {
  let imported = 0;
  try {
    const db = await getDb();
    const realTables = new Set(await listUserTables());
    for (const [table, rows] of Object.entries(tables)) {
      if (!realTables.has(table) || !Array.isArray(rows)) continue;
      const columnRows = await db.select<{ name: string }[]>(`PRAGMA table_info(${table})`);
      const validColumns = new Set(columnRows.map((c) => c.name));
      await db.execute(`DELETE FROM ${table}`);
      for (const row of rows) {
        const cols = Object.keys(row).filter((c) => IDENTIFIER_RE.test(c) && validColumns.has(c));
        if (cols.length === 0) continue;
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        await db.execute(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`, cols.map((c) => row[c]));
        imported += 1;
      }
    }
  } catch {
    // Not running inside a real Tauri window — nothing to restore here,
    // the localStorage half of the import still applies below.
  }
  return imported;
}

async function applyPayload(parsed: Partial<ExportPayload>): Promise<{ imported: number }> {
  if (!parsed || typeof parsed !== "object" || !parsed.entries || typeof parsed.entries !== "object") {
    throw new Error("That file doesn't look like a me-planner backup.");
  }
  const entries = Object.entries(parsed.entries).filter(
    ([key, value]) => key.startsWith(PREFIX) && typeof value === "string",
  );
  for (const [key, value] of entries) {
    window.localStorage.setItem(key, value as string);
  }
  const tableRows = parsed.tables && typeof parsed.tables === "object" ? await applyTables(parsed.tables) : 0;
  return { imported: entries.length + tableRows };
}

export async function importAppData(file: File): Promise<{ imported: number }> {
  const text = await file.text();
  return applyPayload(JSON.parse(text) as Partial<ExportPayload>);
}
