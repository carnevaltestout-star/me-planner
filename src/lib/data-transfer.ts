// Every feature persists straight to window.localStorage under a
// "me-planner:" prefix (see the *-storage.ts modules) — there's no database
// file backing any of it, tauri-plugin-sql is registered but never actually
// used. That also means data never crosses origins: the desktop dev server
// (http://localhost:1420) and the installed Android app (https://tauri.localhost)
// each get their own separate localStorage, so testing in a browser and then
// installing a fresh APK looks like "my entries vanished" even though
// nothing was lost — it's just sitting in the other origin's storage.
//
// This is the bridge: export walks every "me-planner:"-prefixed key (not a
// hardcoded list, so it never goes stale as features add new keys) into one
// JSON file the user can carry between installs/origins; import reads that
// file back in and reloads so every provider re-hydrates from it.
const PREFIX = "me-planner:";

interface ExportPayload {
  exportedAt: string;
  entries: Record<string, string>;
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

export function exportAppData(): void {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    entries: collectEntries(),
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

export async function importAppData(file: File): Promise<{ imported: number }> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<ExportPayload>;
  if (!parsed || typeof parsed !== "object" || !parsed.entries || typeof parsed.entries !== "object") {
    throw new Error("That file doesn't look like a me-planner backup.");
  }
  const entries = Object.entries(parsed.entries).filter(
    ([key, value]) => key.startsWith(PREFIX) && typeof value === "string",
  );
  for (const [key, value] of entries) {
    window.localStorage.setItem(key, value as string);
  }
  return { imported: entries.length };
}
