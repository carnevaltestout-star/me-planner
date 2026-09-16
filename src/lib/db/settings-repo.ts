import { getDb } from "@/lib/db/client";

// Backs every single-row "preference" value (theme, music, card order,
// favorite colors, per-feature UI-nav state, etc.) as one JSON-encoded row
// each in app_settings, mirroring how these lived as individual localStorage
// keys before — real per-item tables are for actual content, not app prefs.
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>("SELECT value FROM app_settings WHERE key = $1", [key]);
  if (rows.length === 0) return fallback;
  try {
    return JSON.parse(rows[0].value) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", [
    key,
    JSON.stringify(value),
  ]);
}
